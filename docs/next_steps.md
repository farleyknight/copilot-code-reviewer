**Top Priority:** Write a new test file for each implementation file (e.g., diffParser.ts, prDiffWebview.ts). Ensure all new logic is covered by tests.

# Next Steps: Developing the `@review` Command

**Key Implementation Requirements (as of May 2025):**
- The extension is designed to run within a corporate network; no user authentication is required or expected.
- The GitHub (or GitHub Enterprise) root URL must be dynamically determined by parsing the repository's `.git/config` file.
- If `.git/config` is not found (i.e., not inside a GitHub repo), the extension must clearly notify the user that it only works in a GitHub project.

**Top Priority:**
- Implement Phase 2: GitHub Integration & PR Fetching, beginning with adding a GitHub API client and logic to extract the root URL from `.git/config`.

This document outlines the planned steps for developing the `@review` command for the Copilot-Powered PR Reviewer VSCode extension.

## Phase 1: Core VSCode Extension Setup & Command Registration [DONE]

1.  **Initialize a new VSCode Extension Project:** [DONE]
    *   Use `yo code` to scaffold a new TypeScript extension.
    *   Define basic extension manifest properties in `package.json` (name, publisher, version, activation events, contributes).
2.  **Register the `@review` Command:** [DONE]
    *   In `package.json`, under `contributes.commands`, define the `@review` command (e.g., `copilotReviewer.reviewPR`).
    *   In `extension.ts`, register the command handler using `vscode.commands.registerCommand`.
    *   Initially, the command handler can simply show an informational message (e.g., "@review command invoked!").
3.  **Set up Activation Events:** [DONE]
    *   Configure `activationEvents` in `package.json` so the extension activates when the `@review` command is invoked (e.g., `onCommand:copilotReviewer.reviewPR`).

## Phase 2: GitHub Integration & PR Fetching [MOSTLY COMPLETE]

**Implementation Status (as of May 2025):**
- The core logic for GitHub API integration, `.git/config` parsing, PR listing, and command registration is implemented and tested.
- The actual integration with an AI chat participant for PR selection is currently a stub (`sendPRsToChatParticipant` just logs and shows a message).
- The authentication approach currently expects a `GITHUB_TOKEN` environment variable, which may need to be reviewed or aligned with the intended corporate network setup.
- Error handling and test coverage are present for the implemented logic.

1.  **Add GitHub API Client & Detect Root URL:** [DONE]
    *   `@octokit/rest` is included as a dependency.
    *   Logic implemented to parse the current workspace's `.git/config` and extract the GitHub (or GitHub Enterprise) root URL.
    *   VSCode command (`copilot-code-reviewer.detectRootUrl`) displays the detected root URL or notifies the user if not in a GitHub repo.
    *   Error handling for missing/malformed `.git/config` is present.
    *   Confirmed via tests and manual inspection.
2.  **Implement PR Listing Logic:** [DONE]
    *   When `@review` is triggered, open PRs for the current Git repository are fetched using the GitHub API client (`octokit.pulls.list`).
    *   Dependency injection is used for testability, with tests verifying correct fetching and passing of PRs.
3.  **Display PRs to User:** [PARTIAL]
    *   The list of fetched PRs is sent to a placeholder handler for the AI chat participant. Actual chat-based PR selection is not yet implemented.
    *   VSCode QuickPick or similar UI is intentionally NOT used.
    *   Each PR item includes relevant info (title, number, author).
    *   Tests ensure the stub handler is called and QuickPick is not used.

**Summary:**
Phase 2 is mostly complete. The only significant gap is the integration with the AI/chat participant for PR selection, which remains as a stub. The authentication method may also need review based on the deployment environment. All other core functionality for GitHub integration and PR listing is implemented and tested.

## Phase 3: PR Diff Viewing & Contextualization [IN PROGRESS]

