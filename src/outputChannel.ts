import { OutputChannel, window } from "vscode";

/**
 * D2OutputChannel - Class wraps the VSCode outputChannel api
 *
 * outputChannel will soon support color output and this class
 * wraps the current api so both can be supported.
 **/
export class D2OutputChannel {
  outputChannel: OutputChannel = window.createOutputChannel("D2-Output");

  appendInfo(info: string): void {
    this.output(info);
  }

  appendWarning(warn: string): void {
    this.output(warn);
  }

  appendError(error: string): void {
    this.output(error);
  }

  private output(msg: string): void {
    const now: Date = new Date();
    const time: Array<string> = [
      String(this.pad(now.getHours())),
      String(this.pad(now.getMinutes())),
      String(this.pad(now.getSeconds())),
    ];

    this.outputChannel.appendLine(`[${time.join(":")}] - ${msg}`);
  }

  private pad(num: number): string {
    let s = "00" + num;
    s = s.substring(s.length - 2);

    return s;
  }
}
