import * as lodash from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    RequestType,
    TextDocumentIdentifier,
    TextDocuments,
    Files,
} from 'vscode-languageserver';
import { Diagnostic, DiagnosticSeverity, PublishDiagnosticsParams, TextDocument } from 'vscode-languageserver';
import Uri from 'vscode-uri';

import { detectIssues, findIdxMapping, IdxMapping } from './common/mythril';
import { MythrilOutput } from './common/mythril';
import { CompileResult, SolcCompiler } from './common/solc-compiler';
import { SourceMap } from './common/source-map';


const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

export function log(message: string): void {
    connection.console.log(message);
}
export function error(message: string): void {
    connection.console.error(message);
}

const documents: TextDocuments = new TextDocuments();

documents.onDidOpen(e => {
});

/**
 * Clear diagnostics once we start editing
 */
documents.onDidChangeContent(e => {
    connection.sendDiagnostics({
        uri: e.document.uri,
        diagnostics: []
    });
});

documents.onDidSave(e => {
});

documents.onDidClose(e => {
});

documents.listen(connection);

let rootPath: string;

connection.onInitialize(params => {
    rootPath = params.rootPath;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
        }
    }
});

enum Status {
    ok = 1,
    fail
}
interface ActiveAnalysisParams {
    textDocument: TextDocumentIdentifier
}
interface ActiveAnalysisResult {
    status: Status;
    numWarnings: number;
}
interface AllAnalysisParams {
}
interface AllAnalysisResult {
    status: Status;
    numWarnings: number;
}
namespace MythrilRequest {
    export const active = new RequestType <
        ActiveAnalysisParams,
        ActiveAnalysisResult,
        void, void > ('textDocument/mythril/activeAnalyze');
    export const all = new RequestType <
        AllAnalysisParams,
        AllAnalysisResult,
        void, void > ('textDocument/mythril/allAnalyze');
}

connection.onRequest(MythrilRequest.active, async (params) => {
    const uri = params.textDocument.uri;
    const activeDoc = documents.get(uri);
    try {
        const diagnostics = await doAnalysis(activeDoc.uri);
        diagnostics.forEach(d => connection.sendDiagnostics(d));
        const n = diagnostics.reduce((acc, d) => {
            return acc + d.diagnostics.length;
        }, 0);
        return { status: Status.ok, numWarnings: n }
    } catch (error) {
        return { status: Status.fail, numWarnings: 0 }
    }
});

connection.onRequest(MythrilRequest.all, async (params) => {
    const files = [];
        // fs.readdirSync(rootPath)
        // .map(f => Uri.file(path.join(rootPath, f)).toString());
        // TODO: documents can only handle opened files.
    try {
        const docs = lodash.union(files, documents.all().map(d => d.uri))
            .filter(doc => path.extname(doc) === '.sol');
        const n = await Promise.all(
            docs.map(docUri => {
                return doAnalysis(docUri).then( diagnostics => {
                    diagnostics.forEach(d => connection.sendDiagnostics(d));
                    return Promise.resolve(diagnostics.reduce((acc, d) => {
                        return acc + d.diagnostics.length;
                    }, 0));
                });
            })).then(arr => lodash.sum(arr));
        return { status: Status.ok, numWarnings: n }
    } catch (error) {
        return { status: Status.fail, numWarnings: 0 }
    }
});

connection.listen();


/**
 * 1. compile to srcmap-runtime
 * 2. mythril analysis and ReverseMap
 * 3. map output issues to source, return diagnostics
 */
export async function doAnalysis(docUri: string): Promise<PublishDiagnosticsParams[]> {
    let compileResult;
    let mythrilOutput;
    let idxMapping;
    try {
        compileResult = await new SolcCompiler().compile(docUri);
        mythrilOutput = await detectIssues(docUri);
        idxMapping = await findIdxMapping(docUri);
    } catch (error) {
        return Promise.reject(error);
    }
    const uriMap = mythrilOutput
        .map(m => toDiagnostic(m, compileResult, idxMapping))
        .reduce((prev, diag) => {
            const uri = diag.uri;
            const arr = prev[uri] || [];
            arr.push(diag.diagnostic);
            prev[uri] = arr;
            return prev;
        }, {});
    return Promise.resolve(Object.keys(uriMap).map(u => ({
        uri: u,
        diagnostics: uriMap[u]
    })));
}

function toDiagnostic(myth: MythrilOutput,
                      compileResult: CompileResult,
                      idxMapping: IdxMapping): { uri: string, diagnostic: Diagnostic } {
    const contract = myth.contract;
    const fileAnalyzed = myth.filePath;
    const srcIdx = idxMapping.map.get(myth.pcAddress);
    // NOTICE:
    // Right now we have some issue with tracking it back to imported files
    // need to further confirm this.
    const fileContract = `${fileAnalyzed}:${contract}`;
    const srcmap = compileResult.contracts[fileContract]['srcmap-runtime'];
    const docs = compileResult.sourceList.map(s => documents.get(Uri.file(s).toString()));
    const map = new SourceMap(docs, srcmap);
    const { uri, range } = map.findRange(srcIdx);
    return {
        uri: uri,
        diagnostic: {
            severity: DiagnosticSeverity.Warning,
            message: myth.description,
            range: range,
            source: 'mythril'
        }
    };
}
