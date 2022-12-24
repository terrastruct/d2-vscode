import { OutputChannel, window } from "vscode";

/**
 * D2OutputChannel - Class wraps the VSCode outputChannel api
 * 
 *   
 **/
export class D2OutputChannel {
    outputChannel: OutputChannel = window.createOutputChannel('D2-Output');

    constructor() { }

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
        const time: Array<string> = [String(now.getHours()), String(now.getMinutes()), String(now.getSeconds())];

        this.outputChannel.appendLine(`[${time.join(":")}] - ${msg}`);
    }
}