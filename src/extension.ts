/**
 * d2 File Viewer Extension
 **/

import {
  commands,
  ExtensionContext,
  languages,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentSaveReason,
  TextDocumentWillSaveEvent,
  TextEdit,
  window,
  workspace,
  WorkspaceConfiguration,
} from "vscode";

import { DocToPreviewGenerator } from "./docToPreviewGenerator";
import { DocumentFormatter } from "./documentFormatter";
import { D2OutputChannel } from "./outputChannel";
import * as mdItContainer from "markdown-it-container";
import { layoutPicker } from "./layoutPicker";
import { themePicker } from "./themePicker";

const d2Ext = "d2";
const d2Lang = "d2";
export const d2ConfigSection = "D2";

const previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();
const documentFormatter: DocumentFormatter = new DocumentFormatter();
export let ws: WorkspaceConfiguration =
  workspace.getConfiguration(d2ConfigSection);

export let outputChannel: D2OutputChannel;
export let extContext: ExtensionContext;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function activate(context: ExtensionContext): any {
  extContext = context;
  outputChannel = new D2OutputChannel();

  context.subscriptions.push(
    workspace.onDidChangeConfiguration(() => {
      const wsOld = ws;
      ws = workspace.getConfiguration(d2ConfigSection);

      if (
        ws.get("previewLayout") !== wsOld.get("previewLayout") ||
        ws.get("previewTheme") !== wsOld.get("previewTheme") ||
        ws.get("previewSketch") !== wsOld.get("previewSketch")
      ) {
        const activeEditor = window.activeTextEditor;
        if (activeEditor?.document.languageId === d2Ext) {
          previewGenerator.generate(activeEditor.document);
        }
      }
    })
  );

  context.subscriptions.push(
    workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
      if (e.document.languageId === d2Ext) {
        const autoUp = ws.get("autoUpdate", false);

        if (autoUp) {
          const trk = previewGenerator.getTrackObject(e.document);
          trk?.timer?.reset();
        }
      }
    })
  );

  // User actually forced a save, NOT auto save
  let hardSave = false;

  context.subscriptions.push(
    workspace.onWillSaveTextDocument((e: TextDocumentWillSaveEvent) => {
      if (e.document.languageId === d2Ext) {
        hardSave = e.reason === TextDocumentSaveReason.Manual;
      }
    })
  );

  context.subscriptions.push(
    workspace.onDidSaveTextDocument((doc: TextDocument) => {
      if (doc.languageId === d2Ext) {
        const updateOnSave = ws.get("updateOnSave", false);

        const trk = previewGenerator.getTrackObject(doc);

        // If we don't have preview window open, then no need to update it
        if (updateOnSave && hardSave && trk?.outputDoc) {
          previewGenerator.generate(doc);
        }

        hardSave = false;
      }
    })
  );

  context.subscriptions.push(
    workspace.onDidOpenTextDocument((doc: TextDocument) => {
      if (doc.languageId === d2Ext) {
        previewGenerator.createObjectToTrack(doc);
      }
    })
  );

  context.subscriptions.push(
    workspace.onDidCloseTextDocument((doc: TextDocument) => {
      if (doc.languageId === d2Ext) {
        previewGenerator.deleteObjectToTrack(doc);
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand("D2.ShowPreviewWindow", () => {
      const activeEditor = window.activeTextEditor;

      if (activeEditor?.document.languageId === d2Ext) {
        previewGenerator.generate(activeEditor.document);

        const trk = previewGenerator.getTrackObject(activeEditor.document);
        trk?.outputDoc?.show();
      }
    })
  );

  languages.registerDocumentFormattingEditProvider(
    { language: d2Lang, scheme: "file" },
    {
      provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
        const documentEditor = window.visibleTextEditors.find(
          (editor) => editor.document === document
        );

        if (documentEditor) {
          documentFormatter.format(documentEditor);
        }

        return [];
      },
    }
  );

  context.subscriptions.push(
    commands.registerCommand("D2.PickLayout", () => {
      const activeEditor = window.activeTextEditor;

      if (activeEditor?.document.languageId === d2Ext) {
        const layoutPick = new layoutPicker();
        layoutPick.showPicker().then((layout) => {
          if (layout) {
            ws.update("previewLayout", layout.label, true);
          }
        });
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand("D2.PickTheme", () => {
      const activeEditor = window.activeTextEditor;

      if (activeEditor?.document.languageId === d2Ext) {
        const themePick = new themePicker();
        themePick.showPicker().then((theme) => {
          if (theme) {
            ws.update("previewTheme", theme.label, true);
          }
        });
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand("D2.ToggleSketch", () => {
      const activeEditor = window.activeTextEditor;

      if (activeEditor?.document.languageId === d2Ext) {
        const current: boolean = ws.get("previewSketch", false);
        ws.update("previewSketch", !current, true);
      }
    })
  );

  /** Find all open d2 files and add to tracker if they are
   *  open before the extension loads
   */
  workspace.textDocuments.forEach((td: TextDocument) => {
    if (td.languageId === d2Ext) {
      previewGenerator.createObjectToTrack(td);
    }
  });

  return {
    // Sets up our ability to render for markdown files
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extendMarkdownIt(md: any) {
      return extendMarkdownItWithD2(md);
    },
  };
}

const pluginKeyword = "d2";

/**
 *
 * This function will be asked by the Markdown system to render
 * a d2 snippit in a markdown file
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extendMarkdownItWithD2(md: any): unknown {
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
