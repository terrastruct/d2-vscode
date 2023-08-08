/**
 * Classes that help autocompletion
 *
 * Note: Any change in the d2 language will require
 * work here (e.g. new keywords)
 */

import { d2Node } from "./dataContainers";

/**
 * Class to describe the static data below
 */
class TreeItem {
  constructor(item: string, value?: TreeItem[]) {
    this.item = item;
    this.value = value;
  }

  item = "";
  value?: TreeItem[];
}

/**
 * Represents the tree of keywords and values that
 * are possible in d2
 */
export class ItemTree {
  // Root of the ItemTree
  public static get Root(): TreeItem[] {
    return this.optRoot;
  }

  // Is the array values or keywords?  Values are the leafs
  // of the tree
  public static isValueArray(arr: TreeItem[]): boolean {
    return arr.every((ti: TreeItem) => {
      return ti.item && ti.item.length > 0 && ti.value === undefined;
    });
  }

  // get the next possible values for a given path
  public static getValueFromPath(node: d2Node): string[] {
    let path = node.Key?.path;
    let pathOffset = 1;

    if (node.hasNodeValues) {
      path = node.nodeValueNodes[0].Key?.path;
      pathOffset = 0;
    }

    const retList: string[] = [];
    if (path) {
      let arr: TreeItem[] = this.Root;
      for (const p of path.list.slice(pathOffset)) {
        if (arr) {
          const x: TreeItem | undefined = arr.find(
            (el: TreeItem) => el.item === p.value?.str
          );
          if (x) {
            arr = x.value || [];
          }
        }
      }

      if (ItemTree.isValueArray(arr)) {
        for (const i of arr) {
          retList.push(i.item);
        }
      }
    }
    return retList;
  }

  /**
   * Gets list of keywords based on given path
   */
  public static getListFromPath(node: d2Node): string[] {
    let path = node.Key?.path;
    let pathOffset = 1;

    if (node.hasNodeValues) {
      path = node.nodeValueNodes[0].Key?.path;
      pathOffset = 0;
    }

    const retList: string[] = [];

    if (path) {
      if (path.isNodeOnly && !node.hasNodeValues) {
        for (const i of this.Root) {
          retList.push(i.item);
        }
      } else {
        let arr: TreeItem[] = this.Root;
        // First path item is the node name, skip
        for (const p of path.list.slice(pathOffset)) {
          if (arr) {
            const x: TreeItem | undefined = arr.find(
              (el: TreeItem) => el.item === p.value?.str
            );
            if (x) {
              arr = x.value || [];
            }
          }
        }

        for (const i of arr) {
          retList.push(i.item);
        }
      }
    }

    return retList;
  }

