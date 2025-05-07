import type { WorkspaceFolder } from 'vscode';
const assert = require('assert');
const vscode = require('vscode');
const { getCurrentWorkspacePath } = require('../github');

suite('GitHub Utility Tests', () => {
  let originalWorkspaceFolders: typeof vscode.workspace.workspaceFolders;

  suiteSetup(() => {
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
  });

  suiteTeardown(() => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', {
      value: originalWorkspaceFolders,
      writable: true
    });
  });

  test('getCurrentWorkspacePath should return undefined if no workspace folders', () => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', { value: undefined, writable: true });
    assert.strictEqual(getCurrentWorkspacePath(), undefined);
  });

  test('getCurrentWorkspacePath should return undefined if workspaceFolders is empty', () => {
    Object.defineProperty(vscode.workspace, 'workspaceFolders', { value: [], writable: true });
    assert.strictEqual(getCurrentWorkspacePath(), undefined);
  });

  test('getCurrentWorkspacePath should return the path of the first workspace folder', () => {
    const expectedPath = '/test/workspace1';
    const workspaceFolder1 = {
      uri: vscode.Uri.file(expectedPath),
      name: 'Workspace 1',
      index: 0
    } as WorkspaceFolder;
    const workspaceFolder2 = {
      uri: vscode.Uri.file('/test/workspace2'),
      name: 'Workspace 2',
      index: 1
    } as WorkspaceFolder;

    Object.defineProperty(vscode.workspace, 'workspaceFolders', { value: [workspaceFolder1, workspaceFolder2], writable: true });
    assert.strictEqual(getCurrentWorkspacePath(), expectedPath);
  });
});

export {};
