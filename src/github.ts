import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// TODO: Implement GitHub API interaction logic

/**
 * Gets the file system path of the first workspace folder.
 * Returns undefined if no workspace folder is open.
 */
function getCurrentWorkspacePath(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  }
  return undefined;
}


// Function to get the repository owner and name from the .git/config file
async function getRepositoryOwnerAndRepo(): Promise<{ owner: string; repo: string } | null> {
  const workspacePath = getCurrentWorkspacePath();
  if (!workspacePath) {
    // No need to show error here, as getCurrentWorkspacePath might already show one or it's called by a higher-level func
    return null;
  }

  const gitConfigPath = path.join(workspacePath, '.git', 'config');

  try {
    const configFileContent = await fs.promises.readFile(gitConfigPath, 'utf8');
    // Regex to find the [remote "origin"] section and then the url
    const remoteOriginRegex = /^\[remote\s+"origin"\](?:[^\n]*\n)*?\s*url\s*=\s*(.*)/m;
    const originMatch = remoteOriginRegex.exec(configFileContent);

    if (originMatch && originMatch[1]) {
      const url = originMatch[1];
      // Try to match HTTPS: https://github.com/owner/repo.git or SSH: git@github.com:owner/repo.git
      // This regex is a bit more general for different GitHub URL formats
      const urlMatch = url.match(/github\.com(?:[:\/])([^/]+)\/(.+?)(?:\.git)?$/i);

      if (urlMatch && urlMatch[1] && urlMatch[2]) {
        return { owner: urlMatch[1], repo: urlMatch[2] };
      }
    }
    vscode.window.showErrorMessage('Could not find remote "origin" URL in .git/config or URL format not recognized.');
    console.warn('Failed to parse owner/repo from .git/config. Content inspected:', configFileContent);
    return null;
  } catch (error: any) {
    // Avoid showing error if .git/config simply doesn't exist (e.g., not a git repo)
    if (error.code !== 'ENOENT') {
      vscode.window.showErrorMessage('Error reading or parsing .git/config: ' + error.message);
      console.error('Error reading or parsing .git/config:', error);
    }
    return null;
  }
}

// Define an interface for the Octokit client features we need
interface OctokitClient {
  repos: {
    get: (params: { owner: string; repo: string; }) => Promise<{ data: any; }>;
  };
  pulls?: {
    get?: (params: any) => Promise<any>;
  };
}

/**
 * Fetches the diff for a given pull request number.
 * @param octokit - The Octokit client instance
 * @param owner - The repository owner
 * @param repo - The repository name
 * @param pullNumber - The pull request number
 * @returns The diff as a string, or null if failed
 */
export async function fetchPullRequestDiff(
  octokit: any,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string | null> {
  try {
    const response = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: { format: 'diff' }
    });
    // The diff is in the response.data as a string
    if (typeof response.data === 'string') {
      return response.data;
    } else if (response.headers && response.headers['content-type'] === 'text/x-diff') {
      return response.data;
    } else {
      vscode.window.showErrorMessage('Unexpected response format when fetching PR diff.');
      return null;
    }
  } catch (error: any) {
    vscode.window.showErrorMessage('Failed to fetch PR diff: ' + error.message);
    console.error('Failed to fetch PR diff:', error);
    return null;
  }
}


// Factory function to get an Octokit client instance
async function getOctokitClient(): Promise<OctokitClient | null> {
  // IMPORTANT: Placeholder for GitHub token retrieval.
  // Replace with secure method like vscode.secrets.get('githubToken')
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    vscode.window.showErrorMessage('GitHub token not configured. Please set it in your settings or environment.');
    return null;
  }

  try {
    // Dynamically import Octokit
    const dynamicImport = new Function('modulePath', 'return import(modulePath);');
    const octokitModule = await dynamicImport('@octokit/rest');
    const OctokitActual = octokitModule.Octokit; // Access the class from the module
    // Cast to OctokitClient for compatibility, assuming OctokitActual instance structure matches
    return new OctokitActual({ auth: GITHUB_TOKEN }) as OctokitClient;
  } catch (error: any) {
    vscode.window.showErrorMessage('Failed to initialize GitHub client: ' + error.message);
    console.error('Failed to initialize GitHub client:', error);
    return null;
  }
}

async function getRepoInfo(octokit: OctokitClient | null, owner: string, repo: string): Promise<any | null> {
  if (!octokit) {
    vscode.window.showErrorMessage('Octokit client is not initialized.');
    return null;
  }
  try {
    const response = await octokit.repos.get({
      owner,
      repo,
    });

    return response.data;
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error using Octokit client for ${owner}/${repo}: ${error.message}`);
    console.error(`Error using Octokit client for ${owner}/${repo}:`, error);
    return null;
  }
}

export {
  getCurrentWorkspacePath,
  getRepositoryOwnerAndRepo, // Export the new function
  getOctokitClient,
  getRepoInfo
};

export {};