  /**
   * Static list of possible values in a d2 file.
   */
  private static readonly colorList: TreeItem[] = [
    new TreeItem("aliceblue"),
    new TreeItem("antiquewhite"),
    new TreeItem("aqua"),
    new TreeItem("aquamarine"),
    new TreeItem("azure"),
    new TreeItem("beige"),
    new TreeItem("bisque"),
    new TreeItem("black"),
    new TreeItem("blanchedalmond"),
    new TreeItem("blue"),
    new TreeItem("blueviolet"),
    new TreeItem("brown"),
    new TreeItem("burlywood"),
    new TreeItem("cadetblue"),
    new TreeItem("chartreuse"),
    new TreeItem("chocolate"),
    new TreeItem("coral"),
    new TreeItem("cornflowerblue"),
    new TreeItem("cornsilk"),
    new TreeItem("crimson"),
    new TreeItem("cyan"),
    new TreeItem("darkblue"),
    new TreeItem("darkcyan"),
    new TreeItem("darkgoldenrod"),
    new TreeItem("darkgray"),
    new TreeItem("darkgreen"),
    new TreeItem("darkgrey"),
    new TreeItem("darkkhaki"),
    new TreeItem("darkmagenta"),
    new TreeItem("darkolivegreen"),
    new TreeItem("darkorange"),
    new TreeItem("darkorchid"),
    new TreeItem("darkred"),
    new TreeItem("darksalmon"),
    new TreeItem("darkseagreen"),
    new TreeItem("darkslateblue"),
    new TreeItem("darkslategray"),
    new TreeItem("darkslategrey"),
    new TreeItem("darkturquoise"),
    new TreeItem("darkviolet"),
    new TreeItem("deeppink"),
    new TreeItem("deepskyblue"),
    new TreeItem("dimgray"),
    new TreeItem("dimgrey"),
    new TreeItem("dodgerblue"),
    new TreeItem("firebrick"),
    new TreeItem("floralwhite"),
    new TreeItem("forestgreen"),
    new TreeItem("fuchsia"),
    new TreeItem("gainsboro"),
    new TreeItem("ghostwhite"),
    new TreeItem("gold"),
    new TreeItem("goldenrod"),
    new TreeItem("gray"),
    new TreeItem("green"),
    new TreeItem("greenyellow"),
    new TreeItem("grey"),
    new TreeItem("honeydew"),
    new TreeItem("hotpink"),
    new TreeItem("indianred"),
    new TreeItem("indigo"),
    new TreeItem("ivory"),
    new TreeItem("khaki"),
    new TreeItem("lavender"),
    new TreeItem("lavenderblush"),
    new TreeItem("lawngreen"),
    new TreeItem("lemonchiffon"),
    new TreeItem("lightblue"),
    new TreeItem("lightcoral"),
    new TreeItem("lightcyan"),
    new TreeItem("lightgoldenrodyellow"),
    new TreeItem("lightgray"),
    new TreeItem("lightgreen"),
    new TreeItem("lightgrey"),
    new TreeItem("lightpink"),
    new TreeItem("lightsalmon"),
    new TreeItem("lightseagreen"),
    new TreeItem("lightskyblue"),
    new TreeItem("lightslategray"),
    new TreeItem("lightslategrey"),
    new TreeItem("lightsteelblue"),
    new TreeItem("lightyellow"),
    new TreeItem("lime"),
    new TreeItem("limegreen"),
    new TreeItem("linen"),
    new TreeItem("magenta"),
    new TreeItem("maroon"),
    new TreeItem("mediumaquamarine"),
    new TreeItem("mediumblue"),
    new TreeItem("mediumorchid"),
    new TreeItem("mediumpurple"),
    new TreeItem("mediumseagreen"),
    new TreeItem("mediumslateblue"),
    new TreeItem("mediumspringgreen"),
    new TreeItem("mediumturquoise"),
    new TreeItem("mediumvioletred"),
    new TreeItem("midnightblue"),
    new TreeItem("muintcream"),
    new TreeItem("mistyrose"),
    new TreeItem("moccasin"),
    new TreeItem("navajowhite"),
    new TreeItem("navy"),
    new TreeItem("oldlace"),
    new TreeItem("olive"),
    new TreeItem("olivedrab"),
    new TreeItem("orange"),
    new TreeItem("orangered"),
    new TreeItem("orchid"),
    new TreeItem("palegoldenrod"),
    new TreeItem("palegreen"),
    new TreeItem("paleturquoise"),
    new TreeItem("palevioletred"),
    new TreeItem("papayawhip"),
    new TreeItem("peachpuff"),
    new TreeItem("peru"),
    new TreeItem("pink"),
    new TreeItem("plum"),
    new TreeItem("powderblue"),
    new TreeItem("purple"),
    new TreeItem("red"),
    new TreeItem("rebeccapurple"),
    new TreeItem("rosybrown"),
    new TreeItem("royalblue"),
    new TreeItem("saddlebrown"),
    new TreeItem("salmon"),
    new TreeItem("sandybrown"),
    new TreeItem("seagreen"),
    new TreeItem("seashell"),
    new TreeItem("sienna"),
    new TreeItem("silver"),
    new TreeItem("skyblue"),
    new TreeItem("slateblue"),
    new TreeItem("slategray"),
    new TreeItem("slategrey"),
    new TreeItem("snow"),
    new TreeItem("springgreen"),
    new TreeItem("steelblue"),
    new TreeItem("tan"),
    new TreeItem("teal"),
    new TreeItem("thistle"),
    new TreeItem("tomato"),
    new TreeItem("turquoise"),
    new TreeItem("violet"),
    new TreeItem("wheat"),
    new TreeItem("white"),
    new TreeItem("whitesmoke"),
    new TreeItem("yellow"),
    new TreeItem("yellowgreen"),
  ];

