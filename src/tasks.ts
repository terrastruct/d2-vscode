import { spawnSync } from "child_process";
import * as path from "path";
import { Range, TextEditor } from "vscode";
import { outputChannel, ws } from "./extension";
import { TaskOutput } from "./taskRunner";
import { NameToThemeNumber } from "./themePicker";
import { util } from "./utility";

/**
 * D2Tasks - static functions to be used in tasks.  Functions need
 * to be synchronous, and return their results in a callback.
 */
class D2Tasks {
  public compile(
    text: string,
    filePath?: string,
    log?: TaskOutput,
    terminal?: TaskOutput
  ): string {
    const layout: string = ws.get("previewLayout", "dagre");
    const theme: string = ws.get("previewTheme", "default");
    const sketch: boolean = ws.get("previewSketch", false);
    const themeNumber: number = NameToThemeNumber(theme);
    const d2Path: string = ws.get("execPath", "d2");

    terminal?.("Starting Compile...");
    terminal?.(`Layout: ${layout}  Theme: ${theme}  Sketch: ${sketch}`);
    terminal?.(`Current Working Directory: ${filePath}`);
    terminal?.("");

    const args: string[] = [
      `--layout=${layout}`,
      `--theme=${themeNumber}`,
      `--sketch=${sketch}`,
      "-",
    ];

    // spawnSync doesn't like blank working directories
    if (filePath === ''){
      filePath = undefined;
    }

    const proc = spawnSync(d2Path, args, {
      cwd: filePath,
      input: text,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 24
    });

    /** proc.status: 0 - success
     *  proc.status: 1 - errors
     *  proc.pid: 0 - EXE Not Found
     */
    if (proc.pid === 0) {
      util.showErrorToolsNotFound(proc.error?.message ?? "");
    } else {
      const error: string = proc.stderr?.toString() ?? "";

      for (const msg of error.split("\n")) {
        if (msg.length === 0) {
          // Sometimes there is a blank line that we
          // don't have to worry about
          continue;
        }

        terminal?.(msg, true);
      }

      const spawnErr = proc.error?.message;
      if (spawnErr) {
        terminal?.(spawnErr, true);
      }
    }

    terminal?.("");

    let data = "";
    // Success! Read the output
    if (proc.status === 0) {
      data = proc.stdout.toString();
    }

    return data;
  }

  format(textEditor: TextEditor): void {
    const fileText = textEditor.document.getText();

    const d2Path: string = ws.get("execPath", "d2");
    const proc = spawnSync(d2Path, ["fmt", "-"], { input: fileText });

    let errorString = "";
    if (proc.status !== 0) {
      errorString = proc.stderr.toString();
      outputChannel.appendError(errorString);
      return;
    }

    const data: string = proc.stdout.toString();

    const p = path.parse(textEditor.document.fileName);

    if (!data) {
      outputChannel.appendError(`Document ${p.base} could not be read.`);
      return;
    }

    // This will replace the entire document with the newly formatted document
    textEditor.edit((builder) => {
      builder.replace(
        new Range(
          textEditor.document.lineAt(0).range.start,
          textEditor.document.lineAt(
            textEditor.document.lineCount - 1
          ).range.end
        ),
        data
      );
    });

    outputChannel.appendInfo(`Document ${p.base} formatted.`);
  }
}

export const d2Tasks: D2Tasks = new D2Tasks();
