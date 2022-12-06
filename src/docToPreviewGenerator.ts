import { TextDocument } from 'vscode';
import { readFileSync, unlink, writeFileSync } from 'fs';
import { ExecException, spawnSync } from 'child_process';
import { BrowserWindow } from './browserWindow';
import { RefreshTimer } from './refreshTimer';
var temp = require('temp');

/**
 * D2P - Document to Preview.  This tracks the connection
 *  between the D2 document and to the preview window.
 * 
 * Stores the temp file string.
 **/
export class D2P {
    inFile: string = '';
    outFile: string = '';
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
        let trk = new D2P();

        trk.inputDoc = inDoc;

        trk.inFile = temp.path({ suffix: 'in.d2.temp' });
        trk.outFile = temp.path({ suffix: 'out.d2.temp' });

        this.mapOfConnection.set(inDoc, trk);

        trk.timer = new RefreshTimer(() => {
            this.generate(inDoc);
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
        let trkObj = this.getTrackObject(inDoc);

        if (trkObj) {

            let fileText = trkObj.inputDoc?.getText();
            if (typeof fileText === 'string') {

                writeFileSync(trkObj.inFile, fileText);

                try {
                    var proc = spawnSync('d2', [trkObj.inFile, trkObj.outFile]);
                    console.log('D2 -> ' + proc.output);
                    console.log('D2 Ret -> ' + proc.status);

                    let errorString: String = '';
                    if (proc.status !== 0) {
                        errorString = proc.stderr.toString();
                    }

                    let data: Buffer = Buffer.alloc(1);
                    if (proc.status === 0) {
                        data = readFileSync(trkObj.outFile);
                    }

                    if (!trkObj.outputDoc) {
                        trkObj.outputDoc = new BrowserWindow(trkObj);
                    }

                    trkObj.outputDoc.setSvg(errorString + data.toString());

                } catch (error) {
                    let ex: ExecException = error as ExecException;

                    console.log(ex.message);
                }

                // No longer need our temp files, get rid of them.
                // The existance of these files should not escape this function.
                unlink(trkObj.inFile, (err) => {
                    if (err) {
                        console.log(`Temp File Error: ${err?.message}`);
                    }
                });
                unlink(trkObj.outFile, (err) => {
                    if (err) {
                        console.log(`Temp File Error: ${err?.message}`);
                    }
                });
            }
        }
    }
}

