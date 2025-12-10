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

  // For React/TypeScript projects, try to render them live
  const appTsx = files['src/App.tsx'] || files['App.tsx'];
  const indexCss = files['src/index.css'] || files['index.css'] || '';
  
  // Extract CSS without @tailwind directives
  const cleanCss = indexCss
    .replace(/@tailwind\s+base;?/g, '')
    .replace(/@tailwind\s+components;?/g, '')
    .replace(/@tailwind\s+utilities;?/g, '')
    .replace(/@import\s+[^;]+;/g, '')
    .trim();

  if (appTsx) {
    // Convert TypeScript/JSX to plain JS for browser execution
    // Remove TypeScript types and convert to plain JSX
    let appCode = appTsx
      // Remove import statements (we'll use CDN)
      .replace(/^import\s+.*?;?\s*$/gm, '')
      // Remove export default
      .replace(/export\s+default\s+/, '')
      // Remove TypeScript type annotations
      .replace(/:\s*React\.FC\s*(<[^>]*>)?/g, '')
      .replace(/:\s*\w+(\[\])?(\s*\|[^=]+)?(?=\s*[=,);])/g, '')
      .replace(/<[A-Z]\w*>/g, '') // Remove generic type params
      .replace(/as\s+\w+/g, '')
      .trim();

    // Extract the component name (usually the last function/const declaration)
    const componentMatch = appCode.match(/(?:function|const)\s+(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'App';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${cleanCss}
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    
    // Lucide icons replacement (simple SVG components)
    const createIcon = (path) => ({ className = "", size = 24, ...props }) => 
      React.createElement('svg', { 
        xmlns: "http://www.w3.org/2000/svg", 
        width: size, 
        height: size, 
        viewBox: "0 0 24 24", 
        fill: "none", 
        stroke: "currentColor", 
        strokeWidth: 2, 
        strokeLinecap: "round", 
        strokeLinejoin: "round",
        className,
        ...props 
      }, React.createElement('path', { d: path }));
    
    const Plus = createIcon("M12 5v14M5 12h14");
    const Trash2 = createIcon("M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2");
    const Check = createIcon("M20 6L9 17l-5-5");
    const X = createIcon("M18 6L6 18M6 6l12 12");
    const Edit = createIcon("M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7");
    const Search = createIcon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z");
    const Menu = createIcon("M3 12h18M3 6h18M3 18h18");
    const ChevronDown = createIcon("M6 9l6 6 6-6");
    const ChevronUp = createIcon("M18 15l-6-6-6 6");
    const ChevronRight = createIcon("M9 18l6-6-6-6");
    const ChevronLeft = createIcon("M15 18l-6-6 6-6");
    const Sun = createIcon("M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 100-10 5 5 0 000 10z");
    const Moon = createIcon("M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z");
    const Star = createIcon("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z");
    const Heart = createIcon("M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z");
    const Home = createIcon("M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z");
    const Settings = createIcon("M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z");
    const User = createIcon("M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z");
    const Mail = createIcon("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6");
    const Calendar = createIcon("M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18");
    const Clock = createIcon("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2");
    const Bell = createIcon("M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0");
    const Send = createIcon("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z");
    const Download = createIcon("M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3");
    const Upload = createIcon("M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12");
    const Copy = createIcon("M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1");
    const Share = createIcon("M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13");
    const Link = createIcon("M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71");
    const ExternalLink = createIcon("M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3");
    const Filter = createIcon("M22 3H2l8 9.46V19l4 2v-8.54L22 3z");
    const MoreVertical = createIcon("M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z");
    const ArrowLeft = createIcon("M19 12H5M12 19l-7-7 7-7");
    const ArrowRight = createIcon("M5 12h14M12 5l7 7-7 7");
    const Loader2 = ({ className = "", size = 24, ...props }) => 
      React.createElement('svg', { 
        xmlns: "http://www.w3.org/2000/svg", 
        width: size, 
        height: size, 
        viewBox: "0 0 24 24", 
        fill: "none", 
        stroke: "currentColor", 
        strokeWidth: 2, 
        strokeLinecap: "round", 
        strokeLinejoin: "round",
        className: className + " animate-spin",
        ...props 
      }, React.createElement('path', { d: "M21 12a9 9 0 11-6.219-8.56" }));

    // Simple Button component
    const Button = ({ children, onClick, className = "", variant = "default", size = "default", disabled, type = "button", ...props }) => {
      const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50";
      const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        ghost: "hover:bg-gray-100",
        link: "text-blue-600 underline-offset-4 hover:underline"
      };
      const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      };
      return React.createElement('button', { 
        type,
        onClick, 
        disabled,
        className: baseClasses + " " + (variants[variant] || variants.default) + " " + (sizes[size] || sizes.default) + " " + className,
        ...props 
      }, children);
    };

    // Simple Input component
    const Input = React.forwardRef(({ className = "", type = "text", ...props }, ref) => {
      return React.createElement('input', {
        type,
        className: "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 " + className,
        ref,
        ...props
      });
    });

    // Simple Card components
    const Card = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "rounded-lg border bg-white shadow-sm " + className, ...props }, children);
    const CardHeader = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "flex flex-col space-y-1.5 p-6 " + className, ...props }, children);
    const CardTitle = ({ children, className = "", ...props }) => 
      React.createElement('h3', { className: "text-2xl font-semibold leading-none tracking-tight " + className, ...props }, children);
    const CardDescription = ({ children, className = "", ...props }) => 
      React.createElement('p', { className: "text-sm text-gray-500 " + className, ...props }, children);
    const CardContent = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "p-6 pt-0 " + className, ...props }, children);
    const CardFooter = ({ children, className = "", ...props }) => 
      React.createElement('div', { className: "flex items-center p-6 pt-0 " + className, ...props }, children);

    // Simple Checkbox component
    const Checkbox = ({ checked, onCheckedChange, className = "", ...props }) => 
      React.createElement('input', {
        type: "checkbox",
        checked,
        onChange: (e) => onCheckedChange?.(e.target.checked),
        className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 " + className,
        ...props
      });

    // Simple Label component
    const Label = ({ children, className = "", ...props }) => 
      React.createElement('label', { 
        className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 " + className,
        ...props 
      }, children);

    // Simple Badge component
    const Badge = ({ children, className = "", variant = "default", ...props }) => {
      const variants = {
        default: "bg-blue-600 text-white",
        secondary: "bg-gray-200 text-gray-900",
        destructive: "bg-red-600 text-white",
        outline: "border border-gray-300 text-gray-700"
      };
      return React.createElement('div', { 
        className: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors " + (variants[variant] || variants.default) + " " + className,
        ...props 
      }, children);
    };

    // cn utility
    const cn = (...classes) => classes.filter(Boolean).join(' ');

    ${appCode}

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(${componentName}));
  </script>
</body>
</html>`;
  }

  return null;
}
