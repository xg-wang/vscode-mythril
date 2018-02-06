"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
function trace(message, verbose) {
    connection.tracer.log(message, verbose);
}
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let documents = new vscode_languageserver_1.TextDocuments();
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
    };
});
var MythrilRequest;
(function (MythrilRequest) {
    MythrilRequest.active = new vscode_languageserver_1.RequestType('textDocument/mythril/activeAnalyze');
    MythrilRequest.all = new vscode_languageserver_1.RequestType('textDocument/mythril/allAnalyze');
})(MythrilRequest || (MythrilRequest = {}));
connection.onRequest(MythrilRequest.active, (params) => __awaiter(this, void 0, void 0, function* () {
    const uri = params.textDocument.uri;
    trace(uri);
    let result = undefined;
    return {
        documentVersion: 1
    };
}));
connection.onRequest(MythrilRequest.all, (params) => __awaiter(this, void 0, void 0, function* () {
    let result = undefined;
    return {
        folderVersion: 1
    };
}));
connection.listen();
//# sourceMappingURL=server.js.map