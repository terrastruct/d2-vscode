import { QuickPickItem, window } from "vscode";

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
  new LayoutItem("elk", "Eclipse Layout Kernel (ELK) with the Layered algorithm"),
  new LayoutItem("tala", "General Orthogonal Layout Engine")
];

/**
 * layouPicker - This will show the quick pick list in
 * the command pallette when called
 */
export class layoutPicker {
  showPicker(): Thenable<QuickPickItem | undefined> {
    return window.showQuickPick(layouts, {
      title: "Layouts",
      canPickMany: false,
      placeHolder: "Choose a layout...",
    });
  }
}
