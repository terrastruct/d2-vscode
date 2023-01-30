import { CustomExecution, Event, EventEmitter, Pseudoterminal, Task, tasks, TaskScope } from 'vscode';
import { d2Tasks } from './tasks';

// eslint-disable-next-line no-unused-vars
export type TaskRunnerCallback = (data: string) => void
// eslint-disable-next-line no-unused-vars
export type TaskOutput = (text: string) => void

/**
 * TaskRunner - This creates CustomTask and Pseudotermial to run it in.
 * This will return immediately, the callback should be called when the
 * task is finished.
 */
export class TaskRunner {

    public retVal = '';
    public genTask(filename: string, text: string, callback: TaskRunnerCallback): void {
        const pty = new CustomTaskTerminal(filename, text, callback);
        const ce = new CustomExecution((): Promise<CustomTaskTerminal> =>
            new Promise((resolve) => {
                resolve(pty);
            }));

        const task = new Task(
            { type: "D2 Type" },
            TaskScope.Workspace,
            'D2 Task',
            'D2 Extension',
            ce,
            ["$D2Matcher"])

        tasks.executeTask(task);
    }

}

/**
 * CustomTaskTerminal - Implimentation of a Pseudoterminal that
 * allows for output to the Pseudoterminal that can be scraped
 * with a problemMatcher to put links to jump to the errors in 
 * the document.
 */
class CustomTaskTerminal implements Pseudoterminal {
    private writeEmitter = new EventEmitter<string>();
    private closeEmitter = new EventEmitter<number>();

    onDidWrite: Event<string> = this.writeEmitter.event;
    onDidClose?: Event<number> = this.closeEmitter.event;

    private fileName: string;
    private docText: string;
    private callback: TaskRunnerCallback;

    constructor(filename: string, text: string, callback: TaskRunnerCallback) {
        this.fileName = filename;
        this.docText = text;
        this.callback = callback;
    }

    open(): void {
        this.writeLine('Staring compile...\r\n');

        const data: string = d2Tasks.convertText(this.fileName, this.docText, (msg) => {
            this.writeLine(msg);
        });

        this.callback(data);

        // This is the magic bullet to complete the task.
        this.closeEmitter.fire(0);
    }

    close(): void {
        this.closeEmitter.fire(0);
    }

    public write(msg: string): void {
        this.writeEmitter.fire(msg);
    }

    public writeLine(msg: string): void {
        this.write(msg + '\r\n');
    }
}
