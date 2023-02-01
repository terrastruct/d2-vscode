import * as path from "path";
import { spawnSync } from "child_process";
import { outputChannel, ws } from "./extension";
import { TaskOutput } from "./taskRunner";
import { NameToThemeNumber } from "./themePicker";
import { util } from "./utility";

const emptyFunc = (e: string) => {
    // no empty func and use e
    e.at(0);
}

/**
 * D2Tasks - static functions to be used in tasks.  Functions need
 * to be synchronous, and return their results in a callback.
 */
class D2Tasks {

    public convertText(filename: string, text: string, taskOutput: TaskOutput = emptyFunc): string {

        const layout: string = ws.get("previewLayout", "dagre");
        const theme: string = ws.get("previewTheme", "default");
        const sketch: boolean = ws.get("previewSketch", false);
        const themeNumber: number = NameToThemeNumber(theme);
        const d2Path: string = ws.get("execPath", "d2");

        taskOutput('Starting Compile...');
        taskOutput(`Layout: ${layout}  Theme: ${theme}  Sketch: ${sketch}\r\n`);

        const args: string[] = [`--layout=${layout}`, `--theme=${themeNumber}`, `--sketch=${sketch}`, '-'];
        const proc = spawnSync(d2Path, args, { input: text, encoding: 'utf-8', });

        /** proc.status: 0 - success
         *  proc.status: 1 - errors
         *  proc.pid: 0 - EXE Not Found
         */
        if (proc.pid === 0) {
            util.showErrorToolsNotFound(proc.error?.message ?? '');

        } else {
            const fn = path.parse(filename).base;
            const error: string = proc.stderr?.toString() ?? '';

            for (const msg of error.split('\n')) {
                if (msg.length === 0) {
                    // Sometimes there is a blank line that we
                    // don't have to worry about
                    continue;
                }

                const errMsg = `[${fn}] ` + msg;

                outputChannel.appendError(errMsg);
                taskOutput(errMsg);
            }
        }

        taskOutput('');

        let data = '';

        // Success! Read the output
        if (proc.status === 0) {
            data = proc.stdout.toString();
        }

        return data;
    }
}

export const d2Tasks: D2Tasks = new D2Tasks();

