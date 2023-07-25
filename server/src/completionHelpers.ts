/**
 *
 */

import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  InsertTextFormat,
  InsertTextMode,
  Position
} from "vscode-languageserver";

import path = require("path");
import URI from "vscode-uri";

import { getD2Files } from "./utility";
import { statSync } from "fs";
import { AstReader } from "./d2Ast";

export const optBoolean = {
  boolean: [
    "true", 
    "false"
  ],
};

export const optStyle = {
  style: [
    "opacity",
    "stroke",
    "fill",
    "fill-pattern",
    "stroke-width",
    "stroke-dash",
    "border-radius",
    "shadow",
    "3D",
    "multiple",
    "double-border",
    "font",
    "font-size",
    "font-color",
    "animated",
    "bold",
    "italic",
    "underline",
    "text-transform",
  ],
};

export const optTextTransform = {
  "text-transform": [
    "uppercase", 
    "lowercase", 
    "title", 
    "none"
  ],
};

export const optShape = {
  "shape": [
    "rectangle",
    "square",
    "page",
    "parallelogram",
    "document",
    "cylinder",
    "queue",
    "package",
    "step",
    "callout",
    "stored_data",
    "person",
    "diamond",
    "oval",
    "circle",
    "hexagon",
    "cloud",
    "text",
    "code",
    "class",
    "sql_table",
    "image",
    "sequence_diagram",
  ]
};


export const optFillPatterns = {
  "fill-pattern": [
    "dots",
    "lines",
    "grain",
    "paper"
  ]
}

export const optArrowHeadSource = {
  "source-arrowhead": [
    "none",
    "arrow",
    "triangle",
    "diamond",
    "filled-diamond",
    "circle",
    "filled-circle",
  ]
};

export const optArrowHeadTarget = {
  "target-arrowhead": [
    "none",
    "arrow",
    "triangle",
    "diamond",
    "filled-diamond",
    "circle",
    "filled-circle",
  ],
};

export const namedRgbMap = {
  "fill": [
    "aliceblue",
    "antiquewhite",
    "aqua",
    "aquamarine",
    "azure",
    "beige",
    "bisque",
    "black",
    "blanchedalmond",
    "blue",
    "blueviolet",
    "brown",
    "burlywood",
    "cadetblue",
    "chartreuse",
    "chocolate",
    "coral",
    "cornflowerblue",
    "cornsilk",
    "crimson",
    "cyan",
    "darkblue",
    "darkcyan",
    "darkgoldenrod",
    "darkgray",
    "darkgreen",
    "darkgrey",
    "darkkhaki",
    "darkmagenta",
    "darkolivegreen",
    "darkorange",
    "darkorchid",
    "darkred",
    "darksalmon",
    "darkseagreen",
    "darkslateblue",
    "darkslategray",
    "darkslategrey",
    "darkturquoise",
    "darkviolet",
    "deeppink",
    "deepskyblue",
    "dimgray",
    "dimgrey",
    "dodgerblue",
    "firebrick",
    "floralwhite",
    "forestgreen",
    "fuchsia",
    "gainsboro",
    "ghostwhite",
    "gold",
    "goldenrod",
    "gray",
    "green",
    "greenyellow",
    "grey",
    "honeydew",
    "hotpink",
    "indianred",
    "indigo",
    "ivory",
    "khaki",
    "lavender",
    "lavenderblush",
    "lawngreen",
    "lemonchiffon",
    "lightblue",
    "lightcoral",
    "lightcyan",
    "lightgoldenrodyellow",
    "lightgray",
    "lightgreen",
    "lightgrey",
    "lightpink",
    "lightsalmon",
    "lightseagreen",
    "lightskyblue",
    "lightslategray",
    "lightslategrey",
    "lightsteelblue",
    "lightyellow",
    "lime",
    "limegreen",
    "linen",
    "magenta",
    "maroon",
    "mediumaquamarine",
    "mediumblue",
    "mediumorchid",
    "mediumpurple",
    "mediumseagreen",
    "mediumslateblue",
    "mediumspringgreen",
    "mediumturquoise",
    "mediumvioletred",
    "midnightblue",
    "muintcream",
    "mistyrose",
    "moccasin",
    "navajowhite",
    "navy",
    "oldlace",
    "olive",
    "olivedrab",
    "orange",
    "orangered",
    "orchid",
    "palegoldenrod",
    "palegreen",
    "paleturquoise",
    "palevioletred",
    "papayawhip",
    "peachpuff",
    "peru",
    "pink",
    "plum",
    "powderblue",
    "purple",
    "red",
    "rebeccapurple",
    "rosybrown",
    "royalblue",
    "saddlebrown",
    "salmon",
    "sandybrown",
    "seagreen",
    "seashell",
    "sienna",
    "silver",
    "skyblue",
    "slateblue",
    "slategray",
    "slategrey",
    "snow",
    "springgreen",
    "steelblue",
    "tan",
    "teal",
    "thistle",
    "tomato",
    "turquoise",
    "violet",
    "wheat",
    "white",
    "whitesmoke",
    "yellow",
    "yellowgreen",
  ]
};

