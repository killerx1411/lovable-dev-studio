import JSZip from 'jszip';

export async function exportToZip(
  files: Record<string, string>,
  projectName: string
): Promise<void> {
  const zip = new JSZip();

  // Add all files to the ZIP
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  // Generate the ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });

  // Download the ZIP
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
