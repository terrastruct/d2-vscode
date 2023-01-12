/**
 * d2 File Viewer Extension
 **/

import {
	commands,
	ConfigurationChangeEvent,
	ExtensionContext,
	languages,
	TextDocument,
	TextDocumentChangeEvent,
	TextDocumentSaveReason,
	TextDocumentWillSaveEvent,
	TextEdit,
	window,
	workspace,
	WorkspaceConfiguration
} from 'vscode';

import { DocToPreviewGenerator } from './docToPreviewGenerator';
import { DocumentFormatter } from './documentFormatter';
import { D2OutputChannel } from './outputChannel';
const mdItContainer = require('markdown-it-container');

const d2Ext = 'd2';
const d2Lang = 'd2';
export let d2ConfigSection = 'D2';

const previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();
const documentFormatter: DocumentFormatter = new DocumentFormatter();
export let ws: WorkspaceConfiguration = workspace.getConfiguration('D2');

export let outputChannel: D2OutputChannel;
export let extContext: ExtensionContext;

export function activate(context: ExtensionContext) {

	extContext = context;
	outputChannel = new D2OutputChannel();
	
	context.subscriptions.push(workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
		ws = workspace.getConfiguration(d2ConfigSection);
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

	// User actually forced a save, NOT auto save
	let hardSave = false;

	context.subscriptions.push(workspace.onWillSaveTextDocument((e: TextDocumentWillSaveEvent) => {
		if (e.document.languageId === d2Ext) {
			hardSave = e.reason === TextDocumentSaveReason.Manual;
		}
	}));

	context.subscriptions.push(workspace.onDidSaveTextDocument((doc: TextDocument) => {
		if (doc.languageId === d2Ext) {
			const updateOnSave = ws.get('updateOnSave', false);

			const trk = previewGenerator.getTrackObject(doc);

			if (updateOnSave && hardSave && trk?.outputDoc) {
				previewGenerator.generate(doc);
			}
			hardSave = false;
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

	languages.registerDocumentFormattingEditProvider({ language: d2Lang, scheme: "file" }, {
		provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {

			const editor = window.visibleTextEditors.find(
				(editor) => editor.document === document
			);

			if (editor) {
				documentFormatter.format(editor);
			}

			return [];
		}
	});

	// * Find all open d2 files and add to tracker
	workspace.textDocuments.forEach((td: TextDocument) => {
		if (td.languageId === d2Ext) {
			previewGenerator.createObjectToTrack(td);
		}
	});

	return {
		extendMarkdownIt(md: any) {
			return extendMarkdownItWithD2(md);
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate(): void { }

const pluginKeyword = 'd2';

export function extendMarkdownItWithD2(md: any) {
	md.use(mdItContainer, pluginKeyword, {});

	const highlight = md.options.highlight;
	md.options.highlight = (code: string, lang: string) => {
		if (lang === d2Lang) {
			return previewGenerator.generateFromText(code);
		}
		return highlight(code, lang);
	};
	return md;
}


