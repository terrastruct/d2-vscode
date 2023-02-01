import * as path from "path";
import { spawnSync } from "child_process";
import { Range, TextEditor } from "vscode";
import { outputChannel, ws } from "./extension";

/**
 * DocumentFormatter - Takes the current TextEditor, runs the
 *  text through the formatter "d2 fmt <file>" and then puts
 *  the resultant text back in the TextEditor.
 *
 * This function needs to stay synchronous since it's in the
 * document format pipeline.
 **/
export class DocumentFormatter {

  format(textEditor: TextEditor): void {
    const fileText = textEditor.document.getText();

    const d2Path: string = ws.get("execPath", "d2");
    const proc = spawnSync(d2Path, [
      "fmt",
      "-"
    ], { input: fileText });

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
          textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end
        ),
        data
      );
    });

    outputChannel.appendInfo(`Document ${p.base} formatted.`);
  }
}
