import * as assert from 'assert';
// Inline diffParser.test.ts
suite('Diff Parser Unit Tests', () => {
  const simpleDiff = `diff --git a/foo.txt b/foo.txt\nindex e69de29..4b825dc 100644\n--- a/foo.txt\n+++ b/foo.txt\n@@ -0,0 +1,2 @@\n+hello\n+world\n`;

  test('parses a simple unified diff into DiffFile objects', async () => {
    const { parseUnifiedDiff } = require('../diffParser');
    const files = parseUnifiedDiff(simpleDiff);
    assert.strictEqual(files.length, 1);
    assert.strictEqual(files[0].newPath, 'foo.txt');
    assert.strictEqual(files[0].hunks.length, 1);
    assert.ok(files[0].hunks[0].content.includes('+hello'));
  });

  test('classifies important, generated, and large files', async () => {
    const { classifyFile } = require('../diffParser');
    const important = classifyFile('package.json');
    const generated = classifyFile('package-lock.json');
    const normal = classifyFile('src/index.ts');
    assert.ok(important.isImportant);
    assert.ok(generated.isGenerated);
    assert.strictEqual(normal.isImportant, false);
    assert.strictEqual(normal.isGenerated, false);
  });

  test('filters relevant files by importance and size', async () => {
    const { filterRelevantFiles } = require('../diffParser');
    const files = [
      { newPath: 'foo.txt', isImportant: false, isGenerated: false, isLarge: false },
      { newPath: 'package-lock.json', isImportant: false, isGenerated: true, isLarge: false },
      { newPath: 'package.json', isImportant: true, isGenerated: false, isLarge: false },
      { newPath: 'big.txt', isImportant: false, isGenerated: false, isLarge: true },
    ];
    const filtered = filterRelevantFiles(files as any);
    const paths = filtered.map((f: any) => f.newPath);
    assert.ok(paths.includes('package.json'));
    assert.ok(!paths.includes('package-lock.json'));
    assert.ok(!paths.includes('big.txt'));
  });
});

// Inline prDiffWebview.test.ts
suite('PR Diff Webview Unit Tests', () => {
  test('renders a file list and diff view HTML', async () => {
    const { getWebviewContent } = require('../prDiffWebview');
    const files = [
      {
        newPath: 'foo.txt',
        oldPath: 'foo.txt',
        changeType: 'modified',
        hunks: [
          { oldStart: 1, oldLines: 1, newStart: 1, newLines: 2, content: '@@ -1,1 +1,2 @@\n+hello\n+world' }
        ],
        isImportant: false,
        isGenerated: false,
        isLarge: false
      }
    ];
    const html = getWebviewContent(files as any);
    assert.ok(html.includes('foo.txt'));
    assert.ok(html.includes('diff-add'));
    assert.ok(html.includes('PR Diff Review'));
  });
});
