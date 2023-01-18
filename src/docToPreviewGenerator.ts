import { ExecException, spawnSync } from "child_process";
import { readFileSync, unlink, writeFileSync } from "fs";
import * as path from "path";
import * as temp from "temp";
import { TextDocument } from "vscode";

import { BrowserWindow } from "./browserWindow";
import { outputChannel, ws } from "./extension";
import { RefreshTimer } from "./refreshTimer";
import { NameToThemeNumber } from "./themePicker";

/**
 *  D2P - Document to Preview.  This tracks the connection
 *  between the D2 document and to the preview window.
 *
 * Stores the temp file string.
 **/
export class D2P {
  inputDoc?: TextDocument;
  outputDoc?: BrowserWindow;
  timer?: RefreshTimer;
}

/**
 * DocToPreviewGenerator - Keeper of the map of D2P objects
 *  that allow for associating a document to it's preview
 *  information.
 **/
export class DocToPreviewGenerator {
  mapOfConnection: Map<TextDocument, D2P> = new Map<TextDocument, D2P>();

  createObjectToTrack(inDoc: TextDocument): D2P {
    const trk = new D2P();

    trk.inputDoc = inDoc;

    this.mapOfConnection.set(inDoc, trk);

    trk.timer = new RefreshTimer(() => {
      // If there is a document to update, update it.
      if (trk.outputDoc) {
        this.generate(inDoc);
      }
    });

    trk.timer?.start(false);

    return trk;
  }

  deleteObjectToTrack(inDoc: TextDocument): void {
    this.mapOfConnection.delete(inDoc);
  }

  getTrackObject(inDoc: TextDocument): D2P | undefined {
    return this.mapOfConnection.get(inDoc);
  }

  generate(inDoc: TextDocument): void {
    const trkObj = this.getTrackObject(inDoc);
    // if we can't find our tracking info, no sense doing anything
    if (!trkObj) {
      return;
    }
    // No input document? How did we get here?
    if (!trkObj.inputDoc) {
      return;
    }

    const fileText = trkObj.inputDoc.getText();
    if (!fileText) {
      // Empty document, do nothing
      return;
    }

    const data: string = this.generateFromText(fileText);

    // If we don't have a preview window already, create one
    if (!trkObj.outputDoc) {
      trkObj.outputDoc = new BrowserWindow(trkObj);
    }

    if (data.length > 0) {
      trkObj.outputDoc.setSvg(data);
    }

    const p = path.parse(trkObj.inputDoc.fileName);

    outputChannel.appendInfo(`Preview for ${p.base} updated.`);
  }

  /**
   * Take the d2 document text and pass it to the D2 executable
   * and then retreive the output to render in our preveiw window.
   */
  generateFromText(text: string): string {
    const inFile = temp.path({ suffix: "in.d2.temp" });
    const outFile = temp.path({ suffix: "out.d2.temp" });

    // Write out our document so the D2 executable can read it.
    writeFileSync(inFile, text);

    try {
      const layout: string = ws.get("previewLayout", "dagre");
      const theme: string = ws.get("previewTheme", "default");
      const themeNumber: number = NameToThemeNumber(theme);

      const proc = spawnSync("d2", [
        `--layout=${layout}`,
        `--theme=${themeNumber}`,
        inFile,
        outFile,
      ]);

      // TODO - Catch error when spawn can't find d2
      let errorString = "";
      if (proc.status !== 0) {
        errorString = proc.stderr.toString();
        outputChannel.appendError(errorString);
        return "";
      }
    } catch (error) {
      const ex: ExecException = error as ExecException;

      outputChannel.appendError(ex.message);
    }

    // Get the the contents of the output file
    const data: string = readFileSync(outFile, "utf-8");

    // No longer need our temp files, get rid of them.
    // The existence of these files should not escape this function.
    unlink(inFile, (err) => {
      if (err) {
        outputChannel.appendWarning(
          `Temp File ${err?.message} could not be deleted.`
        );
      }
    });
    unlink(outFile, (err) => {
      if (err) {
        outputChannel.appendWarning(
          `Temp File ${err?.message} could not be deleted.`
        );
      }
    });

    return data;
  }
}
