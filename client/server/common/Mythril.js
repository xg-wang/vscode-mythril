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
const child_process_1 = require("child_process");
const _ = require("lodash");
const fp_1 = require("lodash/fp");
function deserializeOutput(input) {
    const separator = '--------------------';
    if (!input || !_.includes(input, separator)) {
        return [];
    }
    return fp_1.flow(fp_1.split(separator), fp_1.map(fp_1.trim), fp_1.compact, fp_1.map((str) => {
        const lines = str.split('\n');
        // there can be warnings like 'No signature database found.'
        // Drop all lines until it starts with '===='
        // eslint-disable-next-line no-restricted-syntax
        while (lines.length && !/====/.test(lines[0])) {
            lines.shift();
        }
        const getValue = (value) => _.last(value.split(':')).trim();
        const ret = {
            name: lines[0].replace(/====/g, '').trim(),
            type: getValue(lines[1]),
            contract: getValue(lines[2]),
            functionName: getValue(lines[3]),
            pcAddress: getValue(lines[4]),
            description: lines.slice(5).join('\n'),
        };
        return ret;
    }))(input);
}
exports.deserializeOutput = deserializeOutput;
const MYTH_COMMAND = 'myth';
function detectIssues(bytecodes) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            child_process_1.exec(`${MYTH_COMMAND} -x -c ${bytecodes.join(' ')}`, (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(`An error occurred when running myth.
Output: ${stdout}
Error Output: ${stderr}`));
                    return;
                }
                resolve(deserializeOutput(stdout));
            });
        });
    });
}
exports.detectIssues = detectIssues;
//# sourceMappingURL=Mythril.js.map