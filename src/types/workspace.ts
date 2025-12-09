export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
  language?: string;
}

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface ConsoleLog {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  message: string;
  timestamp: Date;
}

export interface GeneratedProject {
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface WorkspaceState {
  files: FileNode[];
  openTabs: EditorTab[];
  activeTabId: string | null;
  consoleLogs: ConsoleLog[];
  isGenerating: boolean;
  previewHtml: string | null;
}
