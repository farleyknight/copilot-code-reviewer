import { getWebviewContent } from '../prDiffWebview';
describe('prDiffWebview', () => {
  let expect: Chai.ExpectStatic;
  before(async () => {
    expect = (await import('chai')).expect;
  });
  it('renders a file list and diff view HTML', () => {
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
    expect(html).to.include('foo.txt');
    expect(html).to.include('diff-add');
    expect(html).to.include('PR Diff Review');
  });
});
