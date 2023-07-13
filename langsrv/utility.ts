import { readdirSync, statSync } from "fs";
import path = require("path");

export function getD2Files(dir: string, files: string[] = []): string[] {
    // Get an array of all files and directories in the passed directory using fs.readdirSync
    const fileList = readdirSync(dir);
    // Create the full path of the file/directory by concatenating the passed directory and file/directory name
    for (const file of fileList) {
        const name = `${dir}/${file}`;
        // Check if the current file/directory is a directory using fs.statSync
        if (statSync(name).isDirectory()) {
            // If it is a directory, recursively call the getFiles function with the directory path and the files array
            getD2Files(name, files);
        } else {
            const ext: string = path.extname(name);
            if (ext.toLowerCase() !== ".d2") {
                continue;
            }

            // If it is a file, push the full path to the files array
            files.push(name);
        }
    }
    return files;
}


