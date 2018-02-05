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

export function deserializeOutput(input: string): MythrilOutput[] {
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
            const getValue = (value: string) => _.last(value.split(':')).trim();
            const ret = {
                name: lines[0].replace(/====/g, '').trim(),
                type: getValue(lines[1]),
                contract: getValue(lines[2]),
                functionName: getValue(lines[3]),
                pcAddress: getValue(lines[4]),
                description: lines.slice(5).join('\n'),
            };
            return ret;
        })
    )(input);
}

const MYTH_COMMAND = 'myth'
export async function detectIssues(bytecodes: string[]): Promise<MythrilOutput[]> {
    return new Promise<MythrilOutput[]>((resolve, reject) => {
        exec(
            `${MYTH_COMMAND} -x -c ${bytecodes.join(' ')}`,
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
                resolve(deserializeOutput(stdout));
            },
        );
    });
}
