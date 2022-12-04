import { workspace } from "vscode";

/**
 * RefreshTimer - Allow for auto updates when the
 *  document changes.
 * 
 *  Basic Usange:
 *      Create Timer
 *      Start Timer
 *      Reset on each key stroke
 *      If timeout occurs, callback is called
 **/
export class RefreshTimer {

    timerId: any;
    callback: any;
    interval: any;
    ws = workspace.getConfiguration('d2-viewer');

    constructor(callback: any) {
        this.callback = callback;
    }

    start(start: boolean) {
        this.interval = this.ws.get('updateTimer', 1500);
        this.timerId = setInterval(() => {
            this.stop();
            this.callback();
        }, this.interval);

        if (!start) {
            this.stop();
        }
    }

    stop() {
        clearInterval(this.timerId);
    }

    reset() {
        this.stop();
        this.start(true);
    }
}

