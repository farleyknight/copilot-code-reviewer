/**
 * Diff Parser and File Classifier for PR diffs (unified format)
 *
 * Parses a unified diff string into structured file and hunk objects, and classifies files by importance.
 */

export type DiffFileChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'unknown';

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  changeType: DiffFileChangeType;
  hunks: DiffHunk[];
  isImportant: boolean;
  isGenerated: boolean;
  isLarge: boolean;
}

/**
 * Heuristic file classifier
 */
export function classifyFile(path: string): { isImportant: boolean; isGenerated: boolean } {
  // Important files (expand this list as needed)
  const importantFiles = [
    'package.json',
    'requirements.txt',
    'pyproject.toml',
    '.env',
    'Dockerfile',
    'Makefile',
    'build.gradle',
    'pom.xml',
  ];
  // Generated/unimportant patterns
  const generatedPatterns = [
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /(^|\/)dist\//,
    /(^|\/)build\//,
    /(^|\/)node_modules\//,
    /\.min\./,
    /\.bundle\./,
    /\.map$/,
    /\.lock$/,
    /\.generated\./,
    /\.snap$/,
    /\.pb\.go$/,
    /\.class$/,
    /\.dll$/,
    /\.exe$/,
    /\.bin$/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.webp$/,
    /\.ico$/,
    /\.pdf$/,
    /\.zip$/,
    /\.tar$/,
    /\.gz$/,
    /\.7z$/,
    /\.dmg$/,
    /\.app$/,
    /\.jar$/,
    /\.war$/,
    /\.ear$/,
    /\.iml$/,
    /\.db$/,
    /\.sqlite$/,
    /\.bak$/,
    /\.tmp$/,
    /\.swp$/,
    /\.swo$/,
    /\.DS_Store$/,
    /Thumbs\.db$/
  ];
  const isImportant = importantFiles.some(f => path.endsWith(f));
  const isGenerated = generatedPatterns.some(re => re.test(path));
  return { isImportant, isGenerated };
}

/**
 * Parse a unified diff string into an array of DiffFile objects
 */
/**
 * Filter/minimize files for review:
 * - Always show important files
 * - Hide/minimize generated or large files unless explicitly requested
 */
export function filterRelevantFiles(files: DiffFile[], showAll: boolean = false): DiffFile[] {
  if (showAll) { return files; }
  return files.filter(f => f.isImportant || (!f.isGenerated && !f.isLarge));
}

export function parseUnifiedDiff(diffText: string, largeFileLineThreshold = 2000): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diffText.split('\n');
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith('diff --git')) {
      // Parse file header
      const fileLine = lines[i];
      let oldPath = '', newPath = '';
      const match = fileLine.match(/^diff --git a\/(.+) b\/(.+)$/);
      if (match) {
        oldPath = match[1];
        newPath = match[2];
      }
      let changeType: DiffFileChangeType = 'modified';
      // Look ahead for file operation markers
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('@@') && !lines[j].startsWith('diff --git')) {
        if (lines[j].startsWith('new file mode')) { changeType = 'added'; }
        if (lines[j].startsWith('deleted file mode')) { changeType = 'deleted'; }
        if (lines[j].startsWith('rename from')) { changeType = 'renamed'; }
        j++;
      }
      // Parse hunks
      const hunks: DiffHunk[] = [];
      let hunkStart = j;
      while (hunkStart < lines.length && lines[hunkStart].startsWith('@@')) {
        const hunkHeader = lines[hunkStart];
        const hunkMatch = hunkHeader.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
        let oldStart = 0, oldLines = 0, newStart = 0, newLines = 0;
        if (hunkMatch) {
          oldStart = parseInt(hunkMatch[1], 10);
          oldLines = parseInt(hunkMatch[2], 10);
          newStart = parseInt(hunkMatch[3], 10);
          newLines = parseInt(hunkMatch[4], 10);
        }
        // Gather hunk content
        let hunkContent = hunkHeader + '\n';
        let k = hunkStart + 1;
        while (k < lines.length && !lines[k].startsWith('@@') && !lines[k].startsWith('diff --git')) {
          hunkContent += lines[k] + '\n';
          k++;
        }
        hunks.push({ oldStart, oldLines, newStart, newLines, content: hunkContent });
        hunkStart = k;
      }
      // Classify file
      const { isImportant, isGenerated } = classifyFile(newPath);
      // Large file heuristic
      const totalLines = hunks.reduce((acc, h) => acc + h.content.split('\n').length, 0);
      const isLarge = totalLines > largeFileLineThreshold;
      files.push({ oldPath, newPath, changeType, hunks, isImportant, isGenerated, isLarge });
      // Move to next file
      i = hunkStart;
    } else {
      i++;
    }
  }
  return files;
}
