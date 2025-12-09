import { useState } from 'react';
import { Sparkles, Play, Download, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptBarProps {
  onRunPrompt: (prompt: string) => void;
  onExport: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export function PromptBar({ onRunPrompt, onExport, onReset, isGenerating }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onRunPrompt(prompt.trim());
    }
  };

  const placeholderExamples = [
    'Create a todo app with local storage',
    'Build a weather dashboard with API',
    'Make a simple calculator',
    'Create a landing page for a SaaS product',
  ];

  return (
    <div className="bg-ide-sidebar border-b border-ide-border p-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Try: "${placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)]}"`}
            className={cn(
              'w-full bg-secondary/50 border border-ide-border rounded-lg',
              'pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              'transition-all duration-200'
            )}
            disabled={isGenerating}
          />
        </div>

        <Button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            'px-5 py-3 h-auto bg-primary hover:bg-primary/90',
            'shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Prompt
            </>
          )}
        </Button>

        <div className="flex items-center gap-1 border-l border-ide-border pl-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onExport}
            title="Export Project (ZIP)"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onReset}
            title="Reset Workspace"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
