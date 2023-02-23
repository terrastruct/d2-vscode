import * as path from "path";
import * as os from "os";
import { existsSync } from "fs";
import { outputChannel, ws } from "./extension";
import { window } from "vscode";

/**
 * Utility - Set of common utility functions
 */
class Utility {
  /**
   * isFileOnPath - returns true if given file is found
   *   on the system path, false if not.
   */
  isFileOnPath(file: string): boolean {
    const sysPath: string = process.env.PATH ?? "";
    for (const p of sysPath.split(path.delimiter)) {
      const filePath = path.join(p, file);
      if (existsSync(filePath)) {
        return true;
      }
    }

    return false;
  }

  private static strBreak =
    "************************************************************";

  /**
   * showErrorToolsNotFound - sends information if d2 isn't found
   *   and on how to install d2 to fix the problem.
   *
   */
  showErrorToolsNotFound(msg: string): void {
    const errorMsgs: string[] = [
      "D2 executable not found.",
      "Make sure the D2 executable is installed and on your system PATH.",
      "https://d2lang.com/tour/install",
      `${msg}`,
    ];

    outputChannel.appendError(Utility.strBreak);

    for (const m of errorMsgs) {
      outputChannel.appendError(m);
    }
    outputChannel.appendError(Utility.strBreak);

    // Popup some toast to alert to the error
    window.showErrorMessage(errorMsgs.join("\n"));

    outputChannel.outputChannel.show();
  }

  /**
   * checkForD2Install - looks for the d2 binary on the execPath
   *   path from settings, and if not found there, the path is
   *   searched.  If it isn't found anywhere, then an error message
   *   is sent to the output and toast is put up in the UI
   *
   */
  checkForD2Install(): void {
    // If we have a path set, and the file exists, no need to
    // search the path
    const d2Path: string = ws.get("execPath", "d2");
    if (existsSync(d2Path)) {
      return;
    }

    const d2FileName = os.platform() === "win32" ? "d2.exe" : "d2";

    if (!util.isFileOnPath(d2FileName)) {
      util.showErrorToolsNotFound("");
    }
  }
}

export const util: Utility = new Utility();
