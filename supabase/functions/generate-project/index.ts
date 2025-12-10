import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert full-stack developer. Generate complete, working project code.

CRITICAL JSON RULES:
1. Output ONLY a valid JSON object - no markdown, no code blocks, no explanation
2. All string values must have properly escaped characters:
   - Use \\\\ for backslashes
   - Use \\" for quotes inside strings
   - Use \\n for newlines (not actual line breaks inside string values)
   - Use \\t for tabs
3. Double-check your JSON is valid before responding

DEVELOPMENT RULES:
1. Generate complete, working code - no placeholders
2. Use React 18, TypeScript, Tailwind CSS
3. Keep code simple and clean

OUTPUT FORMAT (raw JSON only):
{"files":{"index.html":"<!DOCTYPE html>...","src/App.tsx":"import React from \\"react\\";..."}}

For simple apps, use a single index.html with embedded styles/scripts.
For React apps, include: index.html, src/main.tsx, src/App.tsx, src/index.css, package.json, vite.config.ts, tsconfig.json, tailwind.config.js`;

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

    // Clean and parse the response
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }
    
    // Try to extract just the JSON object
    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
    }

    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Initial parse failed, attempting repair:', parseError);
      
      // Try to repair common JSON issues
      try {
        // Fix unescaped newlines in strings (common AI mistake)
        let repaired = jsonContent
          .replace(/[\r\n]+/g, '\\n')  // Replace actual newlines with escaped ones
          .replace(/\t/g, '\\t');       // Replace tabs
        
        result = JSON.parse(repaired);
      } catch (repairError) {
        console.error('Repair attempt failed:', repairError);
        throw new Error('Failed to parse generated project structure. Please try again.');
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