/**
 *
 */
export class CompletionHelper {
  /**
   * 
   * @param dir 
   * @param currentFile 
   * @returns 
   */
  static doImport(dir: string, currentFile: string): CompletionList {
    console.log("Current File : " + currentFile);
    const dirToScan = URI.parse(dir).fsPath;
    const curFileShort = path.parse(URI.parse(currentFile).fsPath).name;
    console.log(`Ignore       : ${curFileShort}`);
    console.log(`DirToScan    : ${dirToScan}`);
    const files = getD2Files(dirToScan);
    const compFiles: CompletionItem[] = [];

    for (let file of files) {
      const fst = statSync(file);
      file = file.replace(dirToScan + "/", "").replace(".d2", "");
      if (file === curFileShort) {
        continue;
      }

      const fiDate = fst.atime.toLocaleDateString();
      const fiSize = fst.size.toString() + " bytes";

      const ci = CompletionItem.create(file);
      ci.kind = CompletionItemKind.File;
      ci.commitCharacters = ["\t"];
      ci.labelDetails = { description: `${fiSize}  ${fiDate}` }

      compFiles.push(ci);
    }

    return CompletionList.create(compFiles);
  }

  /**
   * 
   */
  static doAttribute(astData: AstReader, pos: Position): CompletionList {
    // Move position back one character to get node *before* trigger character
    const charPos = Math.max(0, pos.character - 1);

    const ref = astData.refAtPosition({ line: pos.line, character: charPos });

    if (ref) {
      console.log("  REF -> " + ref.strValue + " " + JSON.stringify(ref));
    } else {
      console.log("  REF -> Nothing Found");
    }

    const ci = CompletionItem.create("{}");
    // eslint-disable-next-line no-template-curly-in-string
    ci.insertText = " {\n\t${0}\n}";
    ci.kind = CompletionItemKind.Snippet;
    ci.insertTextFormat = InsertTextFormat.Snippet
    ci.insertTextMode = InsertTextMode.adjustIndentation;

    return CompletionList.create(
      [
        ci
      ],
      false
    );
  }

  /**
   * 
   */
  static doDot(astData: AstReader, pos: Position): CompletionList {

    // Move position back one character to get node *before* trigger character
    const charPos = Math.max(0, pos.character - 1);

    const ref = astData.refAtPosition({line: pos.line, character: charPos});
    
    if (ref) {
      console.log("  REF -> " + ref.strValue + " " + JSON.stringify(ref));
    } else {
      console.log("  REF -> Nothing Found");
    }

    return CompletionList.create(
      [
        CompletionItem.create("You hit period")
      ],
      false
    );
  }

  /**
   *
   * 
   */
  static doOpenSpace(): CompletionList {

    return CompletionList.create(
      [
        CompletionItem.create("Your in open space")
      ],
      false
    );
  }
}

