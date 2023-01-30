import { spawnSync } from "child_process";
import { readFileSync, unlink, writeFileSync } from "fs";
import path = require("path");
import temp = require("temp");
import { DocToPreviewGenerator } from "./docToPreviewGenerator";
import { outputChannel, ws } from "./extension";
import { TaskOutput } from "./taskRunner";
import { NameToThemeNumber } from "./themePicker";

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

        const inFile = temp.path({ suffix: "in.d2.temp" });
        const outFile = temp.path({ suffix: "out.d2.temp" });

        // Write out our document so the D2 executable can read it.
        writeFileSync(inFile, text);

        const layout: string = ws.get("previewLayout", "dagre");
        const theme: string = ws.get("previewTheme", "default");
        const sketch: boolean = ws.get("previewSketch", false);
        const themeNumber: number = NameToThemeNumber(theme);
        const d2Path: string = ws.get("execPath", "d2");

        const proc = spawnSync(d2Path, [
            `--layout=${layout}`,
            `--theme=${themeNumber}`,
            `--sketch=${sketch}`,
            inFile,
            outFile,
        ]);

        /** status: 0 - success
         *  status: 1 - errors
         *  pid: 0 - EXE Not Found
         */
        if (proc.pid === 0) {
            DocToPreviewGenerator.showErrorToolsNotFound(proc.error?.message ?? '');

        } else {
            const fn = path.parse(filename).base;
            const error: string = proc.stderr?.toString() ?? '';
            const output: string = proc.stdout?.toString() ?? '';

            for (const msg of output.split('\n')) {
                if (msg.length === 0) {
                    // Sometimes there is a blank line that we
                    // don't have to worry about
                    continue;
                }

                const outMsg = `[${fn}] ` + msg;

                outputChannel.appendInfo(outMsg);
                taskOutput(outMsg);
            }

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
            // Get the the contents of the output file
            data = readFileSync(outFile, 'utf-8');

            unlink(outFile, (err) => {
                if (err) {
                    outputChannel.appendWarning(
                        `Temp File ${err?.message} could not be deleted.`
                    );
                }
            });
        }

        // No longer need our temp files, get rid of them.
        // The existence of these files should not escape this function.
        unlink(inFile, (err) => {
            if (err) {
                outputChannel.appendWarning(
                    `Temp File ${err?.message} could not be deleted.`
                );
            }
        });

        return data;
    }
}

export const d2Tasks: D2Tasks = new D2Tasks();

