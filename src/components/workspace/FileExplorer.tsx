import { useState } from 'react';
import { FileNode } from '@/types/workspace';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  FileCode,
  FileJson,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onDelete: (path: string) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return <FileCode className="h-4 w-4 text-ide-success" />;
    case 'json':
      return <FileJson className="h-4 w-4 text-ide-warning" />;
    case 'md':
      return <FileText className="h-4 w-4 text-primary" />;
    case 'css':
    case 'scss':
      return <File className="h-4 w-4 text-accent" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onDelete: (path: string) => void;
}

function FileTreeItem({
  node,
  depth,
  onFileSelect,
  onCreateFile,
  onDelete,
}: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: 'file' | 'folder';
  }>({ open: false, type: 'file' });
  const [newName, setNewName] = useState('');

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node);
    }
  };

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateFile(node.path, newName.trim(), createDialog.type);
      setNewName('');
      setCreateDialog({ open: false, type: 'file' });
    }
  };

  const isRootFolder = node.path === '/';

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded-sm transition-colors',
              'hover:bg-ide-hover group',
              'text-sm text-foreground/90'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={handleClick}
          >
            {node.type === 'folder' ? (
              <>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                {isOpen ? (
                  <FolderOpen className="h-4 w-4 text-ide-warning shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-ide-warning shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-4" />
                {getFileIcon(node.name)}
              </>
            )}
            <span className="truncate ml-1">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {node.type === 'folder' && (
            <>
              <ContextMenuItem
                onClick={() => setCreateDialog({ open: true, type: 'file' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => setCreateDialog({ open: true, type: 'folder' })}
              >
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </ContextMenuItem>
            </>
          )}
          {!isRootFolder && (
            <ContextMenuItem
              onClick={() => onDelete(node.path)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {node.type === 'folder' && isOpen && node.children && (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={createDialog.open} onOpenChange={(open) => setCreateDialog({ ...createDialog, open })}>
        <DialogContent className="bg-card border-ide-border">
          <DialogHeader>
            <DialogTitle>
              Create New {createDialog.type === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={createDialog.type === 'file' ? 'filename.tsx' : 'folder-name'}
            className="bg-secondary border-ide-border"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialog({ open: false, type: 'file' })}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FileExplorer({
  files,
  onFileSelect,
  onCreateFile,
  onDelete,
}: FileExplorerProps) {
  return (
    <div className="h-full bg-ide-sidebar overflow-y-auto scrollbar-thin">
      <div className="sticky top-0 bg-ide-sidebar border-b border-ide-border px-3 py-2 z-10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </h3>
      </div>
      <div className="py-1">
        {files.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            depth={0}
            onFileSelect={onFileSelect}
            onCreateFile={onCreateFile}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
