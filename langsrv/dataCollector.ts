/**
 * 
 */

import { d2StringAndRange } from "./dataContainers";

export class DataCollector {

    private collectorStack = new Stack();
    private links: d2StringAndRange[] = [];
    private imports: d2StringAndRange[] = [];
    private nodes: d2StringAndRange[] = [];
    private edges: EdgeItem[] = [];

    get Nodes() {
        return this.nodes;
    }

    get Links() {
        return this.links;
    }

    get Imports() {
        return this.imports;
    }

    get Edges() {
        return this.edges;
    }

    get LinksAndImports() {
        return [...this.imports, ...this.links];
    }

    addPath(p: d2StringAndRange): void {
        this.collectorStack.push(new StackItem(dataType.Path, p));
    }

    addNode(n: d2StringAndRange): void {
        this.collectorStack.push(new StackItem(dataType.Node, n));
        if (!this.nodeContains(n)) {
            this.nodes.push(n);
        }
    }

    addValue(v: d2StringAndRange): void {
        this.collectorStack.push(new StackItem(dataType.Value, v));
    }

    addImport(i: d2StringAndRange): void {
        this.collectorStack.push(new StackItem(dataType.Import, i));
        this.imports.push(i);
    }

    addEdge(src: d2StringAndRange, dst: d2StringAndRange) {
        if (!this.nodeContains(src)) {
            this.nodes.push(src);
        }
        if (!this.nodeContains(dst)) {
            this.nodes.push(dst);
        }
        this.edges.push(new EdgeItem(src, dst));
    }

    /**
     * 
     */
    private nodeContains(sr: d2StringAndRange): boolean {
        for (const n of this.nodes) {
            if (n.isRangeEqual(sr)) {
                return true;
            }
        }
        return false;
    }

    dump(): void {
        console.log(`Total Items: ${this.collectorStack.length}`)
        console.log(`Nodes:    ${this.nodes.length}`);
        console.log(`Links:    ${this.links.length}`);
        console.log(`Imports:  ${this.imports.length}`);
        console.log(`Edges:    ${this.edges.length}`)

        this.collectorStack.dump();

        console.log(`\nIMPORTS\n-------\n`);
        for (const i of this.imports) {
            console.log(i.toString());
        }

        console.log(`\nLINKS\n-----\n`);
        for (const l of this.links) {
            console.log(l.toString());
        }

        console.log(`\nNODES\n-----\n`);
        for (const node of this.nodes) {
            console.log(node.toString());
        }

        console.log(`\nEDGES\n-----\n`);
        for (const edge of this.edges) {
            console.log(edge.toString());
        }
    }
}

// eslint-disable-next-line no-shadow, no-unused-vars
enum dataType { None, Path, Node, Value, Link, Import, Edge }

class EdgeItem {
    constructor(src: d2StringAndRange, dst: d2StringAndRange) {
        this.src = src;
        this.dst = dst;
    }

    src: d2StringAndRange;
    dst: d2StringAndRange;

    public toString(): string {
        return `EG    -> ${this.src.str} -- ${this.dst.str}`;
    }
}

class StackItem {
    constructor(type: dataType, val: d2StringAndRange) {
        this.type = type;
        this.val = val;
    }

    type: dataType = dataType.None;
    val?: d2StringAndRange = undefined;

    public toString(): string {
        return `StkI  -> ${dataType[this.type].padStart(8, " ")} : ${this.val?.toString()}`;
    }
}

// Better Stack
//
class Stack {
    private array: StackItem[] = [];
    private emptyError = "Stack is Empty";

    get length() {
        return this.array.length;
    }

    pop(): StackItem | undefined {

        if (this.isEmpty()) {
            throw new Error(this.emptyError);
        }

        return this.array.pop();
    }

    push(data: StackItem): void {

        this.array.push(data);
    }

    peek(): StackItem {

        if (this.isEmpty()) {
            throw new Error(this.emptyError);
        }

        return this.array[this.array.length - 1];
    }

    isEmpty(): boolean {

        return this.array.length === 0;
    }

    dump(): void {
        this.array.forEach((item: StackItem) => {
            console.log(item.toString());
        });

    }

}

