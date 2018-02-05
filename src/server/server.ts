import {
    createConnection, IConnection,
    IPCMessageReader, IPCMessageWriter,
    TextDocuments, InitializeResult,
    Files, DiagnosticSeverity, Diagnostic,
    TextDocumentChangeEvent, TextDocumentPositionParams,
    CompletionItem, CompletionItemKind,
    Range, Position, Location, SignatureHelp, RequestType, TextDocumentIdentifier,
} from 'vscode-languageserver';

function trace(message: string, verbose?: string): void {
	connection.tracer.log(message, verbose);
}

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let documents: TextDocuments = new TextDocuments();

documents.onDidOpen(e => {
    trace('onDidOpen');
});

documents.onDidChangeContent(e => {
    trace('onDidChangeContent');
});

documents.onDidSave(e => {
    trace('onDidSave');
});

documents.onDidClose(e => {
    trace('onDidClose');
});

documents.listen(connection);

connection.onInitialize(params => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
        }
    }
});

interface ActiveAnalysisParams {
    textDocument: TextDocumentIdentifier
}
interface ActiveAnalysisResult {
    documentVersion: number;
}
interface AllAnalysisParams {
    textDocuments: TextDocumentIdentifier[]
}
interface AllAnalysisResult {
    folderVersion: number;
}
namespace MythrilRequest {
    export const active = new RequestType<
        ActiveAnalysisParams,
        ActiveAnalysisResult,
        void, void>('textDocument/mythril/activeAnalyze');
    export const all = new RequestType<
        AllAnalysisParams,
        AllAnalysisResult,
        void, void>('textDocument/mythril/allAnalyze');
}

connection.onRequest(MythrilRequest.active, async (params) => {
    const uri = params.textDocument.uri;
    trace(uri)
    console.log(uri)
    let result: ActiveAnalysisParams | undefined = undefined;
    return {documentVersion: 1};
});

connection.onRequest(MythrilRequest.all, async (params) => {
    let result: AllAnalysisParams | undefined = undefined;
    return {folderVersion: 1};
});

connection.listen();
