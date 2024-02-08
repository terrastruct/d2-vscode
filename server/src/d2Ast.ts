/**
 * Used to take the ast JSON that is produced by the D2
 * command line tool and form it into something the
 * autocompletion and definition/reference/rename
 * capabilities can use.
 */

import {
  Diagnostic,
  DiagnosticSeverity,
  LSPAny,
  PublishDiagnosticsParams,
} from "vscode-languageserver";

import { d2ExternalLink, d2Node, d2Range, d2StringAndRange } from "./dataContainers";
import { Position } from "vscode-languageserver-textdocument";
import { connection } from "./server";

/**
 * AstReader class.  Takes the returned json text and
 * forms usable data for the language server
 */
export class AstReader {
  constructor(astStr: string) {
    try {
      this.d2Info = JSON.parse(astStr);
    } catch (err) {
      connection.console.error("Possilble D2/VsCode version mismatch.");
      connection.console.error(astStr);
    }

    this.range = this.d2Info?.Ast.range;

    this.processNodes(this.d2Info?.Ast.nodes);
  }

  /**
   * Storage for class data
   */
  private range: d2Range;
  private d2Info: LSPAny;
  private nodes: d2Node[] = [];
  private references: d2StringAndRange[] | undefined;

  /**
   * Returns errors for the 'problems' window from any
   * errors produced during AST creation. This leaves a
   * blind spot for errors that are created during IR,
   * since that phase isn't used by the language server
   * to save compute time.
   */
  get Errors(): PublishDiagnosticsParams | undefined {
    const diags: Diagnostic[] = [];

    let hasErrors = false;
    if (this.d2Info.Err?.errs?.length > 0) {
      hasErrors = true;
      for (const e of this.d2Info.Err.errs) {
        const rg = new RegExp(/^(.*?):(\d+):(\d+):(\s+)(.*)$/g).exec(e.errmsg);
        const msg = rg !== null ? rg[5] : "Unknown Error";

        diags.push(
          Diagnostic.create(new d2Range(e.range).Range, msg, DiagnosticSeverity.Error)
        );
      }
    }
    return hasErrors ? { uri: "", diagnostics: diags } : undefined;
  }

  /**
   * Returns the list of links and imports so they can
   * be rendered in the editor
   */
  get LinksAndImports(): d2ExternalLink[] {
    const rngRet: d2ExternalLink[] = [];

    for (const n of this.nodes) {
      if (n.isLink || n.isImport) {
        rngRet.push(new d2ExternalLink(n));
      }
    }

    return rngRet;
  }

  /**
   * Find all references, which is the sum of nodes and
   * edges.  Since this may be used in multiple contexts,
   * the values are cached so this loop doesn't have to run
   * multiple times.
   */
  get References(): d2StringAndRange[] {
    if (!this.references) {
      this.references = [];

      for (const node of this.nodes) {
        // Edges
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
   * Given a reference, return all references that are the same
   */
  public findAllMatchingReferences(ref: d2StringAndRange): d2StringAndRange[] {
    const retArray: d2StringAndRange[] = [];
    for (const r of this.References) {
      if (r.str === ref.str) {
        retArray.push(r);
      }
    }
    return retArray;
  }

  /**
   * Of all the references, which one is at the given position
   */
  public refAtPosition(pos: Position): d2StringAndRange | undefined {
    for (const r of this.References) {
      // TODO: Does this need to be more specific like nodeAtPosition?
      const [isNode] = r.isPositionInRange(pos);
      if (isNode) {
        return r;
      }
    }
    return undefined;
  }

  /**
   * Get's the inner most node that is at the given position
   */
  public nodeAtPosition(pos: Position): d2Node | undefined {
    let topScore = Number.MAX_SAFE_INTEGER;
    let nRet;

    for (const n of this.nodes) {
      const [isNode, score] = n.isPositionInRange(pos);

      if (isNode && score < topScore) {
        topScore = score;
        nRet = n;
      }
    }
    return nRet;
  }

  /**
   * Go through all the ast's node objects and break them
   * apart to be used by the language server
   */
  private processNodes(nodes: LSPAny[]) {
    for (const node of nodes ?? []) {
      const n = new d2Node(node);
      this.nodes.push(n);

      // NodeValues are nodes too!
      if (n.hasNodeValues) {
        for (const nv of n.nodeValueNodes) {
          this.nodes.push(nv);
        }
      }
    }
  }

  dump(): void {
    console.log(`\n---------\nASTREADER: ${this.range.toString()}\n---------\n`);

    for (const n of this.nodes) {
      console.log(n.toString());
    }
  }
}
