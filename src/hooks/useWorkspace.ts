import { useState, useCallback } from 'react';
import { FileNode, EditorTab, ConsoleLog, WorkspaceState } from '@/types/workspace';

const generateId = () => Math.random().toString(36).substring(2, 15);

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
  };
  return languageMap[ext || ''] || 'plaintext';
};

const defaultFiles: FileNode[] = [
  {
    id: 'root',
    name: 'workspace',
    type: 'folder',
    path: '/',
    children: [
      {
        id: 'readme',
        name: 'README.md',
        type: 'file',
        path: '/README.md',
        language: 'markdown',
        content: `# AI Coding Workspace

Welcome to your AI-powered coding environment!

## How to Use

1. **Enter a prompt** in the command bar at the top
2. **Click "Run Prompt"** to generate your project
3. **Edit files** in the Monaco editor
4. **Preview** your app in the right panel
5. **Export** your project as a ZIP when done

## Example Prompts

- "Create a todo app with React"
- "Build a weather dashboard"
- "Make a simple calculator"
- "Create a landing page for a startup"

Happy coding! 🚀
`,
      },
    ],
  },
];

export function useWorkspace() {
  const [state, setState] = useState<WorkspaceState>({
    files: defaultFiles,
    openTabs: [],
    activeTabId: null,
    consoleLogs: [
      {
        id: generateId(),
        type: 'system',
        message: 'AI Coding Workspace initialized. Ready for your prompts!',
        timestamp: new Date(),
      },
    ],
    isGenerating: false,
    previewHtml: null,
  });

  const addLog = useCallback((type: ConsoleLog['type'], message: string) => {
    setState((prev) => ({
      ...prev,
      consoleLogs: [
        ...prev.consoleLogs,
        {
          id: generateId(),
          type,
          message,
          timestamp: new Date(),
        },
      ],
    }));
  }, []);

  const openFile = useCallback((file: FileNode) => {
    if (file.type !== 'file') return;

    setState((prev) => {
      const existingTab = prev.openTabs.find((tab) => tab.path === file.path);
      if (existingTab) {
        return { ...prev, activeTabId: existingTab.id };
      }

      const newTab: EditorTab = {
        id: generateId(),
        name: file.name,
        path: file.path,
        content: file.content || '',
        language: file.language || getLanguageFromFilename(file.name),
        isDirty: false,
      };

      return {
        ...prev,
        openTabs: [...prev.openTabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState((prev) => {
      const tabIndex = prev.openTabs.findIndex((t) => t.id === tabId);
      const newTabs = prev.openTabs.filter((t) => t.id !== tabId);
      let newActiveId = prev.activeTabId;

      if (prev.activeTabId === tabId) {
        if (newTabs.length > 0) {
          newActiveId = newTabs[Math.max(0, tabIndex - 1)]?.id || newTabs[0]?.id;
        } else {
          newActiveId = null;
        }
      }

      return {
        ...prev,
        openTabs: newTabs,
        activeTabId: newActiveId,
      };
    });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState((prev) => ({ ...prev, activeTabId: tabId }));
  }, []);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setState((prev) => ({
      ...prev,
      openTabs: prev.openTabs.map((tab) =>
        tab.id === tabId ? { ...tab, content, isDirty: true } : tab
      ),
    }));
  }, []);

  const saveTab = useCallback((tabId: string) => {
    setState((prev) => {
      const tab = prev.openTabs.find((t) => t.id === tabId);
      if (!tab) return prev;

      const updateFileContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === tab.path) {
            return { ...node, content: tab.content };
          }
          if (node.children) {
            return { ...node, children: updateFileContent(node.children) };
          }
          return node;
        });
      };

      return {
        ...prev,
        files: updateFileContent(prev.files),
        openTabs: prev.openTabs.map((t) =>
          t.id === tabId ? { ...t, isDirty: false } : t
        ),
      };
    });
    addLog('success', `Saved: ${state.openTabs.find((t) => t.id === tabId)?.name}`);
  }, [addLog, state.openTabs]);

  const createFile = useCallback((parentPath: string, name: string, type: 'file' | 'folder') => {
    const newPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    const newNode: FileNode = {
      id: generateId(),
      name,
      type,
      path: newPath,
      language: type === 'file' ? getLanguageFromFilename(name) : undefined,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    const addNodeToTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.path === parentPath && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), newNode],
          };
        }
        if (node.children) {
          return { ...node, children: addNodeToTree(node.children) };
        }
        return node;
      });
    };

    setState((prev) => ({
      ...prev,
      files: addNodeToTree(prev.files),
    }));

    addLog('info', `Created ${type}: ${newPath}`);
  }, [addLog]);

  const deleteNode = useCallback((path: string) => {
    const removeFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((node) => node.path !== path)
        .map((node) => {
          if (node.children) {
            return { ...node, children: removeFromTree(node.children) };
          }
          return node;
        });
    };

    setState((prev) => ({
      ...prev,
      files: removeFromTree(prev.files),
      openTabs: prev.openTabs.filter((tab) => !tab.path.startsWith(path)),
    }));

    addLog('info', `Deleted: ${path}`);
  }, [addLog]);

  const setGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  const setPreviewHtml = useCallback((html: string | null) => {
    setState((prev) => ({ ...prev, previewHtml: html }));
  }, []);

  const loadGeneratedFiles = useCallback((files: Record<string, string>) => {
    const buildFileTree = (filesMap: Record<string, string>): FileNode[] => {
      const root: FileNode = {
        id: 'root',
        name: 'workspace',
        type: 'folder',
        path: '/',
        children: [],
      };

      const pathToNode: Record<string, FileNode> = { '/': root };

      // Sort paths to ensure parent directories are created first
      const sortedPaths = Object.keys(filesMap).sort();

      for (const filePath of sortedPaths) {
        const parts = filePath.split('/').filter(Boolean);
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const parentPath = currentPath || '/';
          currentPath = `/${parts.slice(0, i + 1).join('/')}`;

          if (!pathToNode[currentPath]) {
            const isFile = i === parts.length - 1;
            const node: FileNode = {
              id: generateId(),
              name: part,
              type: isFile ? 'file' : 'folder',
              path: currentPath,
              content: isFile ? filesMap[filePath] : undefined,
              language: isFile ? getLanguageFromFilename(part) : undefined,
              children: isFile ? undefined : [],
            };

            pathToNode[currentPath] = node;
            const parent = pathToNode[parentPath];
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
      }

      return [root];
    };

    setState((prev) => ({
      ...prev,
      files: buildFileTree(files),
      openTabs: [],
      activeTabId: null,
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, consoleLogs: [] }));
  }, []);

  const resetWorkspace = useCallback(() => {
    setState({
      files: defaultFiles,
      openTabs: [],
      activeTabId: null,
      consoleLogs: [
        {
          id: generateId(),
          type: 'system',
          message: 'Workspace reset. Ready for new prompts!',
          timestamp: new Date(),
        },
      ],
      isGenerating: false,
      previewHtml: null,
    });
  }, []);

  const getAllFilesContent = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};

    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.content !== undefined) {
          result[node.path.slice(1)] = node.content;
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };

    traverse(state.files);
    return result;
  }, [state.files]);

  return {
    ...state,
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
  };
}
