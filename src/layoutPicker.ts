import { QuickPickItem, window } from "vscode";
import { util } from "./utility";
import * as os from "os";

/**
 * Container for D2 Layouts
 */
class LayoutItem implements QuickPickItem {
  label: string;
  description: string;

  constructor(l: string, d: string) {
    this.label = l;
    this.description = d;
  }
}

/**
 * List of Layouts
 */
const layouts: QuickPickItem[] = [
  new LayoutItem("dagre", "The directed graph layout library Dagre"),
  new LayoutItem("elk", "Eclipse Layout Kernel (ELK) with the Layered algorithm")
];

const layoutTala = new LayoutItem("tala", "General Orthogonal Layout Engine");

const talaPluginName: string = process.platform === 'win32' ? 'd2plugin-tala.dll' : 'd2plugin-tala'; 

/**
 * layouPicker - This will show the quick pick list in
 * the command pallette when called
 */
export class layoutPicker {
  constructor() {
    // If the plugin file exists, add the option if it hasn't been added before
    if (util.isFileOnPath(talaPluginName)) {
      if (layouts.indexOf(layoutTala) === -1) {
        layouts.push(layoutTala);
      }
    } else {
      // If the plugin file does *not* exist, remove the option if it exists in the array
      const idx = layouts.indexOf(layoutTala);
      if (idx !== -1) {
        layouts.splice(idx, 1);
      }
    }
  }

  showPicker(): Thenable<QuickPickItem | undefined> {
    return window.showQuickPick(layouts, {
      title: "Layouts",
      canPickMany: false,
      placeHolder: "Choose a layout...",
    });
  }
}
