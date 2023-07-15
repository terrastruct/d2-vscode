/**
 * Various data holder classes, conversions and coercion
 */

import { DiagnosticSeverity, LSPAny, Position, Range } from "vscode-languageserver/node";

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

    this.fileName = rg[1] || "";

    this.startLine = parseInt(rg[2], 10);
    this.startColumn = parseInt(rg[3], 10);
    this.startByte = parseInt(rg[4], 10);

    this.endLine = parseInt(rg[5], 10);
    this.endColumn = parseInt(rg[6], 10);
    this.endByte = parseInt(rg[7], 10);
  }

  fileName = "";

  startLine = 0;
  startColumn = 0;
  startByte = 0;

  endLine = 0;
  endColumn = 0;
  endByte = 0;

  public isRangeEqual(r: d2Range): boolean {
    if (r.startLine === this.startLine &&
        r.endLine === this.endLine &&
        r.startColumn === this.startColumn &&
        r.endColumn === this.endColumn) {
      return true;
    }
    return false;
  }

  public toString(): string {
    return `${this.fileName} -> (${this.startLine},${this.startColumn},${this.startByte}):(${this.endLine},${this.endColumn},${this.endByte})`;
  }

  get FileName(): string {
    return this.fileName;
  }

  set FileName(s: string) {
    this.fileName = s;
  }

  get StartPosition(): Position {
    return Position.create(this.startLine, this.startColumn);
  }

  set StartPosition(p: Position) {
    this.startLine = p.line;
    this.startColumn = p.character;
  }

  get EndPosition(): Position {
    return Position.create(this.endLine, this.endColumn);
  }

  set EndPosition(p: Position) {
    this.endLine = p.line;
    this.endColumn = p.character;
  }

  get Range(): Range {
    return Range.create(this.StartPosition, this.EndPosition);
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

    this.severity = DiagnosticSeverity.Error;
  }

  msg: string;
  severity: DiagnosticSeverity;

  public toString(): string {
    return `Err: ${this.msg} - ${super.toString()}`;
  }
}

/**
 * Represents text, with the range that points to it
 */
export class d2StringAndRange extends d2Range {
  constructor(r: string | null, s: string) {
    super(r);
    this.str = s;
  }

  str: string;

  public toString(): string {
    return `${this.str} -> ${super.toString()}`;
  }
}
