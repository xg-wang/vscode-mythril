import { MythrilOutput } from './common/mythril.d';
import * as _ from 'lodash';
import { SolcCompiler } from './common/solc-compiler';
import { TextDocument, Diagnostic, DiagnosticSeverity, Range, Position } from "vscode-languageserver";
import { detectIssues, findIdxMapping, IdxMapping } from './common/mythril';
import { SourceMap } from './common/source-map';

/**
 * 1. compile to runtimeBytecode and srcmapRuntime
 * 2. mythril analyze runtimeBytecode to output
 * 3. srcmapRuntime to SourceMap
 * 4. map output issues to source, return diagnostics
 */
export async function doAnalysis(doc: TextDocument): Promise<Diagnostic[]> {
    const compiler = new SolcCompiler();
    const compiledResult = compiler.compile(doc.uri, doc.getText());
    const byteCodes = _.mapValues(compiledResult, r => r.runtimeBytecode);
    const mythrilOutput = await detectIssues(byteCodes);
    const idxMappings = await findIdxMapping(byteCodes);
    const sourceMap = new SourceMap(doc, _.mapValues(compiledResult, r => r.srcmapRuntime));
    return _.compact(mythrilOutput.map(m => toDiagnostic(m, sourceMap, idxMappings)));
}

function toDiagnostic(myth: MythrilOutput, sourceMap: SourceMap, idxMappings: IdxMapping): Diagnostic {
    let map = idxMappings[myth.contract] || new Map<number, number>();
    return {
        severity: DiagnosticSeverity.Warning,
        message: myth.description,
        range: sourceMap.toRange(myth.contract, map.get(myth.pcAddress) || 0),
        source: 'mythril'
    };
}
