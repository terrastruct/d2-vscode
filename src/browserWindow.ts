import {
    window,
    ViewColumn,
    WebviewPanel
} from 'vscode';
import { D2P } from './docToPreviewGenerator';

/**
 * BrowswerWindow - Wraps the browser window and
 *  adds functionality to update the HTML/SVG
 **/
export class BrowserWindow {

    webViewPanel: WebviewPanel;
    trackerObject?: D2P;

    constructor(trkObj: D2P) {

        this.trackerObject = trkObj;

        this.webViewPanel = window.createWebviewPanel('d2Preview', 'D2 Preview', ViewColumn.Beside, {
            enableFindWidget: true,
            enableScripts: true
        });

        this.webViewPanel.onDidDispose(() => {
            if (this.trackerObject) {
                this.trackerObject.outputDoc = undefined;
            }
        });

    }

    setSvg(svg: string): void {
        this.webViewPanel.webview.html = svg;
    }

    dispose(): void {
        this.webViewPanel.dispose();
    }
}