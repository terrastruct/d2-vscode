/**
 * d2 File Viewer Extension
 **/

import {
	commands,
	ExtensionContext,
	TextDocument,
	TextDocumentChangeEvent,
	window,
	workspace,
	WorkspaceConfiguration
} from 'vscode';

import { DocToPreviewGenerator } from './docToPreviewGenerator';
import { themePicker } from './themePicker';
import { layoutPicker } from './layoutPicker';

const d2Ext = 'd2';
export const d2ConfigSection = 'D2';

const previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();
export let ws: WorkspaceConfiguration = workspace.getConfiguration(d2ConfigSection);
export let extContext: ExtensionContext;

export function activate(context: ExtensionContext): void {

	extContext = context;

	context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
		const wsOld = ws;
		ws = workspace.getConfiguration(d2ConfigSection);

		if ((ws.get('previewLayout') !== wsOld.get('previewLayout')) ||
			(ws.get('previewTheme') !== wsOld.get('previewTheme'))) {
			const activeEditor = window.activeTextEditor;
			if (activeEditor?.document.languageId == d2Ext) {
				previewGenerator.generate(activeEditor.document);
			}
		}
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

	context.subscriptions.push(commands.registerCommand('D2.PickLayout', () => {
		const activeEditor = window.activeTextEditor;

		if (activeEditor?.document.languageId === d2Ext) {
			const layoutPick = new layoutPicker();
			layoutPick.showPicker().then((layout) => {
				if (layout) {
					ws.update('previewLayout', layout.label, true);
				}
			});
		}
	}));

	context.subscriptions.push(commands.registerCommand('D2.PickTheme', () => {
		const activeEditor = window.activeTextEditor;

		if (activeEditor?.document.languageId === d2Ext) {
			const themePick = new themePicker();
			themePick.showPicker().then((theme) => {
				if (theme) {
					ws.update('previewTheme', theme.label, true).then(() => {
						previewGenerator.generate(activeEditor.document);
					});
				}
			});
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
export function deactivate(): void { undefined }
