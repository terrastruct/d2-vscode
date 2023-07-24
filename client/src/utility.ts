import * as path from "path";
import * as os from "os";
import { existsSync } from "fs";
import { outputChannel, ws } from "./extension";
import { window } from "vscode";
import { spawnSync } from "child_process";

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
   * Checks to see if 'xdg-open' is on the path
   */
  isXdgOpenAvailable(): boolean {
    if (this.isFileOnPath("xdg-open")) {
      return true;
    }
    return false;
  }

  /**
   * For each platform, create a way to open a file with the filetypes
   * default application.
   *
   */
  openWithDefaultApp(file: string) {
    switch (os.platform()) {
      case "win32": {
        spawnSync("start", [file]);
        break;
      }
      case "darwin": {
        spawnSync("open", [file]);
        break;
      }
      case "linux": {
        if (this.isXdgOpenAvailable()) {
          spawnSync("xdg-open", [file]);
        } else {
          const errorMsg = "XDG-OPEN needs to be installed to launch embedded links.";

          outputChannel.appendError(Utility.strBreak);

          outputChannel.appendError(errorMsg);

          outputChannel.appendError(Utility.strBreak);

          // Popup some toast to alert to the error
          window.showErrorMessage(errorMsg);

          outputChannel.outputChannel.show();
        }
        break;
      }
    }
  }

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

export class VT {
  public static Yellow = "\x1B[1;33m";
  public static Green = "\x1B[1;32m";
  public static Reset = "\x1B[0m";
}

export const util: Utility = new Utility();
