import { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { EditorTab } from '@/types/workspace';
import { X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onContentChange: (tabId: string, content: string) => void;
  onSave: (tabId: string) => void;
}

export function CodeEditor({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onContentChange,
  onSave,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco theme
    monaco.editor.defineTheme('lovable-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#0F172A',
        'editor.foreground': '#E2E8F0',
        'editor.lineHighlightBackground': '#1E293B',
        'editor.selectionBackground': '#3B82F644',
        'editorCursor.foreground': '#3B82F6',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94A3B8',
        'editor.inactiveSelectionBackground': '#3B82F622',
        'editorIndentGuide.background': '#334155',
        'editorIndentGuide.activeBackground': '#475569',
      },
    });
    monaco.editor.setTheme('lovable-dark');

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTabId) {
        onSave(activeTabId);
      }
    });
  };

  useEffect(() => {
    if (editorRef.current && activeTab) {
      editorRef.current.focus();
    }
  }, [activeTabId]);

  if (tabs.length === 0) {
    return (
      <div className="h-full bg-ide-editor flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-2">No files open</p>
          <p className="text-sm">Select a file from the explorer or generate a new project</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-ide-editor">
      {/* Tabs */}
      <div className="flex bg-ide-panel border-b border-ide-border overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-r border-ide-border cursor-pointer',
              'transition-colors text-sm min-w-max',
              activeTabId === tab.id
                ? 'bg-ide-editor text-foreground border-t-2 border-t-primary'
                : 'bg-ide-panel text-muted-foreground hover:bg-ide-hover border-t-2 border-t-transparent'
            )}
            onClick={() => onTabSelect(tab.id)}
          >
            <span className="truncate max-w-32">{tab.name}</span>
            {tab.isDirty && (
              <Circle className="h-2 w-2 fill-current text-ide-warning" />
            )}
            <button
              className="p-0.5 rounded hover:bg-secondary/50 ml-1"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor */}
      {activeTab && (
        <div className="flex-1">
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            onChange={(value) => onContentChange(activeTab.id, value || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>
      )}
    </div>
  );
}
