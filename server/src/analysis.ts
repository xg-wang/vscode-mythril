import { MythrilOutput } from './common/mythril.d';
import * as _ from 'lodash';
import { SolcCompiler } from './common/solcCompiler';
import { TextDocument, Diagnostic, DiagnosticSeverity, Range, Position } from "vscode-languageserver";
import { detectIssues } from './common/Mythril';

/**
 * 1. compile to runtimeBytecode and srcmapRuntime
 * 2. mythril analyze runtimeBytecode to output
 * 3. srcmapRuntime to SourceMap
 * 4. map output issues to source, return diagnostics
 */
export async function doAnalysis(doc: TextDocument): Promise<Diagnostic[]> {
    const compiler = new SolcCompiler();
    const compiledResult = compiler.compile(doc.uri, doc.getText());
    const mythrilOutput = await detectIssues(_.values(_.mapValues(compiledResult, r => r.runtimeBytecode)));
    return mythrilOutput.map(m => toDiagnostic(m, doc));
}

function toDiagnostic(myth: MythrilOutput, doc: TextDocument): Diagnostic {
    return {
        severity: DiagnosticSeverity.Warning,
        message: myth.description,
        range: toRange(myth.pcAddress),
        source: 'mythril'
    };
}

function toRange(pcAddress: number): Range {
    return Range.create(Position.create(0,0), Position.create(0,0));
}