"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class SolcCompiler {
    constructor() {
        this.solc = require('solc');
    }
    compile(name, content) {
        let sources = {};
        sources[name] = content;
        // TODO: use `compileStandardWrapper` instead
        const output = this.solc.compile({ sources }, false, null);
        return _.mapValues(output.contracts, value => ({
            runtimeBytecode: value.runtimeBytecode,
            srcmapRuntime: value.srcmapRuntime
        }));
    }
}
exports.SolcCompiler = SolcCompiler;
//# sourceMappingURL=solcCompiler.js.map