/**
 // Non Style/Holder keywords.
var SimpleReservedKeywords = map[string]struct{}{
  "label":          {},
  "desc":           {},
  "shape":          {},
  "icon":           {},
  "constraint":     {},
  "tooltip":        {},
  "link":           {},
  "near":           {},
  "width":          {},
  "height":         {},
  "direction":      {},
  "top":            {},
  "left":           {},
  "grid-rows":      {},
  "grid-columns":   {},
  "grid-gap":       {},
  "vertical-gap":   {},
  "horizontal-gap": {},
  "class":          {},
}

// ReservedKeywordHolders are reserved keywords that are meaningless on its own and must hold composites
var ReservedKeywordHolders = map[string]struct{}{
  "style":            {},
  "source-arrowhead": {},
  "target-arrowhead": {},
}

// CompositeReservedKeywords are reserved keywords that can hold composites
var CompositeReservedKeywords = map[string]struct{}{
  "classes":    {},
  "constraint": {},
  "label":      {},
  "icon":       {},
}

// StyleKeywords are reserved keywords which cannot exist outside of the "style" keyword
var StyleKeywords = map[string]struct{}{
  "opacity":       {},
  "stroke":        {},
  "fill":          {},
  "fill-pattern":  {},
  "stroke-width":  {},
  "stroke-dash":   {},
  "border-radius": {},

  // Only for text
  "font":           {},
  "font-size":      {},
  "font-color":     {},
  "bold":           {},
  "italic":         {},
  "underline":      {},
  "text-transform": {},

  // Only for shapes
  "shadow":        {},
  "multiple":      {},
  "double-border": {},

  // Only for squares
  "3d": {},

  // Only for edges
  "animated": {},
  "filled":   {},
}

// TODO maybe autofmt should allow other values, and transform them to conform
// e.g. left-center becomes center-left
var NearConstantsArray = []string{
  "top-left",
  "top-center",
  "top-right",

  "center-left",
  "center-right",

  "bottom-left",
  "bottom-center",
  "bottom-right",
}
var NearConstants map[string]struct{}

// LabelPositionsArray are the values that labels and icons can set `near` to
var LabelPositionsArray = []string{
  "top-left",
  "top-center",
  "top-right",

  "center-left",
  "center-center",
  "center-right",

  "bottom-left",
  "bottom-center",
  "bottom-right",

  "outside-top-left",
  "outside-top-center",
  "outside-top-right",

  "outside-left-top",
  "outside-left-center",
  "outside-left-bottom",

  "outside-right-top",
  "outside-right-center",
  "outside-right-bottom",

  "outside-bottom-left",
  "outside-bottom-center",
  "outside-bottom-right",
}
var LabelPositions map[string]struct{}

// convert to label.Position
var LabelPositionsMapping = map[string]label.Position{
  "top-left":   label.InsideTopLeft,
  "top-center": label.InsideTopCenter,
  "top-right":  label.InsideTopRight,

  "center-left":   label.InsideMiddleLeft,
  "center-center": label.InsideMiddleCenter,
  "center-right":  label.InsideMiddleRight,

  "bottom-left":   label.InsideBottomLeft,
  "bottom-center": label.InsideBottomCenter,
  "bottom-right":  label.InsideBottomRight,

  "outside-top-left":   label.OutsideTopLeft,
  "outside-top-center": label.OutsideTopCenter,
  "outside-top-right":  label.OutsideTopRight,

  "outside-left-top":    label.OutsideLeftTop,
  "outside-left-center": label.OutsideLeftMiddle,
  "outside-left-bottom": label.OutsideLeftBottom,

  "outside-right-top":    label.OutsideRightTop,
  "outside-right-center": label.OutsideRightMiddle,
  "outside-right-bottom": label.OutsideRightBottom,

  "outside-bottom-left":   label.OutsideBottomLeft,
  "outside-bottom-center": label.OutsideBottomCenter,
  "outside-bottom-right":  label.OutsideBottomRight,
}

var FillPatterns = []string{
  "dots",
  "lines",
  "grain",
  "paper",
}

var textTransforms = []string{"none", "uppercase", "lowercase", "capitalize"}

// BoardKeywords contains the keywords that create new boards.
var BoardKeywords = map[string]struct{}{
  "layers":    {},
  "scenarios": {},
  "steps":     {},
}

 */
