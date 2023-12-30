/**
 * D2 Language Server
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  ReferenceParams,
  Location,
  RenameParams,
  WorkspaceEdit,
  PrepareRenameParams,
  Range,
  TextDocumentEdit,
  OptionalVersionedTextDocumentIdentifier,
  DocumentLink,
  CompletionParams,
  CompletionList,
  CompletionItem,
  TextEdit,
  DefinitionParams,
  TextDocumentChangeEvent,
  WorkspaceFolder,
  DocumentLinkParams,
} from "vscode-languageserver/node";

import { URI } from "vscode-uri";
import path = require("path");

import { TextDocument } from "vscode-languageserver-textdocument";
import { spawnSync } from "child_process";
import { AstReader } from "./d2Ast";
import { CompletionHelper } from "./completionHelpers";

// Holder of all parsed output from the D2 program
//
let astData: AstReader;

export let workspaceFolders: WorkspaceFolder[] = [];

export let d2ExePath = "d2";
export const d2Extension = ".d2";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

/**
 * Called when the server starts
 */
connection.onInitialize((params: InitializeParams): InitializeResult => {
  connection.console.log("\n***************************");
  connection.console.log("D2 Language Server Starting\n");
  connection.console.log(`Client:  ${params.clientInfo?.name}`);
  connection.console.log(`Version: ${params.clientInfo?.version}`);
  connection.console.log(`PID:     ${params.processId}`);
  connection.console.log("***************************\n");

  // This is what the server supports
  //
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      referencesProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      documentLinkProvider: {
        resolveProvider: false,
      },
      completionProvider: {
        triggerCharacters: [".", ":", "@"],
        resolveProvider: true,
      },
      workspace: {
        workspaceFolders: {
          supported: true,
        },
      },
      definitionProvider: true,
    },
    serverInfo: {
      name: "D2 Language Server",
      version: "0.7",
    },
  };

  return result;
});

/*
 * Pickup on configuration changes of the client
 */
connection.onDidChangeConfiguration((change): void => {
  // We'll use the path to D2 so we don't get divergent
  // functionality using two different d2 binaries.
  d2ExePath = change.settings.D2.execPath;
  connection.console.log(`Language Server D2 path: ${d2ExePath}`);
});

/**
 * The content of a text document has changed. This event is emitted
 * when the text document first opened or when its content has changed.
 */
documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>): void => {
  // This is where the D2 document is and is where d2 should assume
  // everthing is relative to
  const cwDir = URI.parse(path.dirname(change.document.uri)).fsPath;

  // Get the workspace folders on a regular basis, because of async
  connection.workspace.getWorkspaceFolders().then((folders: WorkspaceFolder[] | null) => {
    workspaceFolders = [];
    if (folders) {
      workspaceFolders = folders;
    }
  });

  // Run D2 in the stdin/stdout mode
  //
  const args: string[] = ["-"];

  /**
   * Run D2 in the special "D2_LSP_MODE" mode.
   */
  const proc = spawnSync(d2ExePath, args, {
    input: change.document.getText(),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 2,
    cwd: cwDir,
    env: { ...process.env, D2_LSP_MODE: "1" },
  });

  // Pass error back to the client
  if (proc.pid === 0) {
    connection.window.showErrorMessage(
      `Could not find D2 executable! Path: '${d2ExePath}'`
    );
    return;
  }

  if (proc.status !== 42) {
    connection.window.showErrorMessage(
      "Version mismatch between extenstion and language-server."
    );
  }

  // Reset Document Data and Parse out the json from the D2 program
  astData = new AstReader(proc.stdout);
  // astData.dump();

  /**
   * Handle any errors.
   */
  const eret = astData.Errors;

  // Clear Errors
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] });
  if (eret) {
    eret.uri = change.document.uri;
    connection.sendDiagnostics(eret);
  }
});

/**
 * If a trigger character is pressed, this is called
 */
connection.onCompletion((params: CompletionParams): CompletionList => {
  switch (params.context?.triggerCharacter) {
    case "@":
      return CompletionHelper.doImport(params.textDocument.uri);

    case ".":
      return CompletionHelper.doDot(astData, params.position);

    case ":":
      return CompletionHelper.doAttribute(astData, params.position);

    case undefined:
      return CompletionHelper.doOpenSpace(astData, params.position);
  }

  return CompletionList.create([], false);
});

/**
 * May not need this
 */
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

/**
 * Request for all document links
 */
connection.onDocumentLinks((params: DocumentLinkParams): DocumentLink[] => {
  const retLinks: DocumentLink[] = [];
  const cwDir = URI.parse(path.dirname(params.textDocument.uri)).fsPath;

  for (const link of astData.LinksAndImports) {
    link.resolvePath(cwDir);

    const docLink = DocumentLink.create(link.linkRange.Range);
    docLink.target = link.linkTarget;
    docLink.tooltip = link.linkTooltip;  
    
    retLinks.push(docLink);
  }

  return retLinks;
});

/**
 * Goto Definition
 */
connection.onDefinition((params: DefinitionParams): Location[] => {
  const locs: Location[] = [];

  const ref = astData.refAtPosition(params.position);
  if (ref) {
    const refs = astData.findAllMatchingReferences(ref);

    for (const r of refs) {
      if (!r.isRangeEqual(ref)) {
        locs.push(Location.create(params.textDocument.uri, r.Range));
      }
    }
  }

  return locs;
});

/**
 * Produce the edits needed to rename a node
 */
connection.onRenameRequest((params: RenameParams): WorkspaceEdit => {
  const workspaceChanges: WorkspaceEdit = {};

  const ref = astData.refAtPosition(params.position);

  if (ref) {
    const refs = astData.findAllMatchingReferences(ref);

    if (refs) {
      workspaceChanges.documentChanges = [];

      const ed = TextDocumentEdit.create(
        OptionalVersionedTextDocumentIdentifier.create(params.textDocument.uri, 0),
        []
      );
      ed.edits = [];

      for (const l of refs) {
        ed.edits.push(TextEdit.replace(l.Range, params.newName));
      }

      workspaceChanges.documentChanges = [ed];
    }
  }

  return workspaceChanges;
});

/**
 * Called before onRenameRequest to position
 * the rename edit control
 */
connection.onPrepareRename(
  (params: PrepareRenameParams): Range | { defaultBehavior: boolean } => {
    const ref = astData.refAtPosition(params.position);
    if (ref) {
      // This is where the edit control will be placed for
      // the rename parameter.  It appears to only work when the
      // symbol to be renamed is selected by this range.  A zero,
      // "length" range will cause onRenameRequest to not be called.
      return ref.Range;
    }

    return { defaultBehavior: false };
  }
);

/**
 * When, "show all references", is choosen, this
 * returns all references for the symbol under the caret
 */
connection.onReferences((params: ReferenceParams): Location[] => {
  const locs: Location[] = [];

  const ref = astData.refAtPosition(params.position);
  if (ref) {
    const refs = astData.findAllMatchingReferences(ref);

    for (const r of refs) {
      locs.push(Location.create(params.textDocument.uri, r.Range));
    }
  }

  return locs;
});

/**
 * Listen on the connection, returns when the server is shutdown.
 */
connection.listen();

/**
 * Make the text document manager listen on the connection
 * for open, change and close text document events
 */
documents.listen(connection);

/**
 ***********************
 * END OF FILE
 ***********************
 */
