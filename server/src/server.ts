import {
    createConnection,
    IConnection,
    IPCMessageReader,
    IPCMessageWriter,
    RequestType,
    TextDocumentIdentifier,
    TextDocuments,
} from 'vscode-languageserver';

import { doAnalysis } from './analysis';

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

documents.onDidChangeContent(e => {
    log('onDidChangeContent');
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
    let activeDoc = documents.get(uri);
    let diagnostics = await doAnalysis(activeDoc);
    connection.sendDiagnostics({ uri, diagnostics });

    let result: ActiveAnalysisParams | undefined = undefined;
    return {
        documentVersion: 1
    };
});

connection.onRequest(MythrilRequest.all, async (params) => {
    let result: AllAnalysisParams | undefined = undefined;
    return {
        folderVersion: 1
    };
});

connection.listen();