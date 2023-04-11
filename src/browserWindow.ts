import { existsSync, readFileSync } from "fs";
import * as os from "os";
import * as path from "path";
import { Uri, ViewColumn, Webview, WebviewPanel, window, workspace } from "vscode";
import { D2P } from "./docToPreviewGenerator";
import { extContext } from "./extension";
import { util } from "./utility";

/**
 * BrowserWindow - Wraps the browser window and
 *  adds functionality to update the HTML/SVG
 **/
export class BrowserWindow {
  webViewPanel: WebviewPanel;
  webView: Webview;
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
    this.webView = this.webViewPanel.webview;

    const onDiskPath = path.join(extContext.extensionPath, "pages/previewPage.html");
    const data: string = readFileSync(onDiskPath, "utf-8");

    this.webViewPanel.webview.html = data.toString();

    this.webViewPanel.onDidDispose(() => {
      if (this.trackerObject) {
        this.trackerObject.outputDoc = undefined;
      }
    });

    const isRelative = (p: string) => !/^([a-z]+:)?[\\/]/i.test(p);

    this.webViewPanel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "clickOnTag_A": {
            const f = message.link.trim().toLowerCase();
            const isWeb: boolean = f.startsWith("http://") || f.startsWith("https://");
            const ir = isRelative(f);

            // if it's a website, we can let the default handler deal with it
            // by falling out of this function.
            if (isWeb) {
              return;
            }

            // We have a file, or something that looks like a file, try to open it,
            // let vscode decide if it's possible.
            const filepath = ir ? path.join(filePath, f) : f;

            workspace.openTextDocument(filepath).then(
              (document) => {
                // we opened the document, now show it.
                window.showTextDocument(document);
              },
              () => {
                if (!existsSync(filepath)) {
                  window.showErrorMessage(`File does not exist: ${filepath}`);
                } else {
                  util.openWithDefaultApp(filepath);
                }
              }
            );
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
    this.webView.postMessage({ command: "render", data: svg });
  }

  resetZoom(): void {
    this.webView.postMessage({ command: "resetZoom" });
  }

  showBusy(): void {
    this.webView.postMessage({ command: "showBusy" });
  }

  hideBusy(): void {
    this.webView.postMessage({ command: "hideBusy" });
  }

  showToast(): void {
    this.webView.postMessage({ command: "showToast" });
  }

  hideToast(): void {
    this.webView.postMessage({ command: "hideToast" });
  }

  setToastMsg(msg: string): void {
    this.webView.postMessage({ command: "setToastMsg", data: msg });
  }

  setToastList(list: string): void {
    this.webView.postMessage({ command: "setToastList", data: list });
  }

  dispose(): void {
    this.webViewPanel.dispose();
  }
}
