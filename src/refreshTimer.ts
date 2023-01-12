import { workspace } from "vscode";

/**
 * RefreshTimer - Allow for auto updates when the
 *  document changes.
 * 
 *  Basic Usage:
 *      Create Timer
 *      Start Timer
 *      Reset on each key stroke
 *      If timeout occurs, callback is called
 **/
type TimerCallback = () => void;

type TimerCallback = () => void;

export class RefreshTimer {

    timerId?: NodeJS.Timer ;
    callback: TimerCallback;
    interval = 0;
    ws = workspace.getConfiguration('D2');

    constructor(callback: TimerCallback) {
    constructor(callback: TimerCallback) {
        this.callback = callback;
    }

    start(start: boolean) {
        this.interval = this.ws.get('updateTimer', 1500);
        this.timerId = setTimeout(() => {
        this.timerId = setTimeout(() => {
            this.stop();
            this.callback();
        }, this.interval);

        if (!start) {
            this.stop();
        }
    }

    stop() {
        clearTimeout(this.timerId);
        clearTimeout(this.timerId);
    }

    reset() {
        this.stop();
        this.start(true);
    }
}

