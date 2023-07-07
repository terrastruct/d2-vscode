/**
 * D2 Language Server
 *
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
  TextEdit,
  WorkspaceEdit,
  PrepareRenameParams,
  Range,
  TextDocumentEdit,
  OptionalVersionedTextDocumentIdentifier,
  DocumentLink,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { spawnSync } from "child_process";

import path = require("path");

import { AstContainer } from "./d2Ast";
import { d2StringAndRange } from "./dataContainers";

// Holder of all parsed output from the D2 program
//
let astData: AstContainer;
let cwd: string;

export let d2ExePath = "D2";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

/**
 * Called when the server starts
 */
connection.onInitialize((params: InitializeParams) => {
  connection.console.log("\n***************************");
  connection.console.log("D2 Language Server Starting\n");
  connection.console.log(`Client:  ${params.clientInfo?.name}`);
  connection.console.log(`Version: ${params.clientInfo?.version}`);
  connection.console.log(`PID:     ${params.processId}`);
  connection.console.log("***************************\n");

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
    },
    serverInfo: {
      name: "D2 Language Server",
      version: "0.6",
    },
  };

  return result;
});

connection.onDocumentLinks((): DocumentLink[] => {
  const retLinks: DocumentLink[] = [];

  astData.Links.forEach((link: d2StringAndRange) => {
    const docLink = DocumentLink.create(link.Range);

    let docPath = link.str.replace(/['|"]/g, "");

    // If '.d2' is there, get rid of it.
    docPath = path.basename(docPath, ".d2");

    docLink.target = path.join(cwd, docPath + ".d2");

    retLinks.push(docLink);
  });

  return retLinks;
});

/**
 * Pickup on configuration changes of the client
 */
connection.onDidChangeConfiguration((change) => {
  // We'll use the path to D2 so we don't get divergent
  // functionality
  d2ExePath = change.settings.execPath;
});

/**
 * The content of a text document has changed. This event is emitted
 * when the text document first opened or when its content has changed.
 */
documents.onDidChangeContent((change) => {
  console.log(`Change: ${change.document.uri}`);

  const args: string[] = ["-"];

  /**
   * Run D2 in the special "D2_LSP_MODE" mode.
   */
  // TODO: get this path from the settings
  const proc = spawnSync("/home/barry/Projects/d2/d2", args, {
    input: change.document.getText(),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 2,
    env: { D2_LSP_MODE: "1" },
  });

  // Pass error back to the client
  if (proc.pid === 0) {
    connection.window.showErrorMessage("Could not find D2 executable!");
    return;
  }

  // Reset Document Data and Parse out the json from the D2 program
  astData = new AstContainer(proc.stdout);

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

  cwd = path.dirname(change.document.uri);
});

/**
 * Produce the edits needed to rename a node
 */
connection.onRenameRequest((params: RenameParams): WorkspaceEdit => {
  const locs = astData.FindReferencesAtLocation(params.position, params.textDocument);

  const workspaceChanges: WorkspaceEdit = {};
  workspaceChanges.documentChanges = [];

  const ed = TextDocumentEdit.create(
    OptionalVersionedTextDocumentIdentifier.create(params.textDocument.uri, 0),
    []
  );
  ed.edits = [];

  locs.forEach((l: Location) => {
    ed.edits.push(TextEdit.replace(l.range, params.newName));
  });

  workspaceChanges.documentChanges = [ed];

  return workspaceChanges;
});

/**
 * Called before onRenameRequest to position the rename edit control
 */
connection.onPrepareRename(
  (params: PrepareRenameParams): Range | { defaultBehavior: boolean } => {
    const r = astData.GetRangeFromLocation(params.position);
    if (r) {
      return r;
    }

    // This is where the edit control will be placed for
    // the rename parameter.  It appears to only work when the
    // symbol to be renamed is selected by this range.  A zero,
    // "length" range will cause onRenameRequest to not be called.
    return { start: params.position, end: params.position };
  }
);

/**
 * When, "show all references", is choosen, this returns all references
 * for the symbol under the caret
 */
connection.onReferences((params: ReferenceParams): Location[] => {
  return astData.FindReferencesAtLocation(params.position, params.textDocument);
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
