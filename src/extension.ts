/**
 * d2 File Viewer Extension
 **/

import {
	workspace,
	TextDocumentChangeEvent,
	TextDocument,
	ExtensionContext,
	commands,
	window,
	WorkspaceConfiguration
} from 'vscode';

import { DocToPreviewGenerator } from './docToPreviewGenerator';

const d2Ext = 'd2';

let previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();
let ws: WorkspaceConfiguration = workspace.getConfiguration('d2-viewer');

export function activate(context: ExtensionContext): void {

	context.subscriptions.push(workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
		if (e.document.languageId === d2Ext) {
			let autoUp = ws.get('autoUpdate', false);

			if (autoUp) {
				let trk = previewGenerator.getTrackObject(e.document);
				trk?.timer?.reset();
			}
		}
	}));

	context.subscriptions.push(workspace.onDidSaveTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			let updateOnSave = ws.get('updateOnSave', false);

			if (updateOnSave) {
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

	context.subscriptions.push(commands.registerCommand('d2-viewer.ShowPreviewWindow', () => {
		let activeEditor = window.activeTextEditor;

		if (activeEditor?.document.languageId === d2Ext) {
			previewGenerator.generate(activeEditor.document);
		}

	}));

	// * Find all open d2 files and add to tracker
	workspace.textDocuments.forEach((td: TextDocument, idx: number) => {
		if (td.languageId === d2Ext) {
			previewGenerator.createObjectToTrack(td);
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate(): void {
	previewGenerator.dispose();
}
