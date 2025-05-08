import * as vscode from 'vscode';
import { DiffFile } from './diffParser';

/**
 * Show a PR Diff Webview Panel with a GitHub-like file list and colored diffs.
 * @param files Filtered diff files to display
 */
export function showPRDiffWebview(files: DiffFile[]) {
  const panel = vscode.window.createWebviewPanel(
    'prDiffReview',
    'PR Diff Review',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  panel.webview.html = getWebviewContent(files);
}

export function getWebviewContent(files: DiffFile[]): string {
  // Basic CSS for GitHub-style diff colors
  const style = `
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; background: #f6f8fa; }
      .file-list { width: 260px; background: #fff; border-right: 1px solid #e1e4e8; height: 100vh; overflow-y: auto; float: left; }
      .file-entry { padding: 8px 16px; border-bottom: 1px solid #eee; cursor: pointer; }
      .file-entry.selected { background: #eaf5ff; font-weight: bold; }
      .diff-view { margin-left: 260px; padding: 24px; }
      .diff-hunk { margin-bottom: 24px; }
      .diff-header { color: #6a737d; font-size: 13px; margin-bottom: 4px; }
      .diff-line { font-family: 'Fira Mono', 'Consolas', monospace; font-size: 13px; white-space: pre; }
      .diff-add { background: #e6ffed; color: #22863a; }
      .diff-del { background: #ffeef0; color: #b31d28; }
      .diff-context { background: #fafbfc; color: #24292e; }
      .badge { display: inline-block; padding: 0 6px; font-size: 11px; border-radius: 3px; margin-left: 6px; background: #eee; color: #555; }
    </style>
  `;

  // JS for file selection
  const script = `
    <script>
      const files = ${JSON.stringify(files.map(f => ({ newPath: f.newPath, oldPath: f.oldPath, changeType: f.changeType })))};
      let selectedIdx = 0;
      function selectFile(idx) {
        selectedIdx = idx;
        document.querySelectorAll('.file-entry').forEach((el, i) => {
          el.classList.toggle('selected', i === idx);
        });
        document.getElementById('diff-content').innerHTML = diffs[idx];
      }
      window.onload = () => {
        selectFile(0);
      };
    </script>
  `;

  // Pre-render diffs for each file
  const diffs = files.map(file => {
    let hunksHtml = file.hunks.map(hunk => {
      const lines = hunk.content.split('\n').map(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          return `<div class='diff-line diff-add'>${escapeHtml(line)}</div>`;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          return `<div class='diff-line diff-del'>${escapeHtml(line)}</div>`;
        } else {
          return `<div class='diff-line diff-context'>${escapeHtml(line)}</div>`;
        }
      }).join('');
      return `<div class='diff-hunk'><div class='diff-header'>${escapeHtml(hunk.content.split('\n')[0])}</div>${lines}</div>`;
    }).join('');
    return `<div><h2>${escapeHtml(file.newPath)} <span class='badge'>${file.changeType}</span></h2>${hunksHtml}</div>`;
  });

  // File list HTML
  const fileList = files.map((f, i) =>
    `<div class='file-entry' onclick='selectFile(${i})'>${escapeHtml(f.newPath)}${f.isImportant ? " <span class='badge'>Important</span>" : ''}${f.isLarge ? " <span class='badge'>Large</span>" : ''}${f.isGenerated ? " <span class='badge'>Generated</span>" : ''}</div>`
  ).join('');

  // Compose HTML
  return `
    <!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8'>
      <meta name='viewport' content='width=device-width, initial-scale=1.0'>
      <title>PR Diff Review</title>
      ${style}
    </head>
    <body>
      <div class='file-list'>${fileList}</div>
      <div class='diff-view'><div id='diff-content'></div></div>
      <script>
        function escapeHtml(text) {
          return text.replace(/[&<>"']/g, function(m) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[m];
          });
        }
        const diffs = ${JSON.stringify(diffs)};
        ${script}
      </script>
    </body>
    </html>
  `;
}

// Helper for escaping HTML in diff lines
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]!));
}
