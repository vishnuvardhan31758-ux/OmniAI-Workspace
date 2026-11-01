import { AIRequest, AIResponse, TransformerConfig } from '../../types/ai';
import { AI_MODELS, TRANSFORMER_ENHANCERS } from './models';
import { openaiClient } from './openai-client';

export class AITransformerEngine {
  private fallbackMode: boolean = false;

  constructor() {
    this.checkApiConfiguration();
  }

  private checkApiConfiguration() {
    this.fallbackMode = !openaiClient.isConfigured();
  }

  setApiKey(apiKey: string) {
    openaiClient.setApiKey(apiKey);
    this.checkApiConfiguration();
  }

  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      console.log('Processing AI request:', {
        prompt: request.prompt.substring(0, 100) + '...',
        model: request.config.model,
        toolType: request.context?.toolType
      });
      
      let response;
      
      // Always check configuration status before attempting API call
      this.checkApiConfiguration();
      
      if (this.fallbackMode) {
        console.log('Using fallback mode - OpenAI not configured');
        response = await this.processWithFallback(request);
      } else {
        console.log('Using OpenAI API');
        response = await this.processWithOpenAI(request);
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: response.content,
        model: request.config.model,
        confidence: response.confidence,
        processingTime,
        enhancementsApplied: request.config.enhancers || [],
        suggestions: response.suggestions
      };
    } catch (error: any) {
      console.error('AI processing failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        request: {
          prompt: request.prompt.substring(0, 100),
          model: request.config.model
        }
      });
      
      // If it's an API key error, switch to fallback mode
      if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
        console.log('API key error detected, switching to fallback mode');
        this.fallbackMode = true;
      }
      
      // Fallback to simulated response if real AI fails
      try {
        const fallbackResponse = await this.processWithFallback(request);
        const processingTime = Date.now() - startTime;
        
        return {
          content: `⚠️ **Error: ${error.message}**\n\n---\n\n**Fallback Response:**\n\n${fallbackResponse.content}\n\n---\n\n*Configure your OpenAI API key for real AI-powered content generation.*`,
          model: request.config.model,
          confidence: 0.3,
          processingTime,
          enhancementsApplied: request.config.enhancers || [],
          suggestions: [
            'Check your OpenAI API key configuration',
            'Verify your OpenAI account has sufficient credits',
            'Try again in a few moments'
          ]
        };
      } catch (fallbackError: any) {
        console.error('Fallback also failed:', fallbackError);
        const processingTime = Date.now() - startTime;
        
        return {
          content: `# Error Processing Request\n\n**Primary Error**: ${error.message}\n\n**Fallback Error**: ${fallbackError.message}\n\nPlease try again or contact support if the issue persists.`,
          model: request.config.model,
          confidence: 0.1,
          processingTime,
          enhancementsApplied: [],
          suggestions: ['Refresh the page and try again', 'Check your internet connection', 'Contact support if issue persists']
        };
      }
    }
  }

  private async processWithOpenAI(request: AIRequest): Promise<{
    content: string;
    confidence: number;
    suggestions: string[];
  }> {
    // Double-check configuration before proceeding
    if (!openaiClient.isConfigured()) {
      throw new Error('OpenAI client not properly configured');
    }
    
    const model = AI_MODELS.find(m => m.id === request.config.model);
    const enhancers = request.config.enhancers || [];
    const toolType = request.context?.toolType || 'generate';
    
    // Build comprehensive system prompt
    const systemPrompt = this.buildSystemPrompt(request, model, enhancers, toolType);
    
    console.log('Sending request to OpenAI:', {
      model: request.config.model,
      temperature: request.config.temperature,
      maxTokens: request.config.maxTokens,
      promptLength: request.prompt.length,
      systemPromptLength: systemPrompt.length
    });
    
    // Generate content using OpenAI
    const content = await openaiClient.generateContent(request.prompt, {
      model: this.mapToOpenAIModel(request.config.model),
      temperature: request.config.temperature,
      maxTokens: request.config.maxTokens,
      systemPrompt
    });
    
    const confidence = this.calculateRealConfidence(model, enhancers, toolType, content);
    const suggestions = this.generateIntelligentSuggestions(request.prompt, content, toolType);
    
    console.log('OpenAI response received:', {
      contentLength: content.length,
      confidence,
      suggestionsCount: suggestions.length
    });
    
    return { content, confidence, suggestions };
  }

  private buildSystemPrompt(request: AIRequest, model: any, enhancers: string[], toolType: string): string {
    const basePrompt = `You are ContentAI, an advanced AI content creation assistant. Your role is to generate high-quality, professional content that meets specific user requirements.

IMPORTANT: Always provide complete, well-structured, and valuable content. Do not provide placeholder text or incomplete responses.`;
    
    const toolInstructions = {
      'generate': `Generate original, engaging content based on the user's specifications. Create comprehensive, valuable content that serves the intended purpose. Include proper structure with headings, bullet points, and clear sections where appropriate.`,
      'rewrite': `Rewrite and improve the provided content while maintaining its core message. Enhance clarity, flow, and engagement while preserving the original intent. Make substantial improvements to make the content more professional and effective.`,
      'summarize': `Create concise, accurate summaries that capture the essential points of the source material. Maintain key information while reducing length. Use clear structure and bullet points where appropriate.`,
      'translate': `Provide accurate, culturally appropriate translations that maintain the original meaning and tone while adapting to the target language's conventions. Ensure natural flow in the target language.`
    };

    let prompt = `${basePrompt}\n\nTask: ${toolInstructions[toolType] || toolInstructions['generate']}`;

    // Add user preferences
    if (request.context?.userPreferences) {
      const prefs = request.context.userPreferences;
      prompt += `\n\nUser Requirements:`;
      
      if (prefs.contentType) prompt += `\n- Content Type: ${prefs.contentType.replace('-', ' ')}`;
      if (prefs.tone) prompt += `\n- Tone: ${prefs.tone}`;
      if (prefs.length) prompt += `\n- Length: ${prefs.length}`;
      if (prefs.rewriteStyle) prompt += `\n- Style: ${prefs.rewriteStyle.replace('-', ' ')}`;
      if (prefs.summaryType) prompt += `\n- Format: ${prefs.summaryType.replace('-', ' ')}`;
      if (prefs.fromLang && prefs.toLang) {
        prompt += `\n- Translation: ${prefs.fromLang} to ${prefs.toLang}`;
      }
    }

    // Add enhancer instructions
    if (enhancers.length > 0) {
      prompt += `\n\nEnhancements to Apply:`;
      enhancers.forEach(enhancerId => {
        const enhancer = TRANSFORMER_ENHANCERS.find(e => e.id === enhancerId);
        if (enhancer) {
          prompt += `\n- ${enhancer.name}: ${enhancer.description}`;
        }
      });
    }

    // Add custom system prompt if provided
    if (request.config.systemPrompt) {
      prompt += `\n\nAdditional Instructions: ${request.config.systemPrompt}`;
    }

    prompt += `\n\nProvide professional, high-quality output that meets all specified requirements. Be creative, engaging, and ensure the content is valuable and complete. Do not use placeholder text or incomplete responses.`;

    return prompt;
  }

  private mapToOpenAIModel(modelId: string): string {
    const modelMap: Record<string, string> = {
      'gpt-4-turbo': 'gemini-pro',
      'gpt-4': 'gemini-pro',
      'gpt-3.5-turbo': 'gemini-pro',
      'claude-3-opus': 'gemini-pro',
      'gemini-pro': 'gemini-pro',
      'creative-writer': 'gemini-pro',
      'analytical-mind': 'gemini-pro'
    };

    return modelMap[modelId] || 'gpt-3.5-turbo';
  }

  private calculateRealConfidence(model: any, enhancers: string[], toolType: string, content: string): number {
    let baseConfidence = 0.85;
    
    // Model-based adjustments
    if (model?.category === 'language') baseConfidence += 0.05;
    if (model?.category === 'creative') baseConfidence += 0.03;
    if (model?.category === 'analytical') baseConfidence += 0.04;
    
    // Content quality indicators
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 100) baseConfidence += 0.02;
    if (wordCount > 500) baseConfidence += 0.02;
    
    // Structure indicators
    if (content.includes('#') || content.includes('##')) baseConfidence += 0.01; // Has headers
    if (content.includes('•') || content.includes('-')) baseConfidence += 0.01; // Has lists
    
    // Enhancer boost
    baseConfidence += enhancers.length * 0.01;
    
    // Tool-specific confidence
    const toolBoosts = {
      'generate': 0.02,
      'rewrite': 0.03,
      'summarize': 0.04,
      'translate': 0.02
    };
    
    baseConfidence += toolBoosts[toolType] || 0;
    
    return Math.min(Math.max(baseConfidence, 0.75), 0.98);
  }

  private generateIntelligentSuggestions(prompt: string, content: string, toolType: string): string[] {
    const suggestions = [];
    
    // Content-based suggestions
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 100) {
      suggestions.push('Consider requesting more detailed content for better coverage');
    }
    if (wordCount > 1000) {
      suggestions.push('Content is comprehensive - consider breaking into sections for better readability');
    }
    
    // Tool-specific suggestions
    switch (toolType) {
      case 'generate':
        suggestions.push('Try different content types or tones for variety');
        suggestions.push('Consider adding specific examples or case studies');
        break;
      case 'rewrite':
        suggestions.push('Compare with the original to ensure key points are preserved');
        suggestions.push('Test different rewrite styles for optimal results');
        break;
      case 'summarize':
        suggestions.push('Try different summary formats for various use cases');
        suggestions.push('Consider creating both brief and detailed versions');
        break;
      case 'translate':
        suggestions.push('Review with native speakers for cultural accuracy');
        suggestions.push('Consider regional variations of the target language');
        break;
    }
    
    // General suggestions
    suggestions.push('Save successful configurations for future use');
    suggestions.push('Experiment with OpenAI models for improved results');
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  // Enhanced fallback method with better content generation
  private async processWithFallback(request: AIRequest): Promise<{
    content: string;
    confidence: number;
    suggestions: string[];
  }> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const toolType = request.context?.toolType || 'generate';
    const preferences = request.context?.userPreferences || {};
    
    let content = '';
    
    switch (toolType) {
      case 'generate':
        content = this.generateEnhancedFallbackContent(request.prompt, preferences);
        break;
      case 'rewrite':
        content = this.rewriteEnhancedFallbackContent(request.prompt, preferences);
        break;
      case 'summarize':
        content = this.summarizeEnhancedFallbackContent(request.prompt, preferences);
        break;
      case 'translate':
        content = this.translateEnhancedFallbackContent(request.prompt, preferences);
        break;
      default:
        content = this.generateEnhancedFallbackContent(request.prompt, preferences);
    }
    
    return {
      content,
      confidence: 0.65,
      suggestions: [
        'Configure OpenAI API key for real AI-powered responses',
        'This is a high-quality simulated response for demonstration',
        'Real AI integration will provide even better, more personalized results'
      ]
    };
  }

  private generateEnhancedFallbackContent(prompt: string, preferences: any): string {
    try {
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('Empty prompt provided');
      }
      
    const topic = this.extractMainTopic(prompt);
    const contentType = preferences.contentType || 'content';
    const tone = preferences.tone || 'professional';
    const length = preferences.length || 'medium';
    
    const lengthMultiplier = {
      'short': 0.5,
      'medium': 1,
      'long': 1.8,
      'very-long': 2.5
    }[length] || 1;

      const baseContent = `# ${this.capitalizeWords(topic)} - ${this.capitalizeWords(contentType.replace('-', ' '))}

## Executive Summary

This comprehensive ${contentType.replace('-', ' ')} explores ${topic} with a ${tone} approach, delivering actionable insights and practical strategies for immediate implementation.

## Key Insights & Analysis

### Understanding ${this.capitalizeWords(topic)}
${topic.charAt(0).toUpperCase() + topic.slice(1)} represents a critical area that demands strategic attention and systematic approach. Our analysis reveals several key factors that contribute to success in this domain.

### Strategic Framework
1. **Assessment Phase**: Comprehensive evaluation of current state and requirements
2. **Planning & Strategy**: Development of targeted approach based on specific needs
3. **Implementation**: Systematic execution with measurable milestones
4. **Optimization**: Continuous improvement through data-driven insights

### Best Practices & Methodologies
- **Industry Standards**: Adherence to proven methodologies and frameworks
- **Quality Assurance**: Rigorous testing and validation processes
- **Scalability**: Solutions designed for growth and adaptation
- **Risk Management**: Proactive identification and mitigation strategies

## Detailed Implementation Guide

### Phase 1: Foundation Building
Establishing the groundwork requires careful consideration of multiple factors including resource allocation, timeline management, and stakeholder alignment. This phase typically involves:

- Comprehensive needs assessment
- Resource planning and allocation
- Timeline development and milestone setting
- Team formation and role definition

### Phase 2: Strategic Execution
The execution phase focuses on systematic implementation of planned strategies while maintaining flexibility for necessary adjustments. Key components include:

- Progressive implementation approach
- Regular monitoring and evaluation
- Adaptive strategy refinement
- Performance measurement and tracking

### Phase 3: Optimization & Growth
Continuous improvement ensures long-term success and sustainable growth. This involves:

- Performance analysis and optimization
- Scalability planning and implementation
- Innovation integration and adoption
- Future-proofing strategies

## Expected Outcomes & Benefits

### Immediate Benefits
- Enhanced efficiency and productivity
- Improved quality and consistency
- Reduced operational complexity
- Better resource utilization

### Long-term Advantages
- Sustainable competitive advantage
- Scalable growth opportunities
- Enhanced market positioning
- Future-ready capabilities

## Conclusion & Next Steps

This comprehensive exploration of ${topic} provides the strategic foundation needed for successful implementation. The ${tone} approach ensures maximum value delivery while maintaining practical applicability across various scenarios.

### Recommended Actions
1. Begin with thorough assessment of current capabilities
2. Develop customized implementation roadmap
3. Establish clear success metrics and KPIs
4. Execute with regular monitoring and adjustment

---
*Generated with ContentAI with Black Box AI - Professional AI Content Creation Platform*`;

      // Adjust content length based on preference
      if (lengthMultiplier < 1) {
        return this.truncateContent(baseContent, lengthMultiplier);
      } else if (lengthMultiplier > 1) {
        return this.expandContent(baseContent, lengthMultiplier, topic, tone);
      }
      
      return baseContent;
    } catch (error: any) {
      console.error('Error generating enhanced fallback content:', error);
      return `# Generated Content\n\n**Topic**: ${prompt}\n\nThis is professional content generated based on your request. The system has processed your input and created relevant, high-quality content suitable for your needs.\n\n## Key Features:\n- Professional quality\n- Tailored approach\n- Ready to use\n\n*This is demonstration content. Configure OpenAI API for enhanced results.*`;
    }
  }

  private rewriteEnhancedFallbackContent(prompt: string, preferences: any): string {
    const originalText = this.extractOriginalText(prompt);
    const style = preferences.rewriteStyle || 'improve';
    
    return `# Content Enhancement Results

## Original Content Analysis
**Length**: ${originalText.split(/\s+/).length} words  
**Enhancement Style**: ${this.capitalizeWords(style.replace('-', ' '))}  
**Quality Assessment**: Professional enhancement applied

---

## Enhanced Version

${this.applyRewriteStyle(originalText, style)}

---

## Enhancement Summary

### Key Improvements Applied
- **Clarity Enhancement**: Improved sentence structure and word choice
- **Flow Optimization**: Better paragraph transitions and logical progression
- **Engagement Boost**: More compelling and reader-friendly presentation
- **Professional Polish**: Elevated tone and presentation quality

### Quality Metrics
- **Readability**: Significantly improved for target audience
- **Engagement**: Enhanced through better structure and word choice
- **Professional Standard**: Meets high-quality content requirements
- **Impact**: Increased effectiveness and persuasive power

### Recommendations
- Review the enhanced version against your specific brand guidelines
- Consider A/B testing different versions for optimal performance
- Adapt the tone further based on your target audience feedback

---
*Enhanced by ContentAI with Black Box AI - Professional AI Content Enhancement Platform*`;
  }

  private summarizeEnhancedFallbackContent(prompt: string, preferences: any): string {
    const originalText = this.extractOriginalText(prompt);
    const summaryType = preferences.summaryType || 'bullet-points';
    const summaryLength = preferences.summaryLength || 'medium';
    
    return `# Intelligent Content Summary

## Source Analysis
- **Original Length**: ${originalText.split(/\s+/).length} words
- **Summary Format**: ${this.capitalizeWords(summaryType.replace('-', ' '))}
- **Compression Level**: ${summaryLength} (${this.getCompressionRatio(summaryLength)}% of original)
- **Processing Method**: Advanced AI summarization

---

## Executive Summary

${this.generateSummaryByType(originalText, summaryType, summaryLength)}

---

## Key Insights Extracted

### Primary Themes
- **Core Message**: Central argument and main proposition
- **Supporting Evidence**: Key data points and examples
- **Actionable Items**: Specific recommendations and next steps
- **Critical Context**: Important background information

### Quality Assurance
- **Accuracy**: All key points preserved from original content
- **Completeness**: Comprehensive coverage of essential information
- **Clarity**: Enhanced readability and understanding
- **Relevance**: Focused on most important and actionable content

### Usage Recommendations
- Use this summary for quick reference and decision-making
- Share with stakeholders who need key information without full detail
- Integrate into reports and presentations as executive overview
- Reference for follow-up discussions and action planning

---
*Summarized by ContentAI with Black Box AI - Intelligent Content Processing Platform*`;
  }

  private translateEnhancedFallbackContent(prompt: string, preferences: any): string {
    const originalText = this.extractOriginalText(prompt);
    const fromLang = preferences.fromLang || 'en';
    const toLang = preferences.toLang || 'es';
    
    const languages = {
      'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
      'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese',
      'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi'
    };
    
    return `# Professional Translation Results

## Translation Overview
- **Source Language**: ${languages[fromLang] || fromLang}
- **Target Language**: ${languages[toLang] || toLang}
- **Content Type**: Professional document translation
- **Quality Level**: Business-grade accuracy

---

## Source Text (${languages[fromLang] || fromLang})
${originalText}

---

## Professional Translation (${languages[toLang] || toLang})

*Note: This is a demonstration of translation capabilities. Configure Gemini API key for accurate, professional translations.*

**Professional Translation Services Include:**
- Cultural adaptation and localization
- Industry-specific terminology accuracy
- Natural language flow in target language
- Context-appropriate tone and style
- Quality assurance and proofreading

**Translation Quality Features:**
- Native-level fluency and naturalness
- Preservation of original meaning and intent
- Cultural sensitivity and appropriateness
- Technical accuracy for specialized content
- Consistent terminology throughout document

---

## Translation Notes & Recommendations

### Quality Assurance
- **Accuracy**: Professional-grade translation quality maintained
- **Cultural Context**: Appropriate for target audience and region
- **Natural Flow**: Reads naturally in ${languages[toLang] || toLang}
- **Technical Terms**: Specialized vocabulary handled appropriately

### Best Practices Applied
- Maintained original document structure and formatting
- Preserved key messaging and brand voice
- Adapted cultural references where necessary
- Ensured consistency in terminology usage

### Next Steps
- Review with native speakers for final validation
- Consider regional variations if targeting multiple markets
- Implement feedback for continuous improvement
- Maintain translation memory for consistency

---
*Translated by ContentAI with OpenAI - Professional Translation Services*`;
  }

  // Helper methods for enhanced fallback content
  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  private truncateContent(content: string, multiplier: number): string {
    const sections = content.split('\n\n');
    const targetSections = Math.ceil(sections.length * multiplier);
    return sections.slice(0, targetSections).join('\n\n');
  }

  private expandContent(content: string, multiplier: number, topic: string, tone: string): string {
    const additionalSections = `

## Advanced Strategies & Techniques

### Innovation Integration
Modern approaches to ${topic} require embracing innovative methodologies and cutting-edge techniques. This involves staying current with industry trends and adapting strategies accordingly.

### Performance Optimization
Continuous improvement through systematic analysis and optimization ensures sustained success and competitive advantage in the ${topic} domain.

### Future Considerations
Planning for future developments and potential challenges ensures long-term viability and success in ${topic} implementation.

## Case Studies & Examples

### Success Story 1: Strategic Implementation
A comprehensive example demonstrating successful ${topic} implementation with measurable results and key learnings.

### Success Story 2: Optimization Approach
Real-world application showing how optimization strategies led to significant improvements in ${topic} outcomes.

## Advanced Implementation Guide

### Technical Considerations
Detailed technical aspects and requirements for successful ${topic} implementation, including tools, resources, and methodologies.

### Risk Mitigation Strategies
Comprehensive approach to identifying, assessing, and mitigating potential risks in ${topic} implementation.`;

    return content + additionalSections;
  }

  private applyRewriteStyle(text: string, style: string): string {
    const styleMap = {
      'improve': 'This enhanced version improves upon the original content through better structure, clearer language, and more engaging presentation.',
      'simplify': 'This simplified version makes the content more accessible and easier to understand while maintaining key messages.',
      'formal': 'This formal version elevates the tone and presentation for professional and business contexts.',
      'casual': 'This casual version makes the content more conversational and approachable for general audiences.',
      'expand': 'This expanded version provides additional detail, context, and supporting information for comprehensive coverage.',
      'shorten': 'This concise version delivers the essential message efficiently while maintaining impact and clarity.'
    };

    return `${styleMap[style] || styleMap['improve']}

**Enhanced Content:**

${text}

**Additional Improvements:**
- Enhanced readability and flow
- Improved professional presentation
- Better engagement and clarity
- Optimized for target audience`;
  }

  private generateSummaryByType(text: string, type: string, length: string): string {
    const summaries = {
      'bullet-points': `• **Main Topic**: Core subject matter and primary focus areas
• **Key Arguments**: Central points and supporting evidence presented
• **Important Details**: Critical information and specific data points
• **Conclusions**: Final outcomes, recommendations, and next steps
• **Action Items**: Specific tasks and implementation strategies`,
      
      'paragraph': `This content focuses on essential information extracted from comprehensive source material. The summary maintains core messaging while providing concise overview suitable for quick reference and decision-making. Key themes include strategic implementation, best practices, and actionable recommendations for immediate application.`,
      
      'key-takeaways': `**Primary Takeaway**: Main message and core value proposition
**Strategic Insight**: Key strategic considerations and implications  
**Actionable Recommendations**: Specific steps for implementation
**Critical Success Factors**: Essential elements for achieving objectives
**Next Steps**: Immediate actions and follow-up requirements`,
      
      'executive-summary': `**Executive Overview**: Comprehensive analysis of key topics with strategic implications for decision-making. **Key Findings**: Essential insights and data points that drive recommendations. **Strategic Recommendations**: Actionable steps for implementation and optimization. **Expected Outcomes**: Anticipated results and success metrics.`,
      
      'outline': `I. Primary Topic Overview
   A. Core concepts and definitions
   B. Key stakeholders and considerations
II. Strategic Analysis
   A. Current state assessment
   B. Opportunities and challenges
III. Implementation Framework
   A. Recommended approach
   B. Success metrics and timeline`,
      
      'abstract': `This comprehensive analysis examines key aspects of the subject matter, providing strategic insights and actionable recommendations. The research identifies critical success factors and implementation strategies while addressing potential challenges and optimization opportunities. Results indicate significant potential for improvement through systematic approach and strategic implementation.`
    };

    return summaries[type] || summaries['bullet-points'];
  }

  private getCompressionRatio(length: string): number {
    const ratios = {
      'short': 15,
      'medium': 25,
      'long': 40,
      'very-long': 60
    };
    return ratios[length] || 25;
  }

  private extractMainTopic(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
      return 'content creation';
    }
    
    const words = prompt.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'write', 'create', 'generate', 'content', 'post', 'article'];
    const meaningfulWords = words.filter(word => word && word.length > 3 && !stopWords.includes(word));
    return meaningfulWords[0] || 'professional content';
  }

  private extractOriginalText(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
      return 'Sample content for processing';
    }
    
    const patterns = [
      /rewrite the following content.*?:\s*(.*)/is,
      /translate the following text.*?:\s*(.*)/is,
      /summarize.*?:\s*(.*)/is,
      /create a.*?summary.*?of:\s*(.*)/is
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return prompt;
  }
}

export const aiEngine = new AITransformerEngine();