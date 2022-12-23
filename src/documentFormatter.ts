import { ExecException, spawnSync } from 'child_process';
import { readFileSync, unlink, writeFileSync } from 'fs';
import { Range, TextDocument, TextEdit, TextEditor, window } from 'vscode';

import temp = require('temp');

export class DocumentFormatter {

    inFile: string = temp.path({ suffix: 'in.d2.temp' });
  
    constructor() { 

    }

    format (textEditor: TextEditor): void {

        const fileText = textEditor.document.getText();
        if (typeof fileText === 'string') {

            writeFileSync(this.inFile, fileText);

            try {
                const proc = spawnSync('d2', ['fmt', this.inFile]);
                
                let errorString = '';
                if (proc.status !== 0) {
                    errorString = proc.stderr.toString();
                    window.showErrorMessage(errorString);
                    return;
                }

                let data: Buffer = Buffer.alloc(1);
                data = readFileSync(this.inFile);
                
                textEditor.edit((builder) => {
                    const doc = textEditor.document;
                    builder.replace(new Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end), data.toString());
                });

            } catch (error) {
                const ex: ExecException = error as ExecException;

                window.showErrorMessage(ex.message);
            }

            // No longer need our temp files, get rid of them.
            // The existence of these files should not escape this function.
            unlink(this.inFile, (err) => {
                if (err) {
                    window.showInformationMessage(`Temp File Error: ${err?.message}`);
                }
            });
        }
    }
}

