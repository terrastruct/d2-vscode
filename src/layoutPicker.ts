import { QuickPickItem, window } from "vscode";
import { util } from "./utility";

/**
 * Container for D2 Layouts
 */
class LayoutItem implements QuickPickItem {
  label: string;
  description: string;
  value: number;

  constructor(l: string, v: number, d: string) {
    this.label = l;
    this.description = d;
    this.value = v;
  }
}

/**
 * List of Layouts
 */
const layouts: LayoutItem[] = [
  new LayoutItem("default", -1, "As directored by the d2 file"),
  new LayoutItem("dagre", 0, "The directed graph layout library Dagre"),
  new LayoutItem("elk", 1, "Eclipse Layout Kernel (ELK) with the Layered algorithm"),
];

const layoutTala = new LayoutItem("tala", 2, "Terrastruct's AutoLayout Approach");

const talaPluginName: string =
  process.platform === "win32" ? "d2plugin-tala.exe" : "d2plugin-tala";

const LayoutSwitch = "--layout=";

export function GetLayoutSwitch(layout: string): string {
  let layoutVal = 0;
  for (const l in layouts) {
    if (layouts[l].label === layout) {
      layoutVal = layouts[l].value;
    }
  }

  if (layoutVal === -1) {
    return "";
  }

  return LayoutSwitch + layout;
}

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
