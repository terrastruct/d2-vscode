/**
 * 
 */
import {
  Diagnostic,
  DiagnosticSeverity,
  LSPAny,
  PublishDiagnosticsParams,
} from "vscode-languageserver";

import {
  d2Node,
  d2Range,
  d2StringAndRange
} from "./dataContainers";
import { Position } from "vscode-languageserver-textdocument";

/**
 * 
 */
export class AstReader {
  constructor(astStr: string) {
    this.d2Info = JSON.parse(astStr);
    this.range = this.d2Info.Ast.range;
    // console.log(JSON.stringify(this.d2Info, null, 2));
    this.doNodes(this.d2Info.Ast.nodes);
  }

  /**
   * 
   */
  private range: d2Range;
  private d2Info: LSPAny;
  private nodes: d2Node[] = [];

  get Errors(): PublishDiagnosticsParams | undefined {
    const diags: Diagnostic[] = [];

    let hasErrors = false;
    if (this.d2Info.Err?.errs?.length > 0) {
      hasErrors = true;
      for (const e of this.d2Info.Err.errs) {
        const rg = new RegExp(/^(.*?):(\d+):(\d+):(\s+)(.*)$/g).exec(e.errmsg);
        const msg = rg !== null ? rg[5] : "Unknown Error";

        diags.push(
          Diagnostic.create(
            new d2Range(e.range).Range,
            msg,
            DiagnosticSeverity.Error
          )
        );
      }
    }
    return hasErrors ? { uri: "", diagnostics: diags } : undefined;
  }

  /**
   * 
   */
  get LinksAndImports(): d2StringAndRange[] {
    const rngRet: d2StringAndRange[] = [];

    for (const n of this.nodes) {
      if (n.isLink || n.isImport) {
        if (n.propValue) {
          rngRet.push(n.propValue);
        }
      }
    }

    return rngRet;
  }

  private references: d2StringAndRange[] | undefined;

  /**
   * 
   */
  get References(): d2StringAndRange[] {
    if (!this.references) {
      this.references = [];

      for (const node of this.nodes) {

        // Edges
        //
        if (node.hasEdges) {
          for (const edge of node.Edges) {
            if (edge.src.edgeNode) {
              this.references.push(edge.src.edgeNode);
            }
            if (edge.dst.edgeNode) {
              this.references.push(edge.dst.edgeNode);
            }
          }
        }

        if (node.hasKey) {
          if (node.Key?.key) {
            this.references.push(node.Key.key);
          }
        }
      }
    }

    return this.references;
  }

  /**
   * 
   */
  public findAllMatchingReferences(ref: d2StringAndRange) : d2StringAndRange[] {
    const retArray: d2StringAndRange[] = [];
    for (const r of this.References) {
      if (r.strValue === ref.strValue) {
        retArray.push(r);
      }
    }
    return retArray;
  }
  
  /**
   * 
   */
  public refAtPosition(pos: Position): d2StringAndRange | undefined {
    for (const r of this.References) {
      if (r.isPositionInRange(pos)) {
        return r;
      }
    }
    return undefined;
  }

  /**
   * 
   */
  public nodeAtPosition(pos: Position): d2Node | undefined {
    for (const n of this.nodes) {
      if (n.isPositionInRange(pos)) {
        return n;
      }
    }
    return undefined;
  }
  
  /**
   * 
   */
  private doNodes(nodes: LSPAny[]) {
    for (const node of nodes || []) {
      // console.log("---------------------------------")
      // console.log(JSON.stringify(node, null, 2));
      // console.log("---------------------------------")
      const n = new d2Node(node);
      this.nodes.push(n);
    }
  }

  dump(): void {
    console.log(`\n---------\nASTREADER: ${this.range.toString()}\n---------\n`);

    for (const n of this.nodes) {
      console.log(n.toString());
    }
  }
}
