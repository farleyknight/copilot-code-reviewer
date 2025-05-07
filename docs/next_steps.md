# Next Steps: Developing the `@review` Command

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

## Phase 2: GitHub Integration & PR Fetching [TODO]

1.  **Add GitHub API Client:** [TODO]
    *   Choose and install a suitable Node.js GitHub API client library (e.g., `@octokit/rest`).
    *   Handle GitHub API authentication (e.g., using Personal Access Tokens initially, explore OAuth later). Store credentials securely (VSCode secrets API).
2.  **Implement PR Listing Logic:** [TODO]
    *   When `@review` is triggered, fetch open PRs for the current Git repository.
        *   Determine the current repository (e.g., using VSCode workspace API and Git integration).
        *   Use the GitHub API client to list PRs (e.g., `octokit.pulls.list`).
3.  **Display PRs to User:** [TODO]
    *   Present the list of fetched PRs to the user in a user-friendly way (e.g., VSCode Quick Pick `vscode.window.showQuickPick`).
    *   Each item should display relevant PR info (title, number, author).

## Phase 3: PR Diff Viewing & Contextualization [TODO]

1.  **Fetch PR Diff:** [TODO]
    *   Once the user selects a PR, fetch its diff content using the GitHub API (e.g., `octokit.pulls.get` with `mediaType: { format: 'diff' }`).
2.  **Prepare Diff for AI Context:** [TODO]
    *   Determine how the diff content will be passed to the "Copilot" AI.
    *   This might involve:
        *   Opening the diff in a new virtual document.
        *   Copying the diff to the clipboard.
        *   Directly sending the diff content to a Copilot-related API if available/permissible (NEEDS RESEARCH - how does Copilot receive context? Is there an API?)

## Phase 4: AI-Powered Review (Interaction with "Copilot") [TODO]

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
