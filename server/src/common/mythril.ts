import URI from 'vscode-uri';
import { Diagnostic, DiagnosticSeverity, TextDocument } from 'vscode-languageserver';
import { exec } from 'child_process';
import * as _ from 'lodash';
import {
    flow,
    split,
    map,
    compact,
    trim
} from 'lodash/fp';

export interface MythrilOutput {
    name: string,
    type: string,
    filePath: string, // filePath is only the file being analyzed
    contract: string,
    functionName: string,
    pcAddress: number,
    description: string
}

export function deserializeOutput(input: string, filePath: string): MythrilOutput[] {
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
                filePath: filePath,
                contract: getValue(lines[2]),
                functionName: getValue(lines[3]),
                pcAddress: Number.parseInt(getValue(lines[4])),
                description: lines.slice(5).join('\n'),
            };
            return ret;
        }),
        compact
    )(input);
}

// NOTICE: `myth -x -c xxx` will lose contract name and always show MAIN
const MYTH_COMMAND = 'myth';
export async function detectIssues(docUri: string): Promise<MythrilOutput[]> {
    return new Promise<MythrilOutput[]>((resolve, reject) => {
        const filePath = URI.parse(docUri).fsPath;
        exec(
            `${MYTH_COMMAND} -x ${filePath}`,
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
                resolve(deserializeOutput(stdout, filePath));
            },
        );
    }).then(arrays => _.flatten(arrays));
}

// disassembly has following format
// 0 PUSH1 0x60
// 2 PUSH1 0x40
// ...          =>  {0=>0,2=>1,...}
export interface IdxMapping {
    filePath: string,
    map: Map<number, number>
};
export async function findIdxMapping(docUri: string): Promise<IdxMapping> {
    return new Promise<IdxMapping>((resolve, reject) => {
        const filePath = URI.parse(docUri).fsPath;
        exec(
            `${MYTH_COMMAND} -d ${filePath}`,
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
                const map = stdout
                    .split('\n')
                    .map(l => Number.parseInt(l.split(' ')[0]))
                    .reduce((accumulator, value, idx) => {
                        return accumulator.set(value, idx);
                    }, new Map<number, number>());
                resolve({
                    filePath: filePath,
                    map: map
                });
            },
        );
    });
}
