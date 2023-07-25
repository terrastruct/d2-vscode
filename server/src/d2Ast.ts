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
   * @param pos 
   * @returns 
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
   * @param nodes 
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

/**
 * 
 */
class d2Path {
  constructor(paths: LSPAny[]) {
    for (const path of paths || []) {
      this.pathList.push(new d2Value(path));
    }
  }

  private pathList: d2Value[] = [];

  get first(): d2Value | undefined {
    const l = this.pathList.length;
    if (l > 0) {
      return this.pathList[0];
    }

    return undefined;
  }

  get last(): d2Value | undefined {
    const l = this.pathList.length;
    if (l > 0) {
      return this.pathList[l - 1];
    }

    return undefined;
  }

  public toString(): string {
    const s: string[] = [];
    for (const path of this.pathList) {
      s.push(path.value?.strValue || "-");
    }
    return `${s.join(".")}`;
  }
}

/**
 * 
 */
class d2Primary {
  constructor(p: LSPAny) {
    this.primary = new d2Value(p);
  }

  primary: d2Value;

  public get hasValue() {
    if (this.primary.value) {
      return true;
    }
    return false;
  }

  public toString(): string {
    return `${this.primary}`;
  }
}

/**
 * 
 */
class d2Key extends d2Range {
  constructor(k: LSPAny) {
    super(k.range);
    this.path = new d2Path(k.path);
  }

  path: d2Path;

  get isLink(): boolean {
    if (this.path.last?.value?.strValue === 'link') {
      return true;
    }
    return false;
  }

  get key(): d2StringAndRange | undefined {
    return this.path.first?.value;
  }

  public toString(): string {
    return `KEY: ${this.path.toString()} : ${super.toString()}`;
  }
}

/**
 * 
 */
class d2Value extends d2Range {
  constructor(v: LSPAny) {
    super(v?.range || null);
    this.value = this.doValue(v);
  }

  value: d2StringAndRange | undefined;

  /**
   * These will get values from a node
   */
  private doValue(value: LSPAny): d2StringAndRange | undefined {
    /**
     * This will get a string_block, not needed now
     */
    // if (typeof value === "string" || value?.block_string) {
    //     const strAndR: d2StringAndRange = this.getStringAndRange(value);
    //     console.log(`SB      -> ${strAndR}`);
    // }

    let valRet;

    if (value?.number) {
      valRet = new d2StringAndRange(value.number.range, value.number.value);
    }
    if (value?.boolean) {
      valRet = new d2StringAndRange(value.boolean.range, value.boolean.value);
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

    if (value?.import) {
      valRet = new d2StringAndRange(value.import.range, value.import.value);
    }

    return valRet;
  }

  public toString(): string {
    return `VALUE: ${this.value} : ${super.toString()}`;
  }
}

/**
 * 
 */
class d2NodeValue extends d2Range {
  constructor(nv: LSPAny) {
    super(nv.range);
    for (const node of nv.nodes) {
      this.nodes.push(new d2Node(node));
    }
  }

  nodes: d2Node[] = [];

  public toString(): string {
    let strRet = "";
    for (const n of this.nodes) {
      strRet += n.toString() + "\n";
    }
    return `${strRet} : ${super.toString()}`;
  }
}

/**
 * 
 */
class d2Import extends d2Range {
  constructor(i: LSPAny) {
    super(i.range);
    this.path = new d2Path(i.path);
  }

  path: d2Path;

  public toString(): string {
    return `IMPORT: ${this.path} : ${super.toString()}`;
  }
}

/**
 * 
 */
class d2EdgeEndpoint extends d2Range {
  constructor(ep: LSPAny) {
    super(ep?.range);
    this.path = new d2Path(ep?.path);
  }

  private path: d2Path;

  get edgeNode(): d2StringAndRange | undefined {
    return this.path.first?.value;
  }

  public toString(): string {
    return `${this.path} : ${super.toString()}`;
  }
}

/**
 * 
 */
class d2Edge extends d2Range {
  constructor(edge: LSPAny) {
    super(edge?.range);
    this.srcArrow = edge.src_arrow;
    this.dstArrow = edge.dst_arrow;

    this.srcEndPt = new d2EdgeEndpoint(edge.src);
    this.dstEndPt = new d2EdgeEndpoint(edge.dst);
  }

  private srcArrow: string;
  private dstArrow: string;

  private srcEndPt: d2EdgeEndpoint;
  private dstEndPt: d2EdgeEndpoint;

  get src(): d2EdgeEndpoint {
    return this.srcEndPt;
  }

  get dst(): d2EdgeEndpoint {
    return this.dstEndPt;
  }

  public toString(): string {
    return `${this.srcEndPt} ${this.srcArrow}-${this.dstArrow} ${this.dstEndPt
      } : ${super.toString()}`;
  }
}

/**
 * 
 */
class d2Node extends d2Range {
  constructor(n: LSPAny) {
    super(n.map_key.range);

    if (n.map_key.key) {
      this.key = new d2Key(n.map_key.key);
    } else if (n.map_key.edges) {
      for (const edge of n.map_key.edges) {
        this.edges.push(new d2Edge(edge));
      }
    }

    this.primary = new d2Primary(n.map_key.primary);

    if (n.map_key.value?.map?.nodes) {
      this.value = new d2NodeValue(n.map_key.value.map);
    } else if (n.map_key.value?.import) {
      this.value = new d2Import(n.map_key.value.import);
    } else if (n.map_key.value) {
      this.value = new d2Value(n.map_key.value);
    }
  }

  /**
   * 
   */
  private key: d2Key | undefined;
  private primary: d2Primary | undefined;
  private value: d2NodeValue | d2Value | d2Import | undefined;

  private edges: d2Edge[] = [];

  /**
   * Properties
   */
  public get propValue(): d2StringAndRange | undefined {
    if (this.isImport) {
      return (this.value as d2Import).path.last?.value;
    }
    if (this.isLink) {
      return (this.value as d2Value).value;
    }
    return undefined;
  }

  get hasEdges(): boolean {
    return Boolean(this.edges.length > 0);
  }

  get Edges(): d2Edge[] {
    return this.edges;
  }

  get hasKey(): boolean {
    return Boolean(this.key);
  }

  get Key(): d2Key | undefined {
    return this.key;
  }

  get hasPrimary(): boolean {
    return Boolean(this.primary?.hasValue);
  }

  get hasValue(): boolean {
    if (!this.value) {
      return false;
    }

    if ("path" in this.value) {
      return Boolean(this.value.path);
    }

    if ("nodes" in this.value) {
      return Boolean(this.value.nodes);
    }

    if ("value" in this.value) {
      return Boolean(this.value.value);
    }

    return false;
  }

  get isImport(): boolean {
    return this.value instanceof d2Import;
  }

  get isLink(): boolean {
    return Boolean(this.key?.isLink);
  }

  public toString(): string {
    let strRet = `\nNODE: ${super.toString()}\n----\n`;
    
    if (this.hasKey) {
      strRet += `${this.key?.toString()}`;
    } else if (this.hasEdges) {
        let s = `\nEdges\n-----\n`;
        for (const edge of this.edges) {
          s += `${edge.toString()}\n`;
        }
        strRet += s + "\n";
    }

    strRet += this.hasPrimary ? `Primary: ${this.primary?.toString()}\n` : "";
    strRet += this.hasValue ? `Value: ${this.value?.toString()}\n` : "\n";
    strRet += "\n";
    return strRet;
  }
}
