import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert full-stack developer. Your task is to generate complete, working project code based on user prompts.

IMPORTANT RULES:
1. Generate complete, working code - no placeholders or TODOs
2. Use modern best practices (React 18, TypeScript, Tailwind CSS)
3. Include all necessary files for a working project
4. Make the code clean, well-organized, and production-ready
5. Include beautiful, responsive UI with Tailwind CSS
6. Add helpful comments where needed

OUTPUT FORMAT:
You must respond with a valid JSON object containing a "files" property. The files property is an object where keys are file paths and values are file contents.

Example response format:
{
  "files": {
    "index.html": "<!DOCTYPE html>...",
    "src/App.tsx": "import React from 'react'...",
    "src/main.tsx": "import { createRoot }...",
    "src/index.css": "@tailwind base...",
    "package.json": "{ \"name\": \"app\"... }",
    "vite.config.ts": "import { defineConfig }...",
    "tsconfig.json": "{ \"compilerOptions\"... }",
    "tailwind.config.js": "module.exports..."
  }
}

For simple apps that can work with just HTML/CSS/JS, generate a single index.html with embedded styles and scripts.
For React apps, generate the full project structure.

Always include:
- A clear project structure
- All necessary configuration files
- Complete, working code
- Beautiful UI with Tailwind CSS
- Proper TypeScript types`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating project for prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Generate a complete project for: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Parse the JSON response - handle markdown code blocks
    let jsonContent = content;
    
    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    // Try to parse the JSON
    let result;
    try {
      result = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Try to extract JSON object from the response
      const objectMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          result = JSON.parse(objectMatch[0]);
        } catch (e) {
          throw new Error('Failed to parse generated project structure');
        }
      } else {
        throw new Error('Failed to parse generated project structure');
      }
    }

    if (!result.files || typeof result.files !== 'object') {
      throw new Error('Invalid project structure: missing files object');
    }

    console.log('Generated files:', Object.keys(result.files));

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-project:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate project' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
