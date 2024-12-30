import { QuickPickItem, window } from "vscode";

/**
 * Container for D2 Sketch Mode
 */
class SketchItem implements QuickPickItem {
  label: string;
  value: number;

  constructor(l: string, n: number) {
    this.label = l;
    this.value = n;
  }
}

/**
 * List of sketch modes with their numeric values
 */
const sketches: SketchItem[] = [
  new SketchItem("default", -1),
  new SketchItem("false", 0),
  new SketchItem("true", 1),
];

const SketchSwitch = "--sketch=";

export function GetSketchSwitch(sketch: string): string {
  let sketchVal = 0;
  for (const s in sketches) {
    if (sketches[s].label === sketch) {
      sketchVal = sketches[s].value;
    }
  }

  if (sketchVal === -1) {
    return "";
  }

  return SketchSwitch + sketch;
}

/**
 * themePicker - This will show the quick pick list in
 * the command pallette when called
 */
export class sketchPicker {
  showPicker(): Thenable<QuickPickItem | undefined> {
    return window.showQuickPick(sketches, {
      title: "Sketch",
      canPickMany: false,
      placeHolder: "Choose show as sketch...",
    });
  }
}
