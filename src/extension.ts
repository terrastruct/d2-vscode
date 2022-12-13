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
	WorkspaceConfiguration,
	OutputChannel
} from 'vscode';

import { DocToPreviewGenerator } from './docToPreviewGenerator';

const d2Ext = 'd2';

let outputChannel: OutputChannel = window.createOutputChannel('D2-Output');
let previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator(outputChannel);

export function activate(context: ExtensionContext): void {

	context.subscriptions.push(workspace.onDidOpenTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			previewGenerator.createObjectToTrack(doc);

			outputChannel.appendLine(`Tracking File: ${doc.fileName}`);
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
			previewGenerator.generateWatch(activeEditor.document);
		}

	}));

	// * Find all open d2 files and add to tracker
	workspace.textDocuments.forEach((td: TextDocument, idx: number) => {
		if (td.languageId === d2Ext) {
			previewGenerator.createObjectToTrack(td);

			outputChannel.appendLine(`Tracking File: ${td.fileName}`);
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate(): void { }


