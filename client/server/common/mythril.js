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
const vscode_uri_1 = require("vscode-uri");
const child_process_1 = require("child_process");
const _ = require("lodash");
const fp_1 = require("lodash/fp");
function deserializeOutput(input, filePath) {
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
        if (lines.length < 6) {
            return null;
        }
        const getValue = (value) => _.last(value.split(':')).trim();
        const ret = {
            name: lines[0].replace(/====/g, '').trim(),
            type: getValue(lines[1]),
            filePath: filePath,
            contract: getValue(lines[2]),
            functionName: getValue(lines[3]),
            pcAddress: Number.parseInt(getValue(lines[4])),
            description: lines.slice(5).join('\n'),
        };
        return ret;
    }), fp_1.compact)(input);
}
exports.deserializeOutput = deserializeOutput;
// NOTICE: `myth -x -c xxx` will lose contract name and always show MAIN
const MYTH_COMMAND = 'myth';
function detectIssues(docUri) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const filePath = vscode_uri_1.default.parse(docUri).fsPath;
            child_process_1.exec(`${MYTH_COMMAND} -x ${filePath}`, (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(`An error occurred when running myth.
    Output: ${stdout}
    Error Output: ${stderr}`));
                    return;
                }
                resolve(deserializeOutput(stdout, filePath));
            });
        }).then(arrays => _.flatten(arrays));
    });
}
exports.detectIssues = detectIssues;
;
function findIdxMapping(docUri) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const filePath = vscode_uri_1.default.parse(docUri).fsPath;
            child_process_1.exec(`${MYTH_COMMAND} -d ${filePath}`, (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(`An error occurred when running myth.
    Output: ${stdout}
    Error Output: ${stderr}`));
                    return;
                }
                const map = stdout
                    .split('\n')
                    .map(l => Number.parseInt(l.split(' ')[0]))
                    .reduce((accumulator, value, idx) => {
                    return accumulator.set(value, idx);
                }, new Map());
                resolve({
                    filePath: filePath,
                    map: map
                });
            });
        });
    });
}
exports.findIdxMapping = findIdxMapping;
//# sourceMappingURL=mythril.js.map