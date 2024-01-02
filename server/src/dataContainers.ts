/**
 * Various data holder classes, conversions and coercion
 */

import pathUtil = require("path");
import { DiagnosticSeverity, LSPAny, Position, Range } from "vscode-languageserver/node";
import { d2Extension } from "./server";

/**
 * Represents a document range as converted from D2
 */
export class d2Range {
  constructor(r: string | null) {
    if (r === null) {
      return;
    }

    const rg = new RegExp(/(.*),(\d*):(\d*):(\d*)-(\d*):(\d*):(\d*)/g).exec(r);
    if (rg === null) {
      return;
    }

    this.fileName = rg[1] ?? "";

    this.startLine = parseInt(rg[2], 10);
    this.startColumn = parseInt(rg[3], 10);
    this.startByte = parseInt(rg[4], 10);

    this.endLine = parseInt(rg[5], 10);
    this.endColumn = parseInt(rg[6], 10);
    this.endByte = parseInt(rg[7], 10);
  }

  fileName = "-";

  startLine = 0;
  startColumn = 0;
  startByte = 0;

  endLine = 0;
  endColumn = 0;
  endByte = 0;

  // Are two ranges equal
  public isRangeEqual(r: d2Range | undefined): boolean {
    if (
      r &&
      r.startLine === this.startLine &&
      r.endLine === this.endLine &&
      r.startColumn === this.startColumn &&
      r.endColumn === this.endColumn
    ) {
      return true;
    }
    return false;
  }

  private isPositionAfter(pos: Position): boolean {
    if (pos.line > this.startLine) {
      return true;
    }
    if (pos.line === this.startLine && pos.character >= this.startColumn) {
      return true;
    }
    return false;
  }

  private isPositionBefore(pos: Position): boolean {
    if (pos.line < this.endLine) {
      return true;
    }
    if (pos.line === this.endLine && pos.character <= this.endColumn) {
      return true;
    }
    return false;
  }

  // Is the position withen the range
  public isPositionInRange(pos: Position): [inRange: boolean, posScore: number] {
    if (this.isPositionAfter(pos) && this.isPositionBefore(pos)) {
      return [true, this.endByte - this.startByte];
    }
    return [false, -1];
  }

  // Filename the range is describing
  get FileName(): string {
    return this.fileName;
  }

  // Start Position of the Range
  get StartPosition(): Position {
    return Position.create(this.startLine, this.startColumn);
  }

  // End Position of the Range
  get EndPosition(): Position {
    return Position.create(this.endLine, this.endColumn);
  }

  // Convert from a D2 range to vscode range
  get Range(): Range {
    return Range.create(this.StartPosition, this.EndPosition);
  }

  public set(range: d2Range | undefined): void {
    this.startByte = range?.startByte ?? 0;
    this.startLine = range?.startLine ?? 0;
    this.startColumn = range?.startColumn ?? 0;
    this.endByte = range?.endByte ?? 0;
    this.endLine = range?.endLine ?? 0;
    this.endColumn = range?.endColumn ?? 0;
    this.fileName = range?.fileName ?? "-";
  }

  public toString(): string {
    if (this.startByte === 0 && this.endByte === 0) {
      debugger;
    }
    return `Range: ${this.fileName} : (${this.startLine},${this.startColumn},[${this.startByte}]):(${this.endLine},${this.endColumn},[${this.endByte}])\n`;
  }
}

/**
 * Describes an error as returned by D2
 */
export class d2Error extends d2Range {
  constructor(e: LSPAny) {
    super(e.range);

    const rg = new RegExp(/^(.*?):(\d+):(\d+):(\s+)(.*)$/g).exec(e.errmsg);
    this.msg = rg !== null ? rg[5] : "Unknown Error";

    this.sev = DiagnosticSeverity.Error;
  }

  private msg: string;
  private sev: DiagnosticSeverity;

  // Error message
  get message() {
    return this.msg;
  }

  // Error severity
  get severity() {
    return this.sev;
  }

  public toString(): string {
    return `Err: ${super.toString()}\n  ${this.msg}  `;
  }
}

/**
 * Represents text, with the range that points to it
 */
export class d2StringAndRange extends d2Range {
  constructor(r: string | null, s: string) {
    super(r);
    this.strValue = s ?? "";
  }

