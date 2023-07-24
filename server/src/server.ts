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
  // TextEdit,
  WorkspaceEdit,
  PrepareRenameParams,
  Range,
  TextDocumentEdit,
  OptionalVersionedTextDocumentIdentifier,
  DocumentLink,
  CompletionParams,
  CompletionList,
  CompletionItem,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { spawnSync } from "child_process";
import URI from "vscode-uri";

import path = require("path");

import { AstReader } from "./d2Ast";
import { CompletionHelper } from "./completionHelpers";

// Holder of all parsed output from the D2 program
//
let astData: AstReader;
let cwd: string;

export let d2ExePath = "d2";

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
      completionProvider: {
        triggerCharacters: [".", ":", "@"],
        resolveProvider: true,
      },
    },
    serverInfo: {
      name: "D2 Language Server",
      version: "0.6",
    },
  };

  return result;
});

/**
 *
 */
connection.onCompletion((params: CompletionParams): CompletionList => {
  console.log(
    `onCompletion (${params.context?.triggerCharacter}): ` + JSON.stringify(params)
  );

  switch (params.context?.triggerCharacter) {
    case "@":
      return CompletionHelper.doImport(cwd, params.textDocument.uri);

    case ".":
      console.log("!!!!!!!! Uncomment !!!!!!!!!!!!");
      // return CompletionHelper.doDot(astData, params.position);

      break;

    case ":":
      return CompletionHelper.doAttribute();
  }

  return CompletionList.create([], false);
});

/**
 * May not need this
 */
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  console.log("\nonCompletionResolve: " + JSON.stringify(item, null, 2) + "\n");

  return item;
});

/**
 * Request for all document links
 */
connection.onDocumentLinks((): DocumentLink[] => {
  const retLinks: DocumentLink[] = [];

  for (const link of astData.LinksAndImports) {
    const docLink = DocumentLink.create(link.Range);

    let docPath = link.strValue.replace(/['|"]/g, "");

    // If '.d2' is there, get rid of it.
    docPath = path.basename(docPath, ".d2");

    docLink.target = path.join(cwd, docPath + ".d2");

    retLinks.push(docLink);
  }

  return retLinks;
});

/*
 * Pickup on configuration changes of the client
 */
connection.onDidChangeConfiguration((change) => {
  // We'll use the path to D2 so we don't get divergent
  // functionality using two different d2 binaries.
  d2ExePath = change.settings.D2.execPath;
  connection.console.info(`Language Server D2 path: ${d2ExePath}`);
});

/**
 * The content of a text document has changed. This event is emitted
 * when the text document first opened or when its content has changed.
 */
documents.onDidChangeContent((change) => {
  console.log(`Change: ${change.document.uri}`);


  cwd = path.dirname(change.document.uri);
  const baseDir = URI.parse(cwd).fsPath;

  const args: string[] = ["-"];

  /**
   * Run D2 in the special "D2_LSP_MODE" mode.
   */
  const proc = spawnSync(d2ExePath, args, {
    input: change.document.getText(),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 2,
    cwd: baseDir,
    env: { ...process.env, D2_LSP_MODE: "1" },
  });

  // Pass error back to the client
  if (proc.pid === 0) {
    connection.window.showErrorMessage(
      `Could not find D2 executable! Path: '${d2ExePath}'`
    );
    return;
  }

  const start = Date.now();

  // Reset Document Data and Parse out the json from the D2 program
  astData = new AstReader(proc.stdout);

  const end = Date.now();
  // Debug
  astData.dump();
  console.log(`\n\nAST Read Time: ${end - start} ms`);

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
 * Produce the edits needed to rename a node
 */
connection.onRenameRequest((params: RenameParams): WorkspaceEdit => {
  // const locs  = astData.FindReferencesAtLocation(
  //   params.position,
  //   params.textDocument
  // );

  const workspaceChanges: WorkspaceEdit = {};
  workspaceChanges.documentChanges = [];

  const ed = TextDocumentEdit.create(
    OptionalVersionedTextDocumentIdentifier.create(params.textDocument.uri, 0),
    []
  );
  ed.edits = [];

  // for (const l of locs) {
  //   ed.edits.push(TextEdit.replace(l.range, params.newName));
  // }

  workspaceChanges.documentChanges = [ed];

  return workspaceChanges;
});

/**
 * Called before onRenameRequest to position the rename edit control
 */
connection.onPrepareRename(
  (params: PrepareRenameParams): Range | { defaultBehavior: boolean } => {
    // const r = astData.GetRangeFromLocation(params.position);
    // if (r) {
    //   return r;
    // }

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
  console.log(JSON.stringify(params, null, 2));
  // return astData.FindReferencesAtLocation(params.position, params.textDocument);
  return [];
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
