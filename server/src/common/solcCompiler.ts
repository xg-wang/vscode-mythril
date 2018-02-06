import * as path from 'path';
import * as _ from 'lodash';
import { CompiledResult, Solc } from './mythril.d';
import { TextDocument } from 'vscode-languageserver';

export class SolcCompiler {

    private solc: Solc;

    constructor() {
        this.solc = require('solc');
    }

    compile(name: string, content: string): {[key: string]: CompiledResult } {
        let sources: any = {};
        sources[name] = content;
        // TODO: use `compileStandardWrapper` instead
        const output = this.solc.compile({ sources }, false, null);
        return _.mapValues(output.contracts, value => ({
            runtimeBytecode: value.runtimeBytecode,
            srcmapRuntime: value.srcmapRuntime
        }));
    }

}