import { RefreshCw, ExternalLink, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  html: string | null;
  isGenerating: boolean;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export function PreviewPanel({ html, isGenerating }: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const getViewportWidth = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-ide-panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border bg-ide-sidebar">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preview
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              viewMode === 'desktop' && 'bg-secondary'
            )}
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              viewMode === 'tablet' && 'bg-secondary'
            )}
            onClick={() => setViewMode('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              viewMode === 'mobile' && 'bg-secondary'
            )}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-ide-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-muted/30">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm">Generating your project...</p>
          </div>
        ) : html ? (
          <div
            className={cn(
              'h-full bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300',
              getViewportWidth()
            )}
          >
            <iframe
              key={refreshKey}
              srcDoc={html}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <Monitor className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium mb-2">No Preview Available</p>
            <p className="text-sm max-w-xs">
              Enter a prompt and click "Run Prompt" to generate a project and see it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
