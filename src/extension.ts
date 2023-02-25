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
  Uri,
  window,
  workspace,
  WorkspaceConfiguration,
} from "vscode";

import { DocToPreviewGenerator } from "./docToPreviewGenerator";
import { D2OutputChannel } from "./outputChannel";
import * as mdItContainer from "markdown-it-container";
import { layoutPicker } from "./layoutPicker";
import { themePicker } from "./themePicker";
import { TaskRunner } from "./taskRunner";
import { d2Tasks } from "./tasks";
import { util } from "./utility";
import path = require("path");
import { TextEncoder } from "util";

const d2Ext = "d2";
const d2Lang = "d2";
const previewGenerator: DocToPreviewGenerator = new DocToPreviewGenerator();

export const d2ConfigSection = "D2";
export let ws: WorkspaceConfiguration =
  workspace.getConfiguration(d2ConfigSection);
export const outputChannel: D2OutputChannel = new D2OutputChannel();
export const taskRunner: TaskRunner = new TaskRunner();
export let extContext: ExtensionContext;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function activate(context: ExtensionContext): any {
  extContext = context;

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
      if (e.document.languageId === d2Ext && e.contentChanges.length > 0) {
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

  context.subscriptions.push(
    commands.registerCommand("D2.CompileToSvg", (fileInfo) => {
      let filePath = fileInfo?.fsPath;

      if (filePath === undefined) {
        const activeEditor = window.activeTextEditor;
        filePath = activeEditor?.document.uri.fsPath;
        if (filePath === undefined) {
          return;
        }
      }

      workspace.openTextDocument(filePath).then((doc) => {
        taskRunner.genTask(filePath, doc.getText(), (svgText) => {
          if (svgText.length === 0) {
            outputChannel.appendError(`Unable to convert ${filePath}`);
            return;
          }

          const svgFilename =
            filePath.substr(0, filePath.lastIndexOf(".")) + ".svg";
          const encoder = new TextEncoder();
          const encodedText = encoder.encode(svgText);

          workspace.fs
            .writeFile(Uri.file(svgFilename), encodedText)
            .then(() => {
              outputChannel.appendInfo(
                `File ${filePath} converted to ${svgFilename}`
              );
            });
        });
      });
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
          d2Tasks.format(documentEditor);
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

  /**
   * Check that D2 is available up front
   */
  util.checkForD2Install();

  // Return our markdown renderer
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
      const activeEditor = path.parse(
        window.activeTextEditor?.document.fileName ?? ""
      ).dir;

      return d2Tasks.compile(code, activeEditor, (msg) => {
        outputChannel.appendInfo(msg);
      });
    }
    return highlight(code, lang);
  };

  return md;
}