  private strValue: string;

  // String value
  get str() {
    return this.strValue;
  }

  public toString(): string {
    return `String: ${this.strValue.toString()}  ${super.toString()}`;
  }
}

/**
 * Complete path of a node
 */
export class d2Path {
  constructor(paths: LSPAny[]) {
    for (const path of paths ?? []) {
      this.pathList.push(new d2Value(path));
    }
  }

  private pathList: d2Value[] = [];

  // returns the complete path
  get list(): d2Value[] {
    return this.pathList;
  }

  // Is this only a node, with an empty path
  get isNodeOnly(): boolean {
    return this.pathList.length === 1;
  }

  // First item in the list, could be called 'node'
  get first(): d2Value | undefined {
    const l = this.pathList.length;
    if (l > 0) {
      return this.pathList[0];
    }

    return undefined;
  }

  // last path item
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
      s.push(path.value?.str ?? "-");
    }
    return `Path: ${s.join(".")}`;
  }
}

/**
 * Primary value (used for some nodes)
 */
export class d2Primary {
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
    return `  Primary: ${this.primary}\n`;
  }
}

/**
 * Key in a node
 */
export class d2Key extends d2Range {
  constructor(k: LSPAny) {
    super(k.range);
    this.path = new d2Path(k.path);
  }

  public readonly path: d2Path;

  get key(): d2StringAndRange | undefined {
    return this.path.first?.value;
  }

  // Is this key a link?
  get isLink(): boolean {
    if (this.path.last?.value?.str === "link") {
      return true;
    }
    return false;
  }

  // Does this key have a path
  get hasPath(): boolean {
    return Boolean(this.path.first);
  }

  public toString(): string {
    return `Key: ${super.toString()}  ${this.path.toString()}\n`;
  }
}

/**
 * Describes a nodes value
 */
export class d2Value {
  constructor(v: LSPAny) {
    this.val = this.doValue(v);
  }

  private val: d2StringAndRange | undefined;

  // Get the value
  get value(): d2StringAndRange | undefined {
    return this.val;
  }

  /**
   * These will get values from a node
   */
  private doValue(value: LSPAny): d2StringAndRange | undefined {
    /**
     * This will get a string_block, not needed now
     */
    // if (typeof value === "string" ?? value?.block_string) {
    //     const strAndR: d2StringAndRange = this.getStringAndRange(value);
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
    if (value?.double_quoted_string) {
      valRet = new d2StringAndRange(
        value.double_quoted_string.range,
        value.double_quoted_string.value[0].string
      );
    }
    if (value?.import) {
      valRet = new d2StringAndRange(value.import.range, value.import.value);
    }

    return valRet;
  }

  public toString(): string {
    return `  Value: ${this.val}\n`;
  }
}

/**
 * Nodes within a node
 */
export class d2NodeValue extends d2Range {
  constructor(nv: LSPAny) {
    super(nv.range);
    for (const node of nv.nodes) {
      this.nodeValues.push(new d2Node(node));
    }
  }

  private nodeValues: d2Node[] = [];

  get nodes() {
    return this.nodeValues;
  }

  public toString(): string {
    let strRet = "\n  ";
    for (const n of this.nodes) {
      strRet += "  " + n.toString() + "\n";
    }
    return `\n===========\nNode Value:  ${super.toString()}  ${strRet}===========\n`;
  }
}

export class d2ExternalLink {
  constructor(node: LSPAny) {
    this.range = new d2Range("");
    this.node = node;
    this.target = "";
    this.tooltip = "";
  }

  private range: d2Range;
  private node: d2Node;
  private target: string;
  private tooltip: string;

  public resolvePath(pathStr: string): void {
    if (this.node.isImport) {
      this.range.set(this.node.propValue);
      const pv = this.node.propValue;
      if (pv instanceof d2Import) {
        const pp = pathUtil.parse(pv.impFile);
        const newPath = pathUtil.join(
          pathStr,
          pv.preStr,
          pv.impFile + (pp.ext === d2Extension ? "" : d2Extension)
        );

        this.target = newPath;
        this.tooltip = `${newPath}`;
      }
    } else if (this.node.isLink) {
      this.range.set(this.node.propValue);
      const pv = this.node.propValue;
      if (pv instanceof d2StringAndRange) {
        this.target = pathUtil.join(pathStr, pv.str);
        this.tooltip = `${pv.str}`;
      }
    }
  }

