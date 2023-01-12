import { ExecException, spawnSync } from 'child_process';
import { readFileSync, unlink, writeFileSync } from 'fs';
import * as path from 'path';
import * as temp from 'temp';
import { TextDocument } from 'vscode';

import { BrowserWindow } from './browserWindow';
import { outputChannel } from './extension';
import { RefreshTimer } from './refreshTimer';

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

    constructor() { }

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
        if (!trkObj) { return; }
        if (!trkObj.inputDoc) { return; }

        const fileText = trkObj.inputDoc.getText();
        if (!fileText) {
            return;
        }

        let data: string = this.generateFromText(fileText);

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

    generateFromText(text: string): string {

        let inFile = temp.path({ suffix: 'in.d2.temp' });
        let outFile = temp.path({ suffix: 'out.d2.temp' });

        writeFileSync(inFile, text);

        try {
            const proc = spawnSync('d2', ['--theme', '103', inFile, outFile]);

            let errorString = '';
            if (proc.status !== 0) {
                errorString = proc.stderr.toString();
                outputChannel.appendError(errorString);
                return '';
            }
        } catch (error) {
            const ex: ExecException = error as ExecException;

            outputChannel.appendError(ex.message);
        }
        let data: string = readFileSync(outFile, 'utf-8');

        // No longer need our temp files, get rid of them.
        // The existence of these files should not escape this function.
        unlink(inFile, (err) => {
            if (err) {
                outputChannel.appendWarning(`Temp File ${err?.message} could not be deleted.`);
            }
        });
        unlink(outFile, (err) => {
            if (err) {
                outputChannel.appendWarning(`Temp File ${err?.message} could not be deleted.`);
            }
        });

        return data;
    }
}

