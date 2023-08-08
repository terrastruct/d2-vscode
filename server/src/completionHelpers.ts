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
import URI from "vscode-uri";

import { getD2Files } from "./utility";
import { statSync } from "fs";
import { AstReader } from "./d2Ast";
import { ItemTree } from "./completionTree";

/**
 *
 */
export class CompletionHelper {
  /**
   *
   */
  static doImport(dir: string, currentFile: string): CompletionList {
    const dirToScan = URI.parse(dir).fsPath;
    const curFileShort = path.parse(URI.parse(currentFile).fsPath).name;
    const files = getD2Files(dirToScan);
    const compFiles: CompletionItem[] = [];

    for (let file of files) {
      const fst = statSync(file);
      file = file.replace(dirToScan + "/", "").replace(".d2", "");
      if (file === curFileShort) {
        continue;
      }

      const fiDate = fst.atime.toLocaleDateString();
      const fiSize = fst.size.toString() + " bytes";

      const ci = CompletionItem.create(file);
      ci.kind = CompletionItemKind.File;
      ci.commitCharacters = ["\t"];
      ci.labelDetails = { description: `${fiSize}  ${fiDate}` };

      compFiles.push(ci);
    }

    return CompletionList.create(compFiles);
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
        item.insertText = `${v}`;
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
        ci.kind = CompletionItemKind.Constant;
        compItems.push(ci);
      }
    }

    return CompletionList.create(compItems, false);
  }

  /**
   *
   *
   */
  static doOpenSpace(): CompletionList {
    const compItems: CompletionItem[] = [];

    for (const tItem of ItemTree.Root) {
      compItems.push(CompletionItem.create(tItem.item));
    }

    return CompletionList.create(compItems, false);
  }
}

/**
 ***********************
 * END OF FILE
 ***********************
 */