  private static readonly trueFalse: TreeItem[] = [
    new TreeItem("true"),
    new TreeItem("false"),
  ];

  private static readonly arrowTypes: TreeItem[] = [
    new TreeItem("none"),
    new TreeItem("arrow"),
    new TreeItem("triangle"),
    new TreeItem("diamond"),
    new TreeItem("filled-diamond"),
    new TreeItem("circle"),
    new TreeItem("filled-circle"),
  ];

  private static readonly fillPattern: TreeItem[] = [
    new TreeItem("dots"),
    new TreeItem("lines"),
    new TreeItem("grain"),
    new TreeItem("paper"),
  ];

  private static readonly shapeTypes: TreeItem[] = [
    new TreeItem("rectangle"),
    new TreeItem("square"),
    new TreeItem("page"),
    new TreeItem("parallelogram"),
    new TreeItem("document"),
    new TreeItem("cylinder"),
    new TreeItem("queue"),
    new TreeItem("package"),
    new TreeItem("step"),
    new TreeItem("callout"),
    new TreeItem("stored_data"),
    new TreeItem("person"),
    new TreeItem("diamond"),
    new TreeItem("oval"),
    new TreeItem("circle"),
    new TreeItem("hexagon"),
    new TreeItem("cloud"),
    new TreeItem("text"),
    new TreeItem("code"),
    new TreeItem("class"),
    new TreeItem("sql_table"),
    new TreeItem("image"),
    new TreeItem("sequence_diagram"),
  ];

  private static readonly textTransform: TreeItem[] = [
    new TreeItem("uppercase"),
    new TreeItem("lowercase"),
    new TreeItem("title"),
    new TreeItem("capitalize"),
    new TreeItem("none"),
  ];

  private static readonly nearPositions: TreeItem[] = [
    new TreeItem("top-left"),
    new TreeItem("top-center"),
    new TreeItem("top-right"),
    new TreeItem("center-left"),
    new TreeItem("center-right"),
    new TreeItem("bottom-left"),
    new TreeItem("bottom-center"),
    new TreeItem("bottom-right"),
  ];

  private static readonly directions: TreeItem[] = [
    new TreeItem("up"),
    new TreeItem("down"),
    new TreeItem("left"),
    new TreeItem("right"),
  ];

  private static readonly styles: TreeItem[] = [
    new TreeItem("opacity"),
    new TreeItem("stroke"),
    new TreeItem("fill", this.colorList),
    new TreeItem("fill-pattern", this.fillPattern),
    new TreeItem("stroke-width"),
    new TreeItem("stroke-dash"),
    new TreeItem("border-radius"),
    new TreeItem("shadow", this.trueFalse),
    new TreeItem("3D", this.trueFalse),
    new TreeItem("multiple", this.trueFalse),
    new TreeItem("double-border", this.trueFalse),
    new TreeItem("font"),
    new TreeItem("font-size"),
    new TreeItem("font-color", this.colorList),
    new TreeItem("bold", this.trueFalse),
    new TreeItem("italic", this.trueFalse),
    new TreeItem("underline", this.trueFalse),
    new TreeItem("text-transform", this.textTransform),
  ];

  private static readonly optRoot: TreeItem[] = [
    new TreeItem("style", this.styles),
    new TreeItem("shape", this.shapeTypes),
    new TreeItem("label"),
    new TreeItem("desc"),
    new TreeItem("icon"),
    new TreeItem("tooltip"),
    new TreeItem("link"),
    new TreeItem("near", this.nearPositions),
    new TreeItem("width"),
    new TreeItem("height"),
    new TreeItem("direction", this.directions),
    new TreeItem("top"),
    new TreeItem("left"),
    new TreeItem("grid-rows"),
    new TreeItem("grid-columns"),
    new TreeItem("grid-gap"),
    new TreeItem("vertical-gap"),
    new TreeItem("horizontal-gap"),
    new TreeItem("class"),
    new TreeItem("target-arrowhead", this.arrowTypes),
    new TreeItem("source-arrowhead", this.arrowTypes),
    new TreeItem("layers"),
    new TreeItem("animated"),
    new TreeItem("scenarios"),
    new TreeItem("steps"),
    new TreeItem("constraint"),
  ];
}

/**
 ***********************
 * END OF FILE
 ***********************
 */
