/**
 * Class to extract useful information from the D2 AST
 */

import {
  Diagnostic,
  DiagnosticSeverity,
  LSPAny,
  Location,
  Position,
  PublishDiagnosticsParams,
  Range,
  TextDocumentIdentifier,
} from "vscode-languageserver/node";
import { d2Range, d2StringAndRange } from "./dataContainers";

/**
 * Class that takes the returned string from the D2 cli
 * and makes sense out of it.
 */
export class AstContainer {
  constructor(astStr: string) {
    this.d2Info = JSON.parse(astStr);
    this.doNodes(this.d2Info.Ast.nodes);
  }

  // Full AST/IR/ERRORS
  d2Info: LSPAny = undefined;

  // Extracted Information from the AST
  private links: d2StringAndRange[] = [];
  nodes: d2StringAndRange[] = [];

  get Links(): d2StringAndRange[] {
    return this.links;
  }

  get Errors(): PublishDiagnosticsParams | undefined {
    const diags: Diagnostic[] = [];

    let hasErrors = false;
    if (this.d2Info.Err?.errs?.length > 0) {
      hasErrors = true;
      this.d2Info.Err.errs.forEach((e: LSPAny) => {
        const rg = new RegExp(/^(.*?):(\d+):(\d+):(\s+)(.*)$/g).exec(e.errmsg);
        const msg = rg !== null ? rg[5] : "Unknown Error";

        diags.push(
          Diagnostic.create(new d2Range(e.range).Range, msg, DiagnosticSeverity.Error)
        );
      });
    }
    return hasErrors ? { uri: "", diagnostics: diags } : undefined;
  }

  /**
   * Adds a d2StringAndRange to the list of nodes
   */
  private addNode(rawNode: d2StringAndRange): void {
    this.nodes.push(rawNode);
  }

  /**
   * Prints out a comment as seen by D2 (not needed now) 
  doComment(comment: LSPAny) {
    console.log("Comment: (" + comment.range + ")\n" + comment.value);
  }
  */

  /**
   * Takes the multiple representations of a string as described in
   * the D2 AST and stores it as just a string and range.
   */
  getStringAndRange(so: LSPAny): d2StringAndRange {
    if (so.single_quoted_string) {
      return new d2StringAndRange(
        so.single_quoted_string.range,
        so.single_quoted_string.value
      );
    }
    if (so.double_quoted_string) {
      return new d2StringAndRange(
        so.double_quoted_string.range,
        so.double_quoted_string.value[0].string
      );
    }
    if (so.unquoted_string) {
      return new d2StringAndRange(
        so.unquoted_string.range,
        so.unquoted_string.value[0].string
      );
    }
    if (so.block_string) {
      return new d2StringAndRange(
        so.block_string.range,
        `Tag: ${so.block_string.tag} -> ${so.block_string.value}`
      );
    }
    return new d2StringAndRange(null, "");
  }

  /**
   * Breaks apart the D2 AST PATH branch
   */
  doPath(path: LSPAny[]): d2StringAndRange[] {
    const arr: d2StringAndRange[] = [];
    path.forEach((p) => {
      const strAndR = this.getStringAndRange(p);
      arr.push(strAndR);
    });
    return arr;
  }

  /**
   * Breaks apart the D2 AST MAP_KEY branch
   */
  doMapKey(mapkey: LSPAny) {
    // IMPORT //
    if (mapkey.value?.import) {
      if (mapkey.value.import.path) {
        const strAndR: d2StringAndRange[] = this.doPath(mapkey.value.import.path);
        this.links.push(strAndR[0]);
      }
    } else {
      // NODE //
      if (mapkey.key?.path) {
        const strAndR: d2StringAndRange[] = this.doPath(mapkey.key.path);
        this.addNode(strAndR[0]);
      }
      // MORE COMPLEX NODES //
      if (mapkey.value) {
        /**
         * This will get a string_block, not needed now
         * 
        if (typeof mapkey.value === "string" || mapkey.value?.block_string) {
          const strAndR: d2StringAndRange = this.getStringAndRange(
            mapkey.value
          );
          console.log(`SB    -> ${strAndR}`);
        } else 
        */
        if (typeof mapkey.value === "object" && mapkey.value?.map) {
          this.doNodes(mapkey.value.map.nodes);
        }
        /**
         * These will get values from nodes, not needed now
         * 
        if (mapkey.value?.boolean) {
          const val: d2StringAndRange = new d2StringAndRange(
            mapkey.value.boolean.range,
            mapkey.value.boolean.value
          );
          console.log(`VAL   -> ${val}`);
        }
        if (mapkey.value?.unquoted_string) {
          const val: d2StringAndRange = new d2StringAndRange(
            mapkey.value.unquoted_string.range,
            mapkey.value.unquoted_string.value[0].string
          );
          console.log(`VAL   -> ${val}`);
        }
        if (mapkey.value?.single_quoted_string) {
          const val: d2StringAndRange = new d2StringAndRange(
            mapkey.value.single_quoted_string.range,
            mapkey.value.single_quoted_string.value[0].string
          );
          console.log(`VAL   -> ${val}`);
        }
        */
      }
      // EDGES //
      if (mapkey.edges) {
        const strAndRSrc: d2StringAndRange[] = this.doPath(mapkey.edges[0].src.path);
        this.addNode(strAndRSrc[0]);
        const strAndRDst: d2StringAndRange[] = this.doPath(mapkey.edges[0].dst.path);
        this.addNode(strAndRDst[0]);
      }
    }
  }

  /**
   * Iterate the list of nodes from the AST generation from D2 cli.
   */
  doNodes(nodes: LSPAny[]) {
    nodes.forEach((node) => {
      /**
       * Comment node, no need for it now
      if (node.comment) {
        this.doComment(node.comment);
      }
      */
      if (node.map_key) {
        this.doMapKey(node.map_key);
      }
    });
  }

  /**
   * Returns all the locations for references to the object below
   * the Position parameter
   */
  FindReferencesAtLocation(pos: Position, td: TextDocumentIdentifier): Location[] {
    const results: Location[] = [];

    const rNode = this.GetRangeFromLocation(pos);
    if (rNode) {
      const node = this.GetNodeFromRange(rNode);
      if (node) {
        this.nodes.forEach((n: d2StringAndRange) => {
          if (n.str === node.str) {
            results.push(
              Location.create(td.uri, Range.create(n.StartPosition, n.EndPosition))
            );
          }
        });
      }
    }
    return results;
  }

  /**
   * Given a range, get the node that it contains
   */
  GetNodeFromRange(r: Range): d2StringAndRange | undefined {
    for (const n of this.nodes) {
      if (
        n.Range.end.line === r.end.line &&
        n.Range.end.character === r.end.character &&
        n.Range.start.line === r.start.line &&
        n.Range.start.character === r.start.character
      ) {
        return n;
      }
    }
    return undefined;
  }

  /**
   * Returns the range of the object below the Position parameter
   */
  GetRangeFromLocation(pos: Position): Range | undefined {
    for (const n of this.nodes) {
      if (
        pos.line === n.StartPosition.line &&
        pos.character >= n.StartPosition.character &&
        pos.character <= n.EndPosition.character
      ) {
        return n.Range;
      }
    }

    return undefined;
  }
}
