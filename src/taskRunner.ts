import * as path from "path";

import {
  CustomExecution,
  Event,
  EventEmitter,
  Pseudoterminal,
  Task,
  TaskPanelKind,
  TaskRevealKind,
  tasks,
  TaskScope,
} from "vscode";
import { d2TaskName, outputChannel } from "./extension";
import { d2Tasks } from "./tasks";

// eslint-disable-next-line no-unused-vars
export type TaskRunnerCallback = (data: string, error: string) => void;
// eslint-disable-next-line no-unused-vars
export type TaskOutput = (text: string, flag?: boolean) => void;

/**
 * TaskRunner - This creates CustomTask and Pseudotermial to run it in.
 * This will return immediately, the tasks callback should be called
 * when the task is finished.
 */
export class TaskRunner {
  public genTask(filename: string, text: string, callback: TaskRunnerCallback): void {
    const pty = new CustomTaskTerminal(filename, text, callback);
    const ce = new CustomExecution(
      (): Promise<CustomTaskTerminal> =>
        new Promise((resolve) => {
          resolve(pty);
        })
    );

    const task = new Task(
      { type: "D2" },
      TaskScope.Workspace,
      d2TaskName,
      "D2 Extension",
      ce,
      ["$D2Matcher"]
    );

    task.presentationOptions = {
      echo: true,
      reveal: TaskRevealKind.Silent,
      focus: false,
      clear: false,
      panel: TaskPanelKind.Dedicated,
      showReuseMessage: false,
    };
    tasks.executeTask(task);
  }
}

/**
 * CustomTaskTerminal - Implimentation of a Pseudoterminal that
 * allows for output to the Pseudoterminal that can be scraped
 * with a problemMatcher to put links to jump to the errors in
 * the document.
 */
class CustomTaskTerminal implements Pseudoterminal {
  private writeEmitter = new EventEmitter<string>();
  private closeEmitter = new EventEmitter<number>();

  onDidWrite: Event<string> = this.writeEmitter.event;
  onDidClose?: Event<number> = this.closeEmitter.event;

  private fileName: string;
  private fileDirectory: string;
  private docText: string;
  private callback: TaskRunnerCallback;
  private compileErrors = "";

  constructor(filename: string, text: string, callback: TaskRunnerCallback) {
    this.fileName = path.parse(filename).base;
    this.fileDirectory = path.parse(filename).dir;
    this.docText = text;
    this.callback = callback;
  }

  open(): void {
    const data: string = d2Tasks.compile(
      this.docText,
      this.fileDirectory,
      (msg) => {
        outputChannel.appendInfo(msg);
      },
      (err, flag) => {
        if (flag === true) {
          this.compileErrors += err + "\n";
          this.writeLine(`[${path.join(this.fileDirectory, this.fileName)}] ${err}`);
        } else {
          this.writeLine(err);
        }
      }
    );

    this.callback(data, this.compileErrors);

    // This is the magic bullet to complete the task.
    this.closeEmitter.fire(0);
  }

  close(): void {
    this.closeEmitter.fire(0);
  }

  private write(msg: string): void {
    this.writeEmitter.fire(msg);
  }

  private writeLine(msg: string): void {
    this.write(msg + "\r\n");
  }
}
