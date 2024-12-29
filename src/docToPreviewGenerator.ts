import * as path from "path";
import { TaskEndEvent, tasks, TextDocument } from "vscode";
import { BrowserWindow } from "./browserWindow";
import { d2TaskName, outputChannel, taskRunner } from "./extension";
import { RefreshTimer } from "./refreshTimer";
import { statSync } from "fs";
import { Mutex } from "async-mutex";

/**
 *  D2P - Document to Preview.  This tracks the connection
 *  between the D2 document and to the preview window.
 *
 **/
export class D2P {
  inputDoc?: TextDocument;
  outputDoc?: BrowserWindow;
  timer?: RefreshTimer;
  fileDateTime: number = 0;
}

/**
 * DocToPreviewGenerator - Keeper of the map of D2P objects
 *  that allow for associating a document to it's preview
 *  information.
 *
 * This object is/must be a Singleton.
 **/
export class DocToPreviewGenerator {
  mutex: Mutex = new Mutex();
  mapOfConnection: Map<TextDocument, D2P> = new Map<TextDocument, D2P>();

  constructor() {
    // Since this object is a singleton, we don't need to dispose
    // this event each time the object is disposed.
    tasks.onDidEndTask((e: TaskEndEvent) => {
      if (e.execution.task.name === d2TaskName) {
        this.mutex.release();
      }
    });
  }

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

  /**
   * Get the last modified time of each document we are
   * tracking.
   **/
  private getFileTimes(): void {
    this.mapOfConnection.forEach((trk: D2P, td: TextDocument) => {
      trk.fileDateTime = statSync(td.uri.fsPath).mtimeMs;
    });
  }

  generateAll(): void {
    this.getFileTimes();

    // Sort the files oldest to newest.  This should catch most
    // order of dependency problems witout resorting to dependency
    // analysis.
    const fileMap = new Map(
      [...this.mapOfConnection.entries()].sort(
        (a: [TextDocument, D2P], b: [TextDocument, D2P]): number => {
          return b[1].fileDateTime - a[1].fileDateTime;
        }
      )
    );

    // Regenerate the browser view for all open d2 documents, since
    // there are dependencies among all the documents, we have to
    // regenerate them one at a time.
    fileMap.forEach((_: D2P, td: TextDocument) => {
      this.mutex.acquire().then(() => {
        this.generate(td, false);
      });
    });
  }

  generate(inDoc: TextDocument, openPreview: boolean = true): void {
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
    // If we don't have a preview window already, create one
    if (!trkObj.outputDoc && openPreview) {
      trkObj.outputDoc = new BrowserWindow(trkObj);
      trkObj.outputDoc.show();
      trkObj.outputDoc.showToast();
      trkObj.outputDoc.setToastMsg("Loading...");
    }

    trkObj.outputDoc?.showBusy();

    taskRunner.genTask(trkObj.inputDoc?.fileName, fileText, (data, error) => {
      const p = path.parse(trkObj.inputDoc?.fileName || "");

      if (data.length > 0) {
        trkObj.outputDoc?.setSvg(data);
        outputChannel.appendInfo(`Preview for ${p.base} updated.`);
        trkObj.outputDoc?.hideToast();
      } else if (error.length > 0) {
        outputChannel.appendInfo(`Preview for ${p.base} has errors.`);
        const arr: string[] = error.split("\n");

        let list = "";
        arr.forEach((s) => {
          list += `<li>${s}</li>`;
        });

        trkObj.outputDoc?.setToastMsg("Errors");
        trkObj.outputDoc?.setToastList(list);
        trkObj.outputDoc?.showToast();
      }

      trkObj.outputDoc?.hideBusy();
    });
  }
}
