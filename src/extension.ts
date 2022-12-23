/**
 * d2 File Viewer Extension
 **/

import {
	commands,
	ExtensionContext,
	TextDocument,
	TextDocumentChangeEvent,
	TextDocumentChangeReason,
	TextDocumentSaveReason,
	TextDocumentWillSaveEvent,
	window,
	workspace,
	WorkspaceConfiguration
} from 'vscode';

import { DocToPreviewGenerator } from './docToPreviewGenerator';
import { DocumentFormatter } from './documentFormatter';

const d2Ext = 'd2';

const previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();
const documentFormatter: DocumentFormatter = new DocumentFormatter();
const ws: WorkspaceConfiguration = workspace.getConfiguration('d2-viewer');
export let extContext: ExtensionContext;

export function activate(context: ExtensionContext): void {

	extContext = context;

	context.subscriptions.push(workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
		if (e.document.languageId === d2Ext) {
			const autoUp = ws.get('autoUpdate', false);

			if (autoUp) {
				const trk = previewGenerator.getTrackObject(e.document);
				trk?.timer?.reset();
			}
		}
	}));

	context.subscriptions.push(workspace.onWillSaveTextDocument((env: TextDocumentWillSaveEvent) => {
		if (env.document.languageId === d2Ext) {
			const formatOnSave = ws.get('formatOnSave', false);

			const editor = window.visibleTextEditors.find(
				(editor) => editor.document === env.document
			 );

			if (formatOnSave && 
				env.reason === TextDocumentSaveReason.Manual &&
				editor) {
				documentFormatter.format(editor);
			}
		}
	}));

	context.subscriptions.push(workspace.onDidSaveTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			const updateOnSave = ws.get('updateOnSave', false);

			const trk = previewGenerator.getTrackObject(doc);

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

	context.subscriptions.push(commands.registerCommand('d2-viewer.ShowPreviewWindow', () => {
		const activeEditor = window.activeTextEditor;

		if (activeEditor?.document.languageId === d2Ext) {
			previewGenerator.generate(activeEditor.document);
		}

	}));

	context.subscriptions.push(commands.registerCommand('d2-viewer.FormatD2Document', () => {
		const activeEditor = window.activeTextEditor;

		if (activeEditor?.document.languageId === d2Ext) {
			documentFormatter.format(activeEditor);
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
export function deactivate(): void {}
