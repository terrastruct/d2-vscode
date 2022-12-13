import { OutputChannel, TextDocument } from 'vscode';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { BrowserWindow } from './browserWindow';
import path = require('node:path');

/**
 * D2P - Document to Preview.  This tracks the connection
 *  between the D2 document and to the preview window.
 * 
 * Stores the temp file string.
 **/
export class D2P {
    inputDoc?: TextDocument;
    outputDoc?: BrowserWindow;
    host: string = '';
    port: string = '';
    childProc?: ChildProcessWithoutNullStreams;

    endProc(): void {
        this.childProc?.kill();
        this.childProc = undefined;
    }
}

/**
 * DocToPreviewGenerator - Keeper of the map of D2P objects
 *  that allow for associating a document to it's preview
 *  information.
 **/
export class DocToPreviewGenerator {

    mapOfConnection: Map<TextDocument, D2P> = new Map<TextDocument, D2P>();
    outputChannel: OutputChannel;

    constructor(oc: OutputChannel) {
        this.outputChannel = oc;
    }

    createObjectToTrack(inDoc: TextDocument): D2P {
        let trk = new D2P();

        trk.inputDoc = inDoc;

        this.mapOfConnection.set(inDoc, trk);

        return trk;
    }

    deleteObjectToTrack(inDoc: TextDocument): void {
        let trkObj = this.getTrackObject(inDoc);

        if (trkObj) {
            trkObj.childProc?.kill();
        }

        this.mapOfConnection.delete(inDoc);
    }

    getTrackObject(inDoc: TextDocument): D2P | undefined {
        return this.mapOfConnection.get(inDoc);
    }


    generateWatch(inDoc: TextDocument) {
        let trkObj = this.getTrackObject(inDoc);

        if (!trkObj || trkObj.childProc) return;

        trkObj.host = 'localhost';
        trkObj.port = this.getRandomIntInclusive(4000, 60000).toString();

        process.env.BROWSER = '0';

        var inFile = trkObj.inputDoc?.fileName ?? '';
        var fName = path.basename(inFile);

        trkObj.childProc = spawn('D2', ['--host', trkObj.host, '--port', trkObj.port, '--watch', inFile ?? '']);

        trkObj.childProc.stdout.on('data', (s) => {
            this.outputChannel.append(fName + ': ' + s.toString());
        });

        trkObj.childProc.stderr.on('data', (s) => {
            this.outputChannel.append(fName + ': ' + s.toString());
        });

        if (!trkObj.outputDoc) {
            trkObj.outputDoc = new BrowserWindow(trkObj);
            trkObj.outputDoc.setWs(`ws:${trkObj.host}:${trkObj.port}/watch`);
        }

    }

    private getRandomIntInclusive(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

