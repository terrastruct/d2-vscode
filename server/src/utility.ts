/**
 * Utility functions for the language server
 *
 */

import { R_OK } from "constants";
import { accessSync, readdirSync, statSync } from "fs";
import path = require("path");
import { d2Extension } from "./server";

/**
 * Given a directory, finds all d2 files in that directory
 * and all sub-directorys
 */
export function getD2FilesFromPaths(dirs: string[], files: string[] = []): string[] {
  for (const dir of dirs) {
    // Get an array of all files and directories in the passed directory using fs.readdirSync
    const fileList = readdirSync(dir);
    // Create the full path of the file/directory by concatenating the passed directory and file/directory name
    for (const file of fileList) {
      const name = `${dir}/${file}`;
      // Check if the current file/directory is a directory using fs.statSync
      if (statSync(name).isDirectory()) {
        try {
          accessSync(name, R_OK);
          // If it is a directory, recursively call the getFiles function with the directory path and the files array
          getD2FilesFromPaths([name], files);
        } catch {
          /* NO ACCESS */
        }
      } else {
        // Don't show any non-d2 files
        const ext: string = path.parse(name).ext.toLowerCase();
        if (ext !== d2Extension) {
          continue;
        }

        // If it is a file, push the full path to the files array
        files.push(name);
      }
    }
  }

  return files;
}

/**
 ***********************
 * END OF FILE
 ***********************
 */