  get linkRange(): d2Range {
    return this.range;
  }

  get linkTarget(): string {
    return this.target;
  }

  get linkTooltip(): string {
    return this.tooltip;
  }
}

/**
 * A D2 Import, which is like a node, but isn't
 */
export class d2Import extends d2Range {
  constructor(i: LSPAny) {
    super(i.range);
    this.pre = i?.pre;
    this.path = new d2Path(i.path);
  }

  get preStr(): string {
    return this.pre;
  }

  get impFile(): string {
    return this.path.last?.value?.str ?? "";
  }

  get hasPathValue(): boolean {
    return Boolean(this.path);
  }

  private pre: string;
  private path: d2Path;

  public toString(): string {
    return `Import: ${super.toString()} | Pre: ${this.pre} | ${this.path}\n`;
  }
}

/**
 * An edge endpoint (eg. a -> b, 'a' and 'b' are both endpoints)
 */
export class d2EdgeEndpoint extends d2Range {
  constructor(ep: LSPAny) {
    super(ep?.range);
    this.path = new d2Path(ep?.path);
  }

  private path: d2Path;

  get edgeNode(): d2StringAndRange | undefined {
    return this.path.first?.value;
  }

  public toString(): string {
    return `EndPoint: ${super.toString()}  ${this.path}\n`;
  }
}

/**
 * Describes a D2 edge, which is two edge endpoints
 */
export class d2Edge extends d2Range {
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
    return `Edge: ${super.toString()}  ${this.srcEndPt}\n  ${this.srcArrow}-${
      this.dstArrow
    }\n  ${this.dstEndPt}\n`;
  }
}

/**
 * A D2 node
 */
export class d2Node extends d2Range {
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
   * Node values to keep track of
   */
  private key: d2Key | undefined;
  private primary: d2Primary | undefined;
  private value: d2NodeValue | d2Value | d2Import | undefined;

  private edges: d2Edge[] = [];

  /**
   * Properties
   */
  public get propValue(): d2StringAndRange | d2Import | undefined {
    if (this.isImport) {
      return this.value as d2Import;
    }
    if (this.isLink) {
      return (this.value as d2Value).value;
    }
    return undefined;
  }

  // Node has edges
  get hasEdges(): boolean {
    return Boolean(this.edges.length > 0);
  }

  // List of edges
  get Edges(): d2Edge[] {
    return this.edges;
  }

  // Node has a key
  get hasKey(): boolean {
    return Boolean(this.key);
  }

  // The nodes key
  get Key(): d2Key | undefined {
    return this.key;
  }

  // Node has a primary
  get hasPrimary(): boolean {
    return Boolean(this.primary?.hasValue);
  }

  // Node has a value
  get hasValue(): boolean {
    if (!this.value) {
      return false;
    }

    if ("path" in this.value) {
      return Boolean(this.value.hasPathValue);
    }

    if ("nodes" in this.value) {
      return Boolean(this.value.nodes);
    }

    if ("value" in this.value) {
      return Boolean(this.value.value);
    }

    return false;
  }

  // NodeValue means 'x:{...}'
  // where key is 'x' and node value is '...'
  get hasNodeValues(): boolean {
    return this.value instanceof d2NodeValue;
  }

  get nodeValueNodes(): d2Node[] {
    return (this.value as d2NodeValue).nodes;
  }

  // Is the node an Import
  get isImport(): boolean {
    return this.value instanceof d2Import;
  }

  // Is the node a Link
  get isLink(): boolean {
    return Boolean(this.key?.isLink);
  }

  public toString(): string {
    let strRet = `\nNODE: ${super.toString()}----\n`;

    if (this.hasKey) {
      strRet += `${this.key?.toString()}`;
    } else if (this.hasEdges) {
      let s = `\nEdges\n-----\n`;
      for (const edge of this.edges) {
        s += `${edge.toString()}`;
      }
      strRet += s + "\n";
    }

    strRet += this.hasPrimary ? `${this.primary?.toString()}` : "";
    strRet += this.hasValue ? `${this.value?.toString()}` : "";
    strRet += "\n";
    return strRet;
  }
}

/**
 ***********************
 * END OF FILE
 ***********************
 */
