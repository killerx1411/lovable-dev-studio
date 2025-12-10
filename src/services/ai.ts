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
  // Check for index.html first (simple HTML projects)
  const indexHtml = files['index.html'];
  
  // If it's a standalone HTML file (not referencing external tsx/ts files)
  if (indexHtml && !indexHtml.includes('src="/src/') && !indexHtml.includes("src='/src/")) {
    // Inject any CSS
    let html = indexHtml;
    
    const cssFiles = Object.entries(files).filter(([path]) => 
      path.endsWith('.css') && !path.includes('index.css')
    );

    for (const [, css] of cssFiles) {
      html = html.replace('</head>', `<style>${css}</style></head>`);
    }

    return html;
  }

  // For React/TypeScript projects, create an informative preview
  const appTsx = files['src/App.tsx'] || files['App.tsx'];
  const indexCss = files['src/index.css'] || files['index.css'] || '';
  
  // Extract CSS without @tailwind directives
  const cleanCss = indexCss
    .replace(/@tailwind\s+base;?/g, '')
    .replace(/@tailwind\s+components;?/g, '')
    .replace(/@tailwind\s+utilities;?/g, '')
    .trim();

  // Count generated files
  const fileCount = Object.keys(files).length;
  const fileList = Object.keys(files)
    .filter(f => !f.includes('node_modules'))
    .slice(0, 8)
    .map(f => `<li class="text-slate-400">${f}</li>`)
    .join('');
  const hasMore = Object.keys(files).length > 8;

  if (appTsx) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${cleanCss}
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .preview-card {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 1rem;
      padding: 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .success-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 30px -10px rgba(34, 197, 94, 0.5);
    }
    .success-icon svg { width: 32px; height: 32px; color: white; }
    h2 { color: #f1f5f9; font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem; text-align: center; }
    .subtitle { color: #94a3b8; text-align: center; margin-bottom: 1.5rem; }
    .file-list { 
      background: rgba(15, 23, 42, 0.5);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .file-list-title { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .file-list ul { list-style: none; padding: 0; margin: 0; font-family: ui-monospace, monospace; font-size: 0.875rem; }
    .file-list li { padding: 0.25rem 0; }
    .file-list .more { color: #64748b; font-style: italic; }
    .instructions { 
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 0.5rem;
      padding: 1rem;
    }
    .instructions-title { color: #3b82f6; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }
    .instructions ol { color: #94a3b8; font-size: 0.875rem; padding-left: 1.25rem; margin: 0; }
    .instructions li { margin: 0.25rem 0; }
    .instructions code { background: rgba(0,0,0,0.3); padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <div class="preview-card">
    <div class="success-icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h2>Project Generated!</h2>
    <p class="subtitle">${fileCount} files created successfully</p>
    
    <div class="file-list">
      <div class="file-list-title">Generated Files</div>
      <ul>
        ${fileList}
        ${hasMore ? '<li class="more">...and more</li>' : ''}
      </ul>
    </div>
    
    <div class="instructions">
      <div class="instructions-title">To run the full React app:</div>
      <ol>
        <li>Click the <strong>Export</strong> button (↓)</li>
        <li>Extract the ZIP file</li>
        <li>Run <code>npm install</code></li>
        <li>Run <code>npm run dev</code></li>
      </ol>
    </div>
  </div>
</body>
</html>`;
  }

  return null;
}
