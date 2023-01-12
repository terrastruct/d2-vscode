/**
 * d2 File Viewer Extension
 **/

import {
	commands,
	ConfigurationChangeEvent,
	ExtensionContext,
	TextDocument,
	TextDocumentChangeEvent,
	window,
	workspace,
	WorkspaceConfiguration
} from 'vscode';

import { DocToPreviewGenerator } from './docToPreviewGenerator';

const d2Ext = 'd2';

const previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();
let ws: WorkspaceConfiguration = workspace.getConfiguration('D2');
export let extContext: ExtensionContext;

export function activate(context: ExtensionContext): void {

	extContext = context;

	context.subscriptions.push(workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
		ws = workspace.getConfiguration('D2');
	}));

	context.subscriptions.push(workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
		if (e.document.languageId === d2Ext) {
			const autoUp = ws.get('autoUpdate', false);

			if (autoUp) {
				const trk = previewGenerator.getTrackObject(e.document);
				trk?.timer?.reset();
			}
		}
	}));

	context.subscriptions.push(workspace.onDidSaveTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			const updateOnSave = ws.get('updateOnSave', false);

			const trk = previewGenerator.getTrackObject(doc);

			// If we don't have preview window open, then no need to update it
			if (updateOnSave && trk?.outputDoc) {
				previewGenerator.generate(doc);
			}
		}
	}));

	context.subscriptions.push(workspace.onDidOpenTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			previewGenerator.createObjectToTrack(doc);
		}
	}));

	context.subscriptions.push(workspace.onDidCloseTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			previewGenerator.deleteObjectToTrack(doc);
		}
	}));

	context.subscriptions.push(commands.registerCommand('D2.ShowPreviewWindow', () => {
		const activeEditor = window.activeTextEditor;

		if (activeEditor?.document.languageId === d2Ext) {
			previewGenerator.generate(activeEditor.document);
		}

	}));

	// * Find all open d2 files and add to tracker
	workspace.textDocuments.forEach((td: TextDocument) => {
		if (td.languageId === d2Ext) {
			previewGenerator.createObjectToTrack(td);
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate(): void { }
