/**
 * Class to extract useful information from the D2 AST
 *
 * Edges need to go in node list, find all references doesn't work otherwise
 * links need to go in import/link list
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
import { DataCollector } from "./dataCollector";

/**
 * Class that takes the returned string from the D2 cli
 * and makes sense out of it.
 */
export class AstContainer {
  constructor(astStr: string) {
    this.d2Info = JSON.parse(astStr);
    console.log(JSON.stringify(this.d2Info, null, 2));
    this.doNodes(this.d2Info.Ast.nodes);
  }

  // Full AST/ERRORS
  d2Info: LSPAny = undefined;
  d2Collector: DataCollector = new DataCollector();

  // Extracted Information from the AST
  private links: d2StringAndRange[] = [];
  nodes: d2StringAndRange[] = [];

  private depth = 0;

  /**
   * Get the list of links (linked files and import files)
   */
  get Links(): d2StringAndRange[] {
    return this.links;
  }

  /**
   * Gets the list of errors, or undefined if there is none
   */
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
    console.log(`(${this.depth}) NODE     -> ` + rawNode.toString() + "\n");
    this.nodes.push(rawNode);
    this.d2Collector.addNode(rawNode);
  }

  /**
   * Prints out a comment as seen by D2 (not needed now) 
   */
  doComment(comment: LSPAny): void {
    console.log(`(${this.depth}) Comment: (` + comment.range + ")\n" + comment.value);
  }

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
    if (!path) {
      return [];
    }

    const arr: d2StringAndRange[] = [];
    path.forEach((p) => {
      const strAndR = this.getStringAndRange(p);
      console.log(`(${this.depth}) PATH     -> ` + strAndR.toString())

      arr.push(strAndR);
      this.d2Collector.addPath(strAndR);
    });
    return arr;
  }

  /**
   * These will get values from node
   */
  doValue(value: LSPAny): void {
    /**
     * This will get a string_block, not needed now
     */
    if (typeof value === "string" || value?.block_string) {
      const strAndR: d2StringAndRange = this.getStringAndRange(value);
      console.log(`SB      -> ${strAndR}`);
    } else if (typeof value === "object" && value?.map) {
      this.doNodes(value.map.nodes);
    }

    let valRet;

    if (value?.boolean) {
      valRet = new d2StringAndRange(
        value.boolean.range,
        value.boolean.value
      );
    }
    if (value?.unquoted_string) {
      valRet = new d2StringAndRange(
        value.unquoted_string.range,
        value.unquoted_string.value[0].string
      );
    }
    if (value?.single_quoted_string) {
      valRet = new d2StringAndRange(
        value.single_quoted_string.range,
        value.single_quoted_string.value[0].string
      );
    }

    if (valRet) {
      console.log(`(${this.depth}) VAL      -> ${valRet}`);
      this.d2Collector.addValue(valRet);
    }
  }

  /**
   * Breaks apart the D2 AST MAP_KEY branch
   */
  doMapKey(mapkey: LSPAny): void { 
    // NODE //
    if (mapkey.key?.path) {
      const strAndR: d2StringAndRange[] = this.doPath(mapkey.key.path);
      this.addNode(strAndR[0]);
    }
    // VALUE //
    if (mapkey.value) {

      this.doValue(mapkey.value);

      console.log("");
    }
    // EDGES //
    if (mapkey.edges) {
      mapkey.edges.forEach((edge: LSPAny) => {
        let src = new d2StringAndRange("", "");
        let dst = new d2StringAndRange("", "");

        const strAndRSrc: d2StringAndRange[] = this.doPath(edge.src.path);
        src = strAndRSrc[0];
        this.addNode(src);
        /**
         * COMPLETION NOTE: If path is null, then we need to complete the edge with a node
         */
        if (edge.dst !== null) {
          const strAndRDst: d2StringAndRange[] = this.doPath(edge.dst.path);
          dst = strAndRDst[0];
          this.addNode(dst);
        } else {
          console.log(`Incomplete Edge (${strAndRSrc[0]}): Save for completion??`)
        }

        console.log(`(${this.depth}) EDGENODE -> ${src} :: ${dst}\n`)

        this.d2Collector.addEdge(src, dst);
      });
    }
    // IMPORT //
    if (mapkey.value?.import) {
      if (mapkey.value.import.path) {
        const strAndR: d2StringAndRange[] = this.doPath(mapkey.value.import.path);
        console.log(`(${this.depth}) IMPORT   -> ${strAndR}`);
        strAndR.forEach((sr) => {
          this.d2Collector.addImport(sr)
        });
        this.links.push(strAndR[0]);
      }
    }
  }

  /**
   * Iterate the list of nodes from the AST generation from D2 cli.
   */
  doNodes(nodes: LSPAny[]): void {
    debugger;
    this.depth++;
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
    this.depth--;
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

  /**
   * 
   */
  dump(): void {
    console.log("\n\nCOLLECTOR\n---------\n");
    this.d2Collector.dump();

  }

}
