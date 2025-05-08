import { parseUnifiedDiff, filterRelevantFiles, classifyFile } from '../diffParser';
describe('diffParser', () => {
  let expect: Chai.ExpectStatic;
  before(async () => {
    expect = (await import('chai')).expect;
  });
  const simpleDiff = `diff --git a/foo.txt b/foo.txt\nindex e69de29..4b825dc 100644\n--- a/foo.txt\n+++ b/foo.txt\n@@ -0,0 +1,2 @@\n+hello\n+world\n`;

  it('parses a simple unified diff into DiffFile objects', () => {
    const files = parseUnifiedDiff(simpleDiff);
    expect(files).to.have.lengthOf(1);
    expect(files[0].newPath).to.equal('foo.txt');
    expect(files[0].hunks).to.have.lengthOf(1);
    expect(files[0].hunks[0].content).to.include('+hello');
  });

  it('classifies important, generated, and large files', () => {
    const important = classifyFile('package.json');
    const generated = classifyFile('package-lock.json');
    const normal = classifyFile('src/index.ts');
    expect(important.isImportant).to.be.true;
    expect(generated.isGenerated).to.be.true;
    expect(normal.isImportant).to.be.false;
    expect(normal.isGenerated).to.be.false;
  });

  it('filters relevant files by importance and size', () => {
    const files = [
      { newPath: 'foo.txt', isImportant: false, isGenerated: false, isLarge: false },
      { newPath: 'package-lock.json', isImportant: false, isGenerated: true, isLarge: false },
      { newPath: 'package.json', isImportant: true, isGenerated: false, isLarge: false },
      { newPath: 'big.txt', isImportant: false, isGenerated: false, isLarge: true },
    ];
    const filtered = filterRelevantFiles(files as any);
    expect(filtered.map(f => f.newPath)).to.include('package.json').and.not.include('package-lock.json').and.not.include('big.txt');
  });
});
