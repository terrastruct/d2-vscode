import { readFileSync } from "fs";
import * as path from "path";
import { Uri, ViewColumn, WebviewPanel, window, workspace } from "vscode";
import { D2P } from "./docToPreviewGenerator";
import { extContext } from "./extension";

/**
 * BrowserWindow - Wraps the browser window and
 *  adds functionality to update the HTML/SVG
 **/
export class BrowserWindow {
  webViewPanel: WebviewPanel;
  trackerObject?: D2P;

  constructor(trkObj: D2P) {
    this.trackerObject = trkObj;

    let fileName = "";
    let filePath = "";
    if (trkObj.inputDoc?.fileName) {
      const p = path.parse(trkObj.inputDoc.fileName);

      fileName = p.base;
      filePath = p.dir;
    }

    this.webViewPanel = window.createWebviewPanel(
      "d2Preview",
      `${fileName} - Preview`,
      ViewColumn.Beside,
      {
        enableFindWidget: true,
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.file(path.join(extContext.extensionPath, "pages"))],
      }
    );

    const onDiskPath = path.join(extContext.extensionPath, "pages/previewPage.html");
    const data: string = readFileSync(onDiskPath, "utf-8");

    this.webViewPanel.webview.html = data.toString();

    this.webViewPanel.onDidDispose(() => {
      if (this.trackerObject) {
        this.trackerObject.outputDoc = undefined;
      }
    });

    this.webViewPanel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "clickOnTag_A": {
            const uri = Uri.parse(message.link);
            switch (uri.scheme) {
              case "file":
                {
                  const filepath = path.join(filePath, message.link);
                  workspace.openTextDocument(filepath).then(
                    (document) => {
                      window.showTextDocument(document);
                    },
                    () => {
                      window.showErrorMessage(`Could not open: ${filepath}`);
                    }
                  );
                }
                break;
              // Do nothing, vscode opens hyperlink on it's own
              case "html":
                break;
              default: {
                window.showErrorMessage(`Unrecognized file type: ${uri.fsPath}`);
              }
            }
          }
        }
      },
      this,
      extContext.subscriptions
    );
  }

  show() {
    this.webViewPanel.reveal();
  }

  setSvg(svg: string): void {
    this.webViewPanel.webview.postMessage({ command: "render", data: svg });
  }

  resetZoom(): void {
    this.webViewPanel.webview.postMessage({ command: "resetZoom" });
  }

  dispose(): void {
    this.webViewPanel.dispose();
  }
}
