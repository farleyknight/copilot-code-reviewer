// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getRepositoryOwnerAndRepo, getOctokitClient, fetchPullRequestDiff } from './github';
import { parseUnifiedDiff, filterRelevantFiles } from './diffParser';
import { showPRDiffWebview } from './prDiffWebview';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "copilot-code-reviewer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const helloDisposable = vscode.commands.registerCommand('copilot-code-reviewer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from copilot-code-reviewer!');
	});
	context.subscriptions.push(helloDisposable);

	const detectRootUrlDisposable = vscode.commands.registerCommand('copilot-code-reviewer.detectRootUrl', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('No workspace folder found. Please open a GitHub project.');
			return;
		}
		const workspacePath = workspaceFolders[0].uri.fsPath;
		const gitConfigPath = path.join(workspacePath, '.git', 'config');
		if (!fs.existsSync(gitConfigPath)) {
			vscode.window.showErrorMessage('No .git/config found. Please run this extension inside a GitHub project.');
			return;
		}
		try {
			const configContent = fs.readFileSync(gitConfigPath, 'utf8');
			const remoteMatch = configContent.match(/\[remote \"origin\"\][^\[]*url = ([^\n]+)/);
			if (!remoteMatch) {
				vscode.window.showErrorMessage('Could not find remote "origin" in .git/config.');
				return;
			}
			const remoteUrl = remoteMatch[1].trim();
			// Extract root URL
			let rootUrl = '';
			if (remoteUrl.startsWith('git@')) {
				// git@github.com:owner/repo.git
				const match = remoteUrl.match(/^git@([^:]+):/);
				if (match) { rootUrl = match[1]; }
			} else if (remoteUrl.startsWith('https://')) {
				// https://github.com/owner/repo.git
				const match = remoteUrl.match(/^https:\/\/([^/]+)/);
				if (match) { rootUrl = match[1]; }
			}
			if (rootUrl) {
				vscode.window.showInformationMessage(`Detected GitHub root URL: ${rootUrl}`);
			} else {
				vscode.window.showErrorMessage('Could not parse root URL from remote origin.');
			}
		} catch (err) {
			vscode.window.showErrorMessage('Error reading .git/config: ' + err);
		}
	});
	context.subscriptions.push(detectRootUrlDisposable);

	// Command to list open PRs for the current repo
	const listPRsDisposable = vscode.commands.registerCommand('copilot-code-reviewer.listPRs', listPRsCommandFactory(sendPRsToChatParticipant));
	context.subscriptions.push(listPRsDisposable);
}

// Factory for the listPRs command handler, allowing injection of the PR handler for testability
export function listPRsCommandFactory(sendPRsHandler: (prs: any[]) => Promise<void>) {
	return async () => {
		const repoInfo = await getRepositoryOwnerAndRepo();
		if (!repoInfo) {
			vscode.window.showErrorMessage('Could not determine repository owner/name. Make sure you are in a GitHub project.');
			return;
		}
		const octokit = await getOctokitClient();
		if (!octokit) {
			vscode.window.showErrorMessage('Could not initialize GitHub API client.');
			return;
		}
		try {
			const prsResponse = await (octokit as any).pulls.list({
				owner: repoInfo.owner,
				repo: repoInfo.repo,
				state: 'open',
			});
			const prs = prsResponse.data;
			if (!prs || prs.length === 0) {
				vscode.window.showInformationMessage('No open pull requests found for this repository.');
				return;
			}

			// Instead of QuickPick, send the list of PRs to the chat participant (AI) for disambiguation
			await sendPRsHandler(prs);

		} catch (error: any) {
			vscode.window.showErrorMessage('Failed to fetch pull requests: ' + (error.message || error.toString()));
		}
	};
}

// Placeholder for chat-based PR disambiguation (to be implemented)
export async function sendPRsToChatParticipant(prs: any[]) {
	// In a real implementation, this would send PRs to the AI chat participant for user interaction.
	console.log('PRs sent to chat participant for disambiguation:', prs);
	vscode.window.showInformationMessage('PR list sent to chat participant for disambiguation.');

	// PHASE 3 DEMO: Fetch and log the diff for the first PR
	if (prs && prs.length > 0) {
		const firstPR = prs[0];
		const repoInfo = await getRepositoryOwnerAndRepo();
		const octokit = await getOctokitClient();
		if (repoInfo && octokit) {
			const diff = await fetchPullRequestDiff(octokit, repoInfo.owner, repoInfo.repo, firstPR.number);
			if (diff) {
				// Parse the diff using the new parser
				const parsedFiles = parseUnifiedDiff(diff);
				const filteredFiles = filterRelevantFiles(parsedFiles);
				console.log('Filtered PR files for review:', filteredFiles);
				showPRDiffWebview(filteredFiles);
				vscode.window.showInformationMessage('Fetched, parsed, filtered, and opened PR diff for #' + firstPR.number + '.');
			} else {
				vscode.window.showErrorMessage('Failed to fetch diff for PR #' + firstPR.number);
			}
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
