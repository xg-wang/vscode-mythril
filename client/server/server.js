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
const lodash = require("lodash");
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_2 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const mythril_1 = require("./common/mythril");
const solc_compiler_1 = require("./common/solc-compiler");
const source_map_1 = require("./common/source-map");
const connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
function log(message) {
    connection.console.log(message);
}
exports.log = log;
function error(message) {
    connection.console.error(message);
}
exports.error = error;
const documents = new vscode_languageserver_1.TextDocuments();
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
let rootPath;
connection.onInitialize(params => {
    rootPath = params.rootPath;
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
        }
    };
});
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["fail"] = 2] = "fail";
})(Status || (Status = {}));
var MythrilRequest;
(function (MythrilRequest) {
    MythrilRequest.active = new vscode_languageserver_1.RequestType('textDocument/mythril/activeAnalyze');
    MythrilRequest.all = new vscode_languageserver_1.RequestType('textDocument/mythril/allAnalyze');
})(MythrilRequest || (MythrilRequest = {}));
connection.onRequest(MythrilRequest.active, (params) => __awaiter(this, void 0, void 0, function* () {
    const uri = params.textDocument.uri;
    const activeDoc = documents.get(uri);
    try {
        const diagnostics = yield doAnalysis(activeDoc.uri);
        diagnostics.forEach(d => connection.sendDiagnostics(d));
        const n = diagnostics.reduce((acc, d) => {
            return acc + d.diagnostics.length;
        }, 0);
        return { status: Status.ok, numWarnings: n };
    }
    catch (error) {
        return { status: Status.fail, numWarnings: 0 };
    }
}));
connection.onRequest(MythrilRequest.all, (params) => __awaiter(this, void 0, void 0, function* () {
    const files = [];
    // fs.readdirSync(rootPath)
    // .map(f => Uri.file(path.join(rootPath, f)).toString());
    // TODO: documents can only handle opened files.
    try {
        const docs = lodash.union(files, documents.all().map(d => d.uri))
            .filter(doc => path.extname(doc) === '.sol');
        const n = yield Promise.all(docs.map(docUri => {
            return doAnalysis(docUri).then(diagnostics => {
                diagnostics.forEach(d => connection.sendDiagnostics(d));
                return Promise.resolve(diagnostics.reduce((acc, d) => {
                    return acc + d.diagnostics.length;
                }, 0));
            });
        })).then(arr => lodash.sum(arr));
        return { status: Status.ok, numWarnings: n };
    }
    catch (error) {
        return { status: Status.fail, numWarnings: 0 };
    }
}));
connection.listen();
/**
 * 1. compile to srcmap-runtime
 * 2. mythril analysis and ReverseMap
 * 3. map output issues to source, return diagnostics
 */
function doAnalysis(docUri) {
    return __awaiter(this, void 0, void 0, function* () {
        let compileResult;
        let mythrilOutput;
        let idxMapping;
        try {
            compileResult = yield new solc_compiler_1.SolcCompiler().compile(docUri);
            mythrilOutput = yield mythril_1.detectIssues(docUri);
            idxMapping = yield mythril_1.findIdxMapping(docUri);
        }
        catch (error) {
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
    });
}
exports.doAnalysis = doAnalysis;
function toDiagnostic(myth, compileResult, idxMapping) {
    const contract = myth.contract;
    const fileAnalyzed = myth.filePath;
    const srcIdx = idxMapping.map.get(myth.pcAddress);
    // NOTICE:
    // Right now we have some issue with tracking it back to imported files
    // need to further confirm this.
    const fileContract = `${fileAnalyzed}:${contract}`;
    const srcmap = compileResult.contracts[fileContract]['srcmap-runtime'];
    const docs = compileResult.sourceList.map(s => documents.get(vscode_uri_1.default.file(s).toString()));
    const map = new source_map_1.SourceMap(docs, srcmap);
    const { uri, range } = map.findRange(srcIdx);
    return {
        uri: uri,
        diagnostic: {
            severity: vscode_languageserver_2.DiagnosticSeverity.Warning,
            message: myth.description,
            range: range,
            source: 'mythril'
        }
    };
}
//# sourceMappingURL=server.js.map