### New Requirements and Design Decisions (May 2025):
- The extension must handle large PR diffs by breaking them into manageable chunks, ideally by file.
- The diff should be parsed and presented file-by-file, allowing users (and the AI) to focus on relevant edits.
- Large, auto-generated, or redundant files (e.g., `package-lock.json`) should be minimized or excluded from the main review context, while important files (e.g., `package.json`) are always shown.
- The extension will provide a VSCode Webview Panel to display the PR, showing diffs per file. This panel will support interactive features, such as:
    - Viewing and navigating file diffs
    - Minimizing or hiding files
    - Adding links, buttons, or chat boxes for user/AI interaction
    - Allowing the chat participant to suggest edits to specific files
- Only the most relevant edits should be surfaced to the user and AI by default, with the option to expand or show all changes if needed.

1.  **Fetch PR Diff:** [IN PROGRESS]
    *   Once the user selects a PR, fetch its diff content using the GitHub API (e.g., `octokit.pulls.get` with `mediaType: { format: 'diff' }`).
    *   Parse the diff to identify individual files and their changes.
2.  **Prepare Diff for AI and Webview Context:** [TODO]
    *   Present the diff in a custom VSCode Webview Panel, broken down by file.
    *   Implement logic to minimize or exclude files like `package-lock.json` from the main view, while always showing important files like `package.json`.
    *   Allow user and AI interaction within the Webview (e.g., chat, suggestions, navigation).
    *   Provide mechanisms to chunk or page through large diffs if necessary.
    *   Only bring up relevant edits by default, with options to expand hidden/minimized files.

## Phase 4: AI-Powered Review (Interaction with "Copilot") [TODO]

---

## Implementation Plan: Advanced PR Diff Handling and Interactive Review

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



This phase is highly dependent on how one can programmatically interact with "Copilot" or a similar AI model for code review tasks. The steps below are speculative and need significant research.

1.  **Investigate Copilot Integration Points:** [TODO]
    *   Research official VSCode APIs for interacting with Copilot or other installed AI assistants.
    *   Explore if Copilot exposes any extension APIs for providing context or triggering analysis.
    *   Consider alternative approaches if direct integration is not possible (e.g., using a generic LLM API if the user provides an API key, though this deviates from direct "Copilot" integration).
2.  **Send Diff to AI:** [TODO]
    *   Implement the mechanism to send the PR diff (and potentially other relevant context like file content) to the AI.
3.  **Receive and Display AI Feedback:** [TODO]
    *   Determine how AI feedback (comments, suggestions) will be received.
    *   Display the AI-generated review comments within VSCode, potentially:
        *   As comments directly on the diff view.
        *   In a separate webview panel.
        *   As diagnostic messages in the Problems panel.

## Phase 5: Iteration & Enhancements [TODO]

1.  **Configuration Options:** [TODO]
    *   Allow users to configure GitHub API endpoints (for GitHub Enterprise).
    *   Settings for default PR sorting, number of PRs to fetch, etc.
2.  **Error Handling & Logging:** [TODO]
    *   Implement robust error handling for API calls, invalid user inputs, etc.
    *   Add logging for easier debugging.
3.  **UI/UX Improvements:** [TODO]
    *   Refine the PR selection and diff viewing experience.
4.  **Testing:** [TODO]
    *   Develop unit and integration tests for the extension.
5.  **Investigate Commenting Directly on GitHub:** [TODO]
    *   Explore adding functionality to post AI-generated (or user-refined) comments back to the GitHub PR.

## Open Questions & Research Items: [TODO]

*   **Primary Blocker:** How can a VSCode extension programmatically provide context (like a PR diff) to the installed Copilot service and trigger its analysis/review capabilities?
    *   Are there specific Copilot APIs for extensions?
    *   Can we leverage existing VSCode chat agent APIs or similar mechanisms?
*   Authentication best practices for GitHub API within a VSCode extension.
*   Handling large diffs effectively.
*   Rate limiting considerations for the GitHub API.

This plan will be updated as development progresses and more information is gathered, especially regarding AI integration capabilities.
