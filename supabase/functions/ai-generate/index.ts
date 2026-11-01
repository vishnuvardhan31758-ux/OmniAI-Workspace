const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerateRequest {
  prompt: string;
  contentType: string;
  tone: string;
  length: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, contentType, tone, length }: GenerateRequest = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Here you would integrate with OpenAI or another AI service
    // For demo purposes, we'll return a structured response
    const generatedContent = `# Generated ${contentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}

**Prompt**: ${prompt}

**Content (${tone} tone, ${length} length):**

This is professionally generated content based on your specifications. The AI has carefully crafted this response to match your requested tone of "${tone}" and length preference of "${length}".

## Key Points:

• **Engaging Opening**: Captures attention from the first sentence
• **Clear Structure**: Well-organized content with logical flow  
• **Target Audience**: Tailored for your specific audience needs
• **Call to Action**: Includes compelling next steps
• **SEO Optimization**: Incorporates relevant keywords naturally

## Content Body:

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Conclusion:

This generated content provides a solid foundation that can be further refined based on your specific requirements and brand guidelines. The structure and tone have been optimized for maximum engagement with your target audience.

---
*Generated with ContentAI with Black Box AI - Professional AI Content Creation Platform*`;

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        success: true 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});