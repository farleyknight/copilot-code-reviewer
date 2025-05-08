# Project Overview: Copilot-Powered PR Reviewer VSCode Extension

**Latest Requirements (May 2025):**
- The extension is built for use within a corporate network; no user authentication is needed or supported.
- The GitHub or GitHub Enterprise root URL is automatically parsed from the local `.git/config` file.
- If the extension is not run inside a GitHub repository (no `.git/config`), it will notify the user that it must be used within a GitHub project.

The primary goal of this project is to develop a Visual Studio Code extension designed to streamline the code review process. This extension will integrate with version control systems (initially focusing on GitHub) to fetch Pull Request (PR) information and their associated diffs.

**Authentication:** No login or authentication is required for this extension to work. It is designed to run within a corporate network where repository access is managed at the network level.

**GitHub Root URL:** The extension automatically determines the GitHub (or GitHub Enterprise) root URL by reading the repository's `.git/config`. If `.git/config` is not found, the user will be notified that they must be inside a GitHub project for the tool to function.

The core functionality will allow users to:
1.  Invoke a command (e.g., `@review`) within the VSCode environment.
2.  View a list of open PRs for the current repository.
3.  Select a specific PR for review by interacting with the chat participant (AI). The extension no longer uses QuickPick or any VSCode UI for PR selection; all disambiguation is handled in the chat. This logic is now implemented and verified by tests.
4.  Bring the diff of the selected PR into the context of an AI assistant (referred to as "Copilot").
5.  Utilize the AI assistant to analyze the diff, generate review comments, suggest improvements, and facilitate discussions around the PR's changes.

---

## Advanced PR Diff Handling and Interactive Review (May 2025)

The following is our detailed implementation plan for these advanced features:

### 1. PR Diff Chunking and File-by-File Breakdown
- **Fetch and Parse the Diff**
  1. Fetch the PR diff using the GitHub API (`octokit.pulls.get` with `mediaType: { format: 'diff' }`).
  2. Parse the unified diff format into a structured representation:
     - Identify each file changed, its path, and the type of change (added, modified, deleted, renamed).
     - Extract the diff hunks for each file.
     - Consider using a library like `diffparser` or implement a custom parser for maximum control.
- **Identify File Types and Importance**
  3. For each file, determine:
     - If it is auto-generated or typically unimportant for review (e.g., `package-lock.json`, `.yarn.lock`, `dist/`, `build/`).
     - If it is a critical config or source file (e.g., `package.json`, `.env`, source code files).
     - Allow configuration or heuristics to expand this list.

### 2. Intelligent Minimization and Filtering
- **Default View Logic**
  4. By default, minimize or collapse diffs for large/unimportant/generated files in the UI.
  5. Always expand and highlight important files.
  6. Allow users to expand/collapse any file manually.
- **AI/Heuristic Filtering**
  7. Optionally, use heuristics or AI to further filter or prioritize files/hunks (e.g., surface files with the most code changes, or those with changes in critical areas).

### 3. VSCode Webview Panel for PR Review
- **Webview Panel Scaffolding**
  8. Create a new VSCode Webview Panel for PR review.
     - Display a list of changed files on the left.
     - Show the diff for the selected file on the right.
- **Interactive Features**
  9. Add controls for:
     - Expanding/collapsing files.
     - Navigating between files and hunks.
     - Minimizing/hiding files (with a toggle).
     - Highlighting important files.
  10. Add a chat box or interactive area for user/AI discussion.
      - Allow the user to ask questions about specific files or hunks.
      - Enable the AI to suggest edits or provide explanations inline.
- **Advanced Features (Optional, for Later)**
  11. Add buttons/links for:
      - “Ask AI about this file/hunk”
      - “Suggest edit”
      - “Summarize changes”
  12. Support chunking/paging for very large diffs.

### 4. Relevant Edits and Context Management
- **Surface Relevant Changes**
  13. By default, only show files/changes that are likely relevant (using logic from above).
  14. Provide a “Show All” option to reveal everything.
- **User Configuration**
  15. Allow users to configure which files are minimized, always shown, or ignored.

### 5. Testing and UX Validation
- **Unit and Integration Testing**
  16. Add tests for:
      - Diff parsing and file classification.
      - Webview rendering and interactivity.
      - Filtering/minimization logic.
- **User Feedback**
  17. Gather feedback on usability and relevance of surfaced changes.
  18. Iterate on heuristics and UI/UX based on real-world usage.

### Next Steps
1. Implement a robust diff parser and file classifier.
2. Scaffold the Webview Panel with a file list and diff view.
3. Add minimization/filtering logic and controls.
4. Integrate chat/AI interaction in the Webview.
5. Test and refine based on user feedback.

---



- The extension will fetch the PR diff and break it down file-by-file, enabling chunked review and context management.
- Large, auto-generated, or redundant files (such as `package-lock.json`) will be minimized or hidden by default, while important files (such as `package.json`) will always be shown.
- The review experience will be delivered through a custom VSCode Webview Panel, which will:
    - Display the PR diff per file with navigation controls
    - Allow users and the AI to focus on relevant edits
    - Enable minimizing or expanding files as needed
    - Provide interactive elements (links, buttons, chat boxes) for discussion and suggested edits
    - Support chunking or paging for very large diffs
- The goal is to surface only the most relevant changes by default, but allow full access to all changes if needed, improving both usability and AI context management.

**Note:** All user selection and disambiguation flows are handled through the chat participant (AI) rather than native VSCode UI elements like QuickPick. Dependency injection is used for testability, and the test suite verifies that chat-based selection is triggered and QuickPick is not used.

The extension aims to leverage AI capabilities to make code reviews more efficient, comprehensive, and insightful, directly within the developer's primary workspace.
