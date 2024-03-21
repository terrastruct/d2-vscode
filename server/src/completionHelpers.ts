/**
 * Helper class for code completion
 */

import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  InsertTextFormat,
  InsertTextMode,
  Position,
} from "vscode-languageserver";

import path = require("path");
import { URI } from "vscode-uri";

import { getD2FilesFromPaths } from "./utility";
import { statSync } from "fs";
import { AstReader } from "./d2Ast";
import { ItemTree } from "./completionTree";
import { workspaceFolders } from "./server";

/**
 *
 */
export class CompletionHelper {
  /**
   *
   */
  static doImport(currentFile: string): CompletionList {
    const retFiles: CompletionItem[] = [];

    const curFileFS = URI.parse(currentFile).fsPath;
    const curFileDirFS = path.parse(URI.parse(currentFile).fsPath).dir;
    const pathsToScan: string[] = [];

    // No workspace, use the documents directory
    if (workspaceFolders.length === 0) {
      pathsToScan.push(curFileDirFS);
    } else {
      for (const wdir of workspaceFolders) {
        pathsToScan.push(URI.parse(wdir.uri).fsPath);
      }
    }

    const files = getD2FilesFromPaths(pathsToScan);

    for (const file of files) {
      // Don't allow import of the current file
      if (file === curFileFS) {
        continue;
      }

      const fst = statSync(file);
      const fiDate = fst.atime.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const fiSize = `${fst.size} bytes`;

      // The file name that gets insterted needs to be
      // a path relative to the document that it is
      // being inserted.
      const relFile = path.relative(curFileDirFS, file);
      const pp = path.parse(relFile);

      const ci = CompletionItem.create(relFile);
      ci.kind = CompletionItemKind.File;
      ci.insertText = path.join(pp.dir, pp.name);
      ci.commitCharacters = ["\t"];
      ci.labelDetails = { description: `${fiSize}  ${fiDate}` };

      retFiles.push(ci);
    }

    return CompletionList.create(retFiles);
  }

  /**
   *
   */
  static doAttribute(astData: AstReader, pos: Position): CompletionList {
    // Move position back one character to get node *before* trigger character
    const charPos = Math.max(0, pos.character - 1);

    const cis: CompletionItem[] = [];

    const ci = CompletionItem.create("{}");
    // eslint-disable-next-line no-template-curly-in-string
    ci.insertText = " {\n\t${0}\n}";
    ci.kind = CompletionItemKind.Snippet;
    ci.insertTextFormat = InsertTextFormat.Snippet;
    ci.insertTextMode = InsertTextMode.adjustIndentation;
    ci.commitCharacters = ["\t"];
    cis.push(ci);

    const node = astData.nodeAtPosition({ line: pos.line, character: charPos });
    if (node) {
      const vals = ItemTree.getValueFromPath(node);

      for (const v of vals) {
        const item = CompletionItem.create(v);
        item.kind = CompletionItemKind.Property;
        item.insertText = ` ${v}`;
        item.commitCharacters = ["\t"];
        cis.push(item);
      }
    }

    return CompletionList.create(cis, false);
  }

  /**
   *
   */
  static doDot(astData: AstReader, pos: Position): CompletionList {
    const compItems: CompletionItem[] = [];

    // Move position back one character to get node *before* trigger character
    const charPos = Math.max(0, pos.character - 1);

    const node = astData.nodeAtPosition({ line: pos.line, character: charPos });

    if (node) {
      const list: string[] = ItemTree.getListFromPath(node);

      for (const i of list) {
        const ci = CompletionItem.create(i);
        ci.kind = CompletionItemKind.Class;
        ci.commitCharacters = ["\t"];
        compItems.push(ci);
      }
    }

    return CompletionList.create(compItems, false);
  }

  /**
   *
   *
   */
  static doOpenSpace(astData: AstReader, pos: Position): CompletionList {
    const compItems: CompletionItem[] = [];

    // THIS NEEDS SOME MORE WORK TO DETECT WHICH COMPLETION HELPER SHOULD BE CALLED

    // const node = astData.nodeAtPosition({ line: pos.line, character: pos.character });

    // for (const tItem of ItemTree.Root) {
    //   compItems.push(CompletionItem.create(tItem.item));
    // }

    return CompletionList.create(compItems, false);
  }
}

/**
 ***********************
 * END OF FILE
 ***********************
 */
