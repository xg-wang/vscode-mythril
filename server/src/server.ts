import * as path from 'path';
import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    RequestType,
    TextDocumentIdentifier,
    TextDocuments,
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
    log('onDidOpen');
});

/**
 * Clear diagnostics once we start editing
 */
documents.onDidChangeContent(e => {
    log('onDidChangeContent');
    connection.sendDiagnostics({
        uri: e.document.uri,
        diagnostics: []
    });
});

documents.onDidSave(e => {
    log('onDidSave');
});

documents.onDidClose(e => {
    log('onDidClose');
});

documents.listen(connection);

connection.onInitialize(params => {
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
}
interface AllAnalysisParams {
}
interface AllAnalysisResult {
    status: Status;
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
        const diagnostics = await doAnalysis(activeDoc);
        diagnostics.forEach(d => connection.sendDiagnostics(d));
        return { status: Status.ok }
    } catch (error) {
        error(error);
        return { status: Status.fail }
    }
});

connection.onRequest(MythrilRequest.all, async (params) => {
    try {
        documents.all()
            .filter(doc => path.extname(doc.uri) === '.sol')
            .map(async doc => {
                const uri = doc.uri;
                const diagnostics = await doAnalysis(doc);
                diagnostics.forEach(d => connection.sendDiagnostics(d));
            });
        return { status: Status.ok }
    } catch (error) {
        return { status: Status.fail }
    }

});

connection.listen();


/**
 * 1. compile to srcmap-runtime
 * 2. mythril analysis and ReverseMap
 * 3. map output issues to source, return diagnostics
 */
export async function doAnalysis(doc: TextDocument): Promise<PublishDiagnosticsParams[]> {
    let compileResult;
    let mythrilOutput;
    let idxMapping;
    try {
        compileResult = await new SolcCompiler().compile(doc);
        mythrilOutput = await detectIssues(doc);
        idxMapping = await findIdxMapping(doc);
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
