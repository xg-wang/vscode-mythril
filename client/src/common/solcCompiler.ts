import * as path from 'path';
import * as _ from 'lodash';
import { CompiledResult, Solc } from './mythril.d';
import { TextDocument } from 'vscode';

export class SolcCompiler {

    private solc: Solc;

    constructor() {
        this.solc = require('solc');
    }

    compile(docs: TextDocument[]): {[key: string]: CompiledResult } {
        let sources: any = {};
        docs.filter(doc => path.extname(doc.fileName) === '.sol')
            .forEach(doc => {
                sources[doc.fileName] = doc.getText()
            });
        // TODO: use `compileStandardWrapper` instead
        const output = this.solc.compile({sources}, false, null);
        return _.mapValues(output.contracts, (value, key) => ({
            uri: docs.find(doc => doc.fileName.includes(_.head(key.split(':')))).uri,
            runtimeBytecode: value.runtimeBytecode,
            srcmapRuntime: value.srcmapRuntime
        }));
    }

}