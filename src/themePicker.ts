import { QuickPickItem, window } from "vscode";

/**
 * Container for D2 Themes
 */
class ThemeItem implements QuickPickItem {
  label: string;
  value: number;

  constructor(l: string, n: number) {
    this.label = l;
    this.value = n;
  }
}

/**
 * List of themes with their numeric values
 */
const themes: ThemeItem[] = [
  new ThemeItem("default", -1),
  new ThemeItem("Neutral gray", 1),
  new ThemeItem("Flagship Terrastruct", 3),
  new ThemeItem("Cool classics", 4),
  new ThemeItem("Mixed berry blue", 5),
  new ThemeItem("Grape soda", 6),
  new ThemeItem("Aubergine", 7),
  new ThemeItem("Colorblind clear", 8),
  new ThemeItem("Vanilla nitro cola", 100),
  new ThemeItem("Orange creamsicle", 101),
  new ThemeItem("Shirley temple", 102),
  new ThemeItem("Earth tones", 103),
  new ThemeItem("Everglade green", 104),
  new ThemeItem("Buttered toast", 105),
  new ThemeItem("Dark mauve", 200),
  new ThemeItem("DarkFlagshipTerrastruct", 201),
  new ThemeItem("Terminal", 300),
  new ThemeItem("Terminal Grayscale", 301),
  new ThemeItem("Origami", 302),
];

const ThemeSwitch = "--theme=";

export function GetThemeSwitch(theme: string): string {
  const tn = NameToThemeNumber(theme);

  if (tn === -1) {
    return "";
  }

  return ThemeSwitch + tn;
}

/**
 * NameToThemeNumber - Given a theme name, return the numeric
 * value that is used on the D2 commandline
 */
function NameToThemeNumber(theme: string): number {
  for (const t in themes) {
    if (themes[t].label === theme) {
      return themes[t].value;
    }
  }
  return 0;
}

/**
 * themePicker - This will show the quick pick list in
 * the command pallette when called
 */
export class themePicker {
  showPicker(): Thenable<QuickPickItem | undefined> {
    return window.showQuickPick(themes, {
      title: "Themes",
      canPickMany: false,
      placeHolder: "Choose a theme...",
    });
  }
}
