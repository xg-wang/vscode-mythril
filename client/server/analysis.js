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
const _ = require("lodash");
const solcCompiler_1 = require("./common/solcCompiler");
const vscode_languageserver_1 = require("vscode-languageserver");
const Mythril_1 = require("./common/Mythril");
/**
 * 1. compile to runtimeBytecode and srcmapRuntime
 * 2. mythril analyze runtimeBytecode to output
 * 3. srcmapRuntime to SourceMap
 * 4. map output issues to source, return diagnostics
 */
function doAnalysis(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new solcCompiler_1.SolcCompiler();
        const compiledResult = compiler.compile(doc.uri, doc.getText());
        const mythrilOutput = yield Mythril_1.detectIssues(_.values(_.mapValues(compiledResult, r => r.runtimeBytecode)));
        return mythrilOutput.map(m => toDiagnostic(m, doc));
    });
}
exports.doAnalysis = doAnalysis;
function toDiagnostic(myth, doc) {
    return {
        severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
        message: myth.description,
        range: toRange(myth.pcAddress),
        source: 'mythril'
    };
}
function toRange(pcAddress) {
    return vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(0, 0), vscode_languageserver_1.Position.create(0, 0));
}
//# sourceMappingURL=analysis.js.map