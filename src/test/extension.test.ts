import * as assert from 'assert';
import * as sinon from 'sinon';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import './extension.unit-tests';


suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('copilot-code-reviewer.listPRs calls sendPRsToChatParticipant and handles PRs', async () => {
		const showInfoStub = sinon.stub(vscode.window, 'showInformationMessage');
		const showErrorStub = sinon.stub(vscode.window, 'showErrorMessage');

		// Simulate the command registration and execution
		const extension = require('../extension');
		const sendPRsStub = sinon.stub().resolves();
		// Register a test-specific command handler using the factory for dependency injection
		const disposable = vscode.commands.registerCommand('copilot-code-reviewer.listPRs.test', extension.listPRsCommandFactory(sendPRsStub));
		// Simulate repo info and Octokit client
		const repoInfo = { owner: 'farleyknight', repo: 'copilot-code-reviewer' };
		const mockPRs = [
			{ number: 1, title: 'Test PR', user: { login: 'alice' }, html_url: 'https://github.com/x/y/pull/1' },
			{ number: 2, title: 'Another PR', user: { login: 'bob' }, html_url: 'https://github.com/x/y/pull/2' }
		];
		const pullsListStub = sinon.stub().resolves({ data: mockPRs });
		const octokit = { pulls: { list: pullsListStub, get: sinon.stub() }, repos: { get: sinon.stub() } } as any;

		// Patch getRepositoryOwnerAndRepo and getOctokitClient
		const github = require('../github');
		const repoStub = sinon.stub(github, 'getRepositoryOwnerAndRepo').resolves(repoInfo);
		const octokitStub = sinon.stub(github, 'getOctokitClient').resolves(octokit);

		await vscode.commands.executeCommand('copilot-code-reviewer.listPRs.test');

		assert.ok(sendPRsStub.calledOnce, 'sendPRsToChatParticipant should be called');
		assert.deepStrictEqual(sendPRsStub.firstCall.args[0], mockPRs, 'sendPRsToChatParticipant should be called with PRs');
		assert.ok(showInfoStub.notCalled, 'No info message expected for non-empty PR list');
		assert.ok(showErrorStub.notCalled, 'No error expected for happy path');
		disposable.dispose();

		// Test empty PRs
		pullsListStub.resolves({ data: [] });
		await vscode.commands.executeCommand('copilot-code-reviewer.listPRs');
		assert.ok(showInfoStub.calledWith('No open pull requests found for this repository.'));

		// Cleanup
		showInfoStub.restore();
		showErrorStub.restore();
		repoStub.restore();
		octokitStub.restore();
	});
});
