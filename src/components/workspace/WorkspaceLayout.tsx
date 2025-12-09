import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import { ConsolePanel } from './ConsolePanel';
import { PromptBar } from './PromptBar';
import { useWorkspace } from '@/hooks/useWorkspace';
import { generateProject, buildPreviewHtml } from '@/services/ai';
import { exportToZip } from '@/services/export';
import { toast } from 'sonner';

export function WorkspaceLayout() {
  const {
    files,
    openTabs,
    activeTabId,
    consoleLogs,
    isGenerating,
    previewHtml,
    openFile,
    closeTab,
    setActiveTab,
    updateTabContent,
    saveTab,
    createFile,
    deleteNode,
    addLog,
    setGenerating,
    setPreviewHtml,
    loadGeneratedFiles,
    clearLogs,
    resetWorkspace,
    getAllFilesContent,
  } = useWorkspace();

  const handleRunPrompt = async (prompt: string) => {
    setGenerating(true);
    addLog('system', `Starting generation: "${prompt}"`);

    try {
      addLog('info', 'Calling AI to generate project...');
      const result = await generateProject(prompt);

      if (result.files) {
        addLog('success', `Generated ${Object.keys(result.files).length} files`);
        loadGeneratedFiles(result.files);

        // Build preview HTML
        addLog('info', 'Building preview...');
        const html = buildPreviewHtml(result.files);
        if (html) {
          setPreviewHtml(html);
          addLog('success', 'Preview ready!');
        }

        toast.success('Project generated successfully!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Generation failed: ${message}`);
      toast.error('Failed to generate project');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      const files = getAllFilesContent();
      await exportToZip(files, 'workspace-project');
      addLog('success', 'Project exported as ZIP');
      toast.success('Project exported successfully!');
    } catch (error) {
      addLog('error', 'Export failed');
      toast.error('Failed to export project');
    }
  };

  const handleReset = () => {
    resetWorkspace();
    toast.info('Workspace reset');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-ide-sidebar border-b border-ide-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">AI Coding Workspace</h1>
            <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">Ctrl+S</kbd> to save
        </div>
      </header>

      {/* Prompt Bar */}
      <PromptBar
        onRunPrompt={handleRunPrompt}
        onExport={handleExport}
        onReset={handleReset}
        isGenerating={isGenerating}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={18} minSize={15} maxSize={30}>
            <FileExplorer
              files={files}
              onFileSelect={openFile}
              onCreateFile={createFile}
              onDelete={deleteNode}
            />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-ide-border hover:bg-primary/50 transition-colors" />

          {/* Editor + Console */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={75} minSize={30}>
                <CodeEditor
                  tabs={openTabs}
                  activeTabId={activeTabId}
                  onTabSelect={setActiveTab}
                  onTabClose={closeTab}
                  onContentChange={updateTabContent}
                  onSave={saveTab}
                />
              </ResizablePanel>

              <ResizableHandle className="h-1 bg-ide-border hover:bg-primary/50 transition-colors" />

              <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
                <ConsolePanel logs={consoleLogs} onClear={clearLogs} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-ide-border hover:bg-primary/50 transition-colors" />

          {/* Preview */}
          <ResizablePanel defaultSize={37} minSize={25}>
            <PreviewPanel html={previewHtml} isGenerating={isGenerating} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
