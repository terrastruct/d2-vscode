import { ws } from "./extension";

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

export class RefreshTimer {
  timerId?: NodeJS.Timeout;
  callback: TimerCallback;
  interval = 0;

  constructor(callback: TimerCallback) {
    this.callback = callback;
  }

  start(start: boolean) {
    this.interval = ws.get("updateTimer", 1500);
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
  }

  reset() {
    this.stop();
    this.start(true);
  }
}
