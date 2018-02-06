import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { MythrilOutput } from './mythril.d';
import { exec } from 'child_process';
import * as _ from 'lodash';
import {
    flow,
    split,
    map,
    compact,
    trim
} from 'lodash/fp';

export function deserializeOutput(input: string, contract?: string): MythrilOutput[] {
    const separator = '--------------------';
    if (!input || !_.includes(input, separator)) {
        return [];
    }

    return flow(
        split(separator),
        map(trim),
        compact,
        map((str) => {
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
            const getValue = (value: string) => _.last(value.split(':')).trim();
            const ret = {
                name: lines[0].replace(/====/g, '').trim(),
                type: getValue(lines[1]),
                contract: contract, // getValue(lines[2]) is always MAIN if using bytecode
                functionName: getValue(lines[3]),
                pcAddress: Number.parseInt(getValue(lines[4])),
                description: lines.slice(5).join('\n'),
            };
            return ret;
        }),
        compact
    )(input);
}

// NOTICE: `myth -x -c xxx` will lose contract name and always show MAIN,
// maybe ask user to install solc and `myth -x xxx.sol` would be easier?
const MYTH_COMMAND = 'myth';
export async function detectIssues(bytecodes: {[contract: string]: string}): Promise<MythrilOutput[]> {
    return Promise.all(_.values(_.mapValues(bytecodes,
        (bin, contract) => new Promise<MythrilOutput[]>((resolve, reject) => {
            exec(
                `${MYTH_COMMAND} -x -c ${bin}`,
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                `An error occurred when running myth.
    Output: ${stdout}
    Error Output: ${stderr}`,
                            ),
                        );
                        return;
                    }
                    resolve(deserializeOutput(stdout, contract));
                },
            );
        })))
    ).then(arrays => _.flatten(arrays));
}

// disassembly has following format
// 0 PUSH1 0x60
// 2 PUSH1 0x40
// ...
export type IdxMapping = {
    [contract: string]: Map<number, number>
};
export async function findIdxMapping(bytecodes: {[contract: string]: string}): Promise<IdxMapping> {
    return Promise.all(_.values(_.mapValues(bytecodes,
        (bin, contract) => new Promise<{contract: string, map: Map<number, number>}>((resolve, reject) => {
            exec(
                `${MYTH_COMMAND} -d -c ${bin}`,
                (err, stdout, stderr) => {
                    if (err) {
                        reject(
                            new Error(
                                `An error occurred when running myth.
    Output: ${stdout}
    Error Output: ${stderr}`,
                            ),
                        );
                        return;
                    }
                    let map = new Map<number, number>();
                    let disassembly = stdout
                        .split('\n')
                        .map(l => Number.parseInt(l.split(' ')[0]))
                        .forEach((value, idx) => map.set(value, idx));
                    resolve({contract: contract, map: map});
                },
            );
        })))
    ).then(mapsArray => {
        return _.reduce(mapsArray, (result, value, key) => {
            result[value.contract] = value.map;
            return result;
        }, {});
    });
}
