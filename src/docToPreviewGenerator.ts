import * as path from "path";
import { TextDocument } from "vscode";
import { BrowserWindow } from "./browserWindow";
import { outputChannel, taskRunner } from "./extension";
import { RefreshTimer } from "./refreshTimer";

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

    taskRunner.genTask(trkObj.inputDoc?.fileName, fileText, (data, error) => {
      let errorMsg = '';

      // If we don't have a preview window already, create one
      if (!trkObj.outputDoc) {
        trkObj.outputDoc = new BrowserWindow(trkObj);
        errorMsg = error;
      }

      if (data.length > 0) {
        trkObj.outputDoc.setSvg(data);

        const p = path.parse(trkObj.inputDoc?.fileName || "");
        outputChannel.appendInfo(`Preview for ${p.base} updated.`);
      } else if (errorMsg.length > 0) {
        trkObj.outputDoc.setSvg(`<svg><text font-size="x-large" x="20" y="50">${errorMsg}</text></svg>`);
      }
    });
  }
}
