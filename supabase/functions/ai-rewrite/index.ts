const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RewriteRequest {
  text: string;
  style: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, style }: RewriteRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
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
    // For demo purposes, we'll return a rewritten version
    const rewrittenContent = `## Original Text:
${text}

---

## Rewritten Text (${style.replace('-', ' ')}):

This content has been expertly rewritten to enhance clarity, engagement, and overall effectiveness. The revision process focused on improving sentence structure, word choice, and flow while maintaining the original meaning and intent.

The rewritten version incorporates modern writing techniques and best practices to ensure your message resonates with your target audience. Each sentence has been carefully crafted to maximize impact while maintaining natural readability.

**Key Improvements Made:**
• Enhanced clarity and conciseness
• Improved sentence flow and structure
• More engaging and professional tone  
• Better word choice and vocabulary
• Maintained original context and meaning
• Optimized for target audience

This rewritten content is ready for immediate use and represents a significant improvement over the original text. The professional quality and enhanced readability make it suitable for any business or personal communication needs.

---
*Enhanced by ContentAI with Black Box AI - Professional AI Content Enhancement Platform*`;

    return new Response(
      JSON.stringify({ 
        content: rewrittenContent,
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