import { 
    DiagnosticSeverity, 
    Diagnostic,
    LSPAny, 
    Location, 
    Position, 
    PublishDiagnosticsParams, 
    Range, 
    TextDocumentIdentifier 
} from "vscode-languageserver/node";


export class d2Range implements Range {
    start: Position;
    end: Position;
    constructor(r: string) {
        this.start = { line: 0, character: 0 }
        this.end = { line: 0, character: 0 }

        if (r === undefined) {
            return;
        }

        const rg = new RegExp(/(.*),(\d*):(\d*):(\d*)-(\d*):(\d*):(\d*)/g).exec(r);

        if (rg === null) {
            return;
        }

        this.fileName = rg[1];

        this.startByte = parseInt(rg[4], 10);
        this.endByte = parseInt(rg[7], 10);

        this.start = { line: parseInt(rg[2], 10), character: parseInt(rg[3], 10) } as Position;
        this.end = { line: parseInt(rg[5], 10), character: parseInt(rg[6], 10) } as Position;
    }

    fileName = "";

    startByte = 0;
    endByte = 0;
}

/**
 * Describes a node or field, a container that is connected
 * to other nodes by edges.
 */
export class d2Node {
    constructor(n: LSPAny) {
        this.name = n.name;
        this.refs = [];

        n.references.forEach((r: LSPAny) => {
            this.refs.push(new d2Range(r.string.range));
        });
    }

    name: string;
    refs: d2Range[];
}

/**
 * Describes an edge, the connection between two nodes
 */
export class d2Edge {
    constructor(e: LSPAny) {
        this.src = e.edge_id.src_path;
        this.dst = e.edge_id.dst_path;
    }

    src: string;
    dst: string;
}

export class d2Error extends d2Range {
    constructor(e: LSPAny) {
        super(e.range);

        const rg = new RegExp(/^(.*?):(\d+):(\d+):(\s+)(.*)$/g).exec(e.errmsg);
        this.msg = (rg !== null) ? rg[5] : "Unknown Error";
        
        this.severity = DiagnosticSeverity.Error;
    }

    msg: string;
    severity: DiagnosticSeverity;
}

export class d2DocumentData {

    Fields: d2Node[] = [];
    Edges: d2Edge[] = [];
    Errors: d2Error[] = [];

    GetErrors(): [boolean, PublishDiagnosticsParams] {

        const diags: Diagnostic[] = [];

        let hasErrors = false;
        if (this.Errors?.length > 0) {
            hasErrors = true;
            this.Errors.forEach((e: d2Error) => {
                diags.push(Diagnostic.create(
                    Range.create(e.start, e.end),
                    e.msg, 
                    e.severity)
                );

            });

        }

        return [hasErrors, {uri: "", diagnostics: diags}]
    }

    ReadD2Data(doc: string): void {
        debugger;
        // Parse the Ast, Ir and Errors from D2
        const docObj = JSON.parse(doc);


        /**
         * When there is an Ir defined, the compile was 
         * succesfull and can be used to provide information
        */
        docObj.Ir?.fields.forEach((f: LSPAny) => {
            const n = new d2Node(f);
            this.Fields.push(n);
        });

        docObj.Ir?.edges?.forEach((e: LSPAny) => {
            const edg = new d2Edge(e);
            this.Edges.push(edg);
        });

        debugger;
        docObj.Err?.errs?.forEach((err: LSPAny) => {
            const er = new d2Error(err);
            this.Errors.push(er);
        });
    }

    FindReferencesAtLocation(pos: Position, td: TextDocumentIdentifier): Location[] {
        const results: Location[] = [];
        this.Fields.forEach((n: d2Node) => {
            n.refs.forEach((r: d2Range) => {
                if (pos.line === r.start.line &&
                    pos.character >= r.start.character &&
                    pos.character <= r.end.character) {
                    console.log("match: " + n.name);

                    n.refs.forEach((ref: d2Range) => {
                        results.push(Location.create(td.uri, Range.create(ref.start, ref.end)));
                    });
                }
            });
        });

        return results;
    }
}

