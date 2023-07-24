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

/**
 * 
 */
export class AstReader {
  constructor(astStr: LSPAny) {
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

  doNodes(nodes: LSPAny[]) {
    for (const node of nodes) {
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

class d2Path {
  constructor(paths: LSPAny[]) {
    for (const path of paths) {
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
    return `PRIMARY: ${this.primary}`;
  }
}

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

  public toString(): string {
    return `KEY: ${this.path.toString()} : ${super.toString()}`;
  }
}

class d2Value extends d2Range {
  constructor(v: LSPAny) {
    super(v?.range || null);
    this.value = this.doValue(v);
  }

  value: d2StringAndRange | undefined;

  /**
   * These will get values from node
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
    return `VALUE: ${this.value}`;
  }
}

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
    return `${strRet}`;
  }
}

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

class d2EdgeEndpoint extends d2Range {
  constructor(ep: LSPAny) {
    super(ep.range);
    this.path = new d2Path(ep.path);
  }

  path: d2Path;

  public toString(): string {
    return `${this.path}`;
  }
}

class d2Edge extends d2Range {
  constructor(edge: LSPAny) {
    super(edge?.range);
    this.srcArrow = edge.src_arrow;
    this.dstArrow = edge.dst_arrow;

    this.srcEndPt = new d2EdgeEndpoint(edge.src);
    this.dstEndPt = new d2EdgeEndpoint(edge.dst);
  }

  srcArrow: string;
  dstArrow: string;

  srcEndPt: d2EdgeEndpoint;
  dstEndPt: d2EdgeEndpoint;

  public toString(): string {
    return `${this.srcEndPt} ${this.srcArrow}-${this.dstArrow} ${this.dstEndPt
      } : ${super.toString()}`;
  }
}

class d2Edges {
  constructor(edges: LSPAny) {
    for (const edge of edges) {
      this.edges.push(new d2Edge(edge));
    }
  }

  edges: d2Edge[] = [];

  public toString(): string {
    let strRet = "";
    for (const e of this.edges) {
      strRet += e.toString() + "\n";
    }
    return strRet;
  }
}

class d2Node extends d2Range {
  constructor(n: LSPAny) {
    super(n.map_key.range);

    if (n.map_key.key) {
      this.key = new d2Key(n.map_key.key);
    } else if (n.map_key.edges) {
      this.edges = new d2Edges(n.map_key.edges);
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

  private edges: d2Edges | undefined;

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

  get isEdge(): boolean {
    return Boolean(this.edges);
  }

  get isKeyVal(): boolean {
    return Boolean(this.key);
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
    strRet += this.isKeyVal ? `${this.key?.toString()}\n` : `${this.edges?.toString()}\n`;
    strRet += this.hasPrimary ? `${this.primary?.toString()}\n` : "";
    strRet += this.hasValue ? `${this.value?.toString()}\n` : "\n";
    strRet += "\n";
    return strRet;
  }
}
