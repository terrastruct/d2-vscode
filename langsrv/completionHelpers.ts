/**
 * 
 */

import { CompletionItem, CompletionItemKind, CompletionList, MarkupKind, Position } from "vscode-languageserver";
import { getD2Files } from "./utility";
import { AstContainer } from "./d2Ast";
import { d2StringAndRange } from "./dataContainers";
import { statSync } from "fs";
import URI from "vscode-uri";
import path = require("path");

export const optBoolean =
{
    "boolean": [
        "true",
        "false"
    ]
};

export const optStyle =
{
    "style": [
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
        "text-transform"
    ]
};

export const optTextTransform =
{
    "text-transform": [
        "uppercase",
        "lowercase",
        "title",
        "none"
    ]
};

export const optShape =
{
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
        "sequence_diagram"
    ]
};

export const optArrowHeadSource =
{
    "source-arrowhead": [
        "none",
        "arrow",
        "triangle",
        "diamond",
        "filled-diamond",
        "circle",
        "filled-circle"
    ]
};

export const optArrowHeadTarget =
{
    "target-arrowhead": [
        "none",
        "arrow",
        "triangle",
        "diamond",
        "filled-diamond",
        "circle",
        "filled-circle"
    ]
};

export const namedRgbMap =
{
    "color": [
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
        "yellowgreen"
    ]
};

/**
 * 
 */
export class CompletionHelper {
    static doImport(dir: string, currentFile: string): CompletionList {

        console.log("Current File : " + currentFile);
        const dirToScan = URI.parse(dir).fsPath;
        const curFileShort = path.parse(URI.parse(currentFile).fsPath).name;
        console.log(`Ignore       : ${curFileShort}`)
        console.log(`DirToScan    : ${dirToScan}`);
        // debugger;
        const files = getD2Files(dirToScan);
        const compFiles: CompletionItem[] = [];

        for (let file of files) {
            const fst = statSync(file);
            file = file.replace(dirToScan + "/", "").replace(".d2", "");
            if (file === curFileShort) {
                continue;
            }

            const ci = CompletionItem.create(file);
            ci.kind = CompletionItemKind.File;
            ci.commitCharacters = ["\t"];
            const fiDate = fst.atime.toLocaleDateString();
            const fiSize = fst.size.toString() + " bytes";

            ci.documentation = {
                kind: MarkupKind.Markdown,
                value: [
                    '|File Date|Size|',
                    '|:----|----:|',
                    `|${fiDate}|${fiSize}|`
                ].join('\n')
            };

            compFiles.push(ci);
        }

        return CompletionList.create(compFiles);
    }

    static doAttribute(): CompletionList {
        console.log("Trigger on :");
        return CompletionList.create(
            [
                CompletionItem.create("Style"),
                CompletionItem.create("{}"),
                CompletionItem.create("Indifferent")], true);
    }

    static doDot(astData: AstContainer, pos: Position): CompletionList {
        // Move position back one character to get node *before* trigger character
        // const charPos = Math.max(0, pos.character - 1);


        const ref = astData.GetRangeFromLocation(pos);
        let sr: d2StringAndRange | undefined = new d2StringAndRange("", "");

        if (ref) {
            sr = astData.GetNodeFromRange(ref);
            console.log("  REF -> " + sr?.str + " " + JSON.stringify(ref));
        } else {
            console.log("  REF -> Nothing Found");
        }

        const ci1 = CompletionItem.create("Good");
        ci1.kind = CompletionItemKind.Property;

        const ci2 = CompletionItem.create("Bad");
        ci2.kind = CompletionItemKind.Field;

        return CompletionList.create(
            [
                ci1,
                ci2,
                CompletionItem.create("Indifferent")], false);
    }
}

