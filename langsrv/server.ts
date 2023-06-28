/* D2_LSP_AST */

import { spawnSync } from "child_process";

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  ReferenceParams,
  Location,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { d2DocumentData } from "./parsedLanguage";

let docData: d2DocumentData;

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  connection.console.log(
    "\n***************************\nD2 Language Server Starting\n"
  );
  connection.console.log(`Client:  ${params.clientInfo?.name}`);
  connection.console.log(`Version: ${params.clientInfo?.version}`);
  connection.console.log(`PID:     ${params.processId}`)

  connection.console.log("***************************\n")

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
      // hoverProvider: true,
      // documentHighlightProvider: true,
      referencesProvider: true,
    },
    serverInfo: {
      name: "D2 Language Server",
      version: "0.5"
    }
  };

  return result;
});

connection.onInitialized(() => {
  connection.console.log("Language Server Initialized");
});

connection.onDidChangeConfiguration((change) => {
  connection.console.log("Client Configuration Changed: " + JSON.stringify(change.settings, null, 2));
});

/*
connection.onHover((evt): Hover => {
  connection.console.log(`Hover: ${evt.position} ${evt.position.character}`);

  const endPos = evt.position;
  endPos.character += 2;

  return {
    contents: "foobar",
    range: {
      start: evt.position,
      end: endPos,
    }
  }
});
*/

// Only keep settings for open documents
documents.onDidClose((e) => {
  connection.console.log(`Document Closed: ${e.document.uri}`);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  connection.console.log(
    `Document Changed: ${change.document.version} -> ${change.document.uri}`
  );

  const args: string[] = ["-"];

  /**
   * Run D2 in the special "D2_LSP_MODE" mode.
   */
  const proc = spawnSync("/home/barry/Projects/d2/d2", args, {
    input: change.document.getText(),
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 2,
    env: { "D2_LSP_MODE": "1" }
  });

  // TODO: Need a better failure mode...
  if (proc.pid === 0) {
    connection.console.log("PID is ZERO")
  }

  // Reset Document Data
  docData = new d2DocumentData();
  docData.ReadD2Data(proc.stdout);

  debugger;
  const eret = docData.GetErrors();
  // Clear Errors
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics: [] });
  if (eret[0]) {
    eret[1].uri = change.document.uri;
    connection.sendDiagnostics(eret[1]);
  }
});

/**
 * 
 */
connection.onReferences((params: ReferenceParams): Location[] => {
  console.log("onReferences: " + JSON.stringify(params, null, 2));

  return docData.FindReferencesAtLocation(params.position, params.textDocument)
});

/**
 * 
 */
/*
connection.onDocumentHighlight((params: DocumentHighlightParams): DocumentHighlight[] => {
  console.log("onDocumentHighlight: " + JSON.stringify(params, null, 2));
    
  return [];
});
*/

/**
 * 
 */
connection.onCompletion((tdp: TextDocumentPositionParams): CompletionItem[] => {
  connection.console.log(
    `OnCompletion: Line -> ${tdp.position.line} Char: -> ${tdp.position.character}`
  );
  // The pass parameter contains the postion of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: "TypeScript",
      kind: CompletionItemKind.Text,
      data: 1,
    },
    {
      label: "JavaScript",
      kind: CompletionItemKind.Text,
      data: 2,
    },
  ];
});

/**
 *
 */
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  connection.console.log("onCompletionResolve");
  if (item.data === 1) {
    item.detail = "TypeScript details";
    item.documentation = "TypeScript documentation";
  } else if (item.data === 2) {
    item.detail = "JavaScript details";
    item.documentation = "JavaScript documentation";
  }
  return item;
});

/**
 * Make the text document manager listen on the connection
 * for open, change and close text document events
 */
documents.listen(connection);

/**
 * Listen on the connection
 */
connection.listen();


/** 
 ***********************
 * END OF FILE
 ***********************
 */

