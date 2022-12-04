import { readFileSync } from 'fs';
import * as path from 'path';
import {
    Uri,
    ViewColumn,
    WebviewPanel,
    window} from 'vscode';

import { D2P } from './docToPreviewGenerator';

const postText = String.raw`<body><html>`;
/**
 * BrowserWindow - Wraps the browser window and
 *  adds functionality to update the HTML/SVG
 **/
export class BrowserWindow {

    webViewPanel: WebviewPanel;
    trackerObject?: D2P;

    constructor(trkObj: D2P) {

        this.trackerObject = trkObj;

        this.webViewPanel = window.createWebviewPanel('d2Preview', 'D2 Preview', 
            ViewColumn.Beside, {
            enableFindWidget: true,
            enableScripts: true,
            localResourceRoots: [Uri.file(path.join(extContext.extensionPath, 'pages'))]
            });

        const onDiskPath = path.join(extContext.extensionPath, 'pages/previewPage.html');
        let data: Buffer = Buffer.alloc(1);
        data = readFileSync(onDiskPath);

        this.webViewPanel.webview.html = data.toString();

        this.webViewPanel.onDidDispose(() => {
            if (this.trackerObject) {
                this.trackerObject.outputDoc = undefined;
            }
        });

    }

    setSvg(svg: string): void {

        this.webViewPanel.webview.postMessage({command: 'render', data: svg});
    }

    dispose(): void {
        this.webViewPanel.dispose();
    }
}
    dispose(): void {
        this.webViewPanel.dispose();
    }
}