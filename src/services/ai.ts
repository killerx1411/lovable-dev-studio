import { supabase } from '@/integrations/supabase/client';
import { GeneratedProject } from '@/types/workspace';

export async function generateProject(prompt: string): Promise<GeneratedProject> {
  const { data, error } = await supabase.functions.invoke('generate-project', {
    body: { prompt },
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate project');
  }

  return data as GeneratedProject;
}

export function buildPreviewHtml(files: Record<string, string>): string | null {
  // Check for index.html first
  const indexHtml = files['index.html'] || files['public/index.html'];
  
  if (indexHtml) {
    // Inject any CSS and JS
    let html = indexHtml;
    
    const cssFiles = Object.entries(files).filter(([path]) => 
      path.endsWith('.css')
    );
    
    const jsFiles = Object.entries(files).filter(([path]) => 
      path.endsWith('.js') && !path.includes('config')
    );

    // Inject CSS
    for (const [, css] of cssFiles) {
      html = html.replace('</head>', `<style>${css}</style></head>`);
    }

    // Inject JS
    for (const [, js] of jsFiles) {
      html = html.replace('</body>', `<script>${js}</script></body>`);
    }

    return html;
  }

  // If no index.html, try to build a basic preview from React/TSX
  const appTsx = files['src/App.tsx'] || files['App.tsx'];
  const mainTsx = files['src/main.tsx'] || files['main.tsx'];
  const indexCss = files['src/index.css'] || files['index.css'] || '';

  if (appTsx) {
    // Create a simple HTML wrapper for static preview
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${indexCss}
    body { margin: 0; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root">
    <div style="padding: 2rem; text-align: center;">
      <h2 style="color: #3B82F6; margin-bottom: 1rem;">React Project Generated</h2>
      <p style="color: #64748B;">
        This is a React/TypeScript project. To run the full app:
      </p>
      <ol style="text-align: left; max-width: 400px; margin: 1rem auto; color: #475569;">
        <li>Export the project as ZIP</li>
        <li>Extract and run <code>npm install</code></li>
        <li>Run <code>npm run dev</code></li>
      </ol>
      <p style="color: #94A3B8; font-size: 0.875rem; margin-top: 1rem;">
        View the generated files in the editor to see the code.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  return null;
}
