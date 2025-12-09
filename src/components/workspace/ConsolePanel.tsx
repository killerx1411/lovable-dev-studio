import { ConsoleLog } from '@/types/workspace';
import { Trash2, Terminal, Info, CheckCircle, AlertTriangle, XCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClear: () => void;
}

const getLogIcon = (type: ConsoleLog['type']) => {
  switch (type) {
    case 'info':
      return <Info className="h-4 w-4 text-primary" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-ide-success" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-ide-warning" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-ide-error" />;
    case 'system':
      return <Settings className="h-4 w-4 text-accent" />;
    default:
      return <Terminal className="h-4 w-4 text-muted-foreground" />;
  }
};

const getLogColor = (type: ConsoleLog['type']) => {
  switch (type) {
    case 'info':
      return 'text-primary';
    case 'success':
      return 'text-ide-success';
    case 'warning':
      return 'text-ide-warning';
    case 'error':
      return 'text-ide-error';
    case 'system':
      return 'text-accent';
    default:
      return 'text-foreground';
  }
};

export function ConsolePanel({ logs, onClear }: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-ide-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border bg-ide-sidebar">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Console
          </h3>
          <span className="text-xs text-muted-foreground/60">
            ({logs.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClear}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin font-mono text-xs p-2 space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">
            No logs yet...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={cn(
                'flex items-start gap-2 py-1 px-2 rounded hover:bg-ide-hover/50 transition-colors',
                'animate-slide-in-up'
              )}
            >
              <span className="shrink-0 mt-0.5">
                {getLogIcon(log.type)}
              </span>
              <span className="text-muted-foreground/60 shrink-0">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className={cn('flex-1 whitespace-pre-wrap break-all', getLogColor(log.type))}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
