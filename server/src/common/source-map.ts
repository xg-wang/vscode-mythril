import * as _ from 'lodash';
import { Range, Position, TextDocument } from "vscode-languageserver";

export class SourceMap {

    private sourceList: TextDocument[];
    private srcmap: string[];

    constructor(docs: TextDocument[], srcMap: string) {
        this.sourceList = docs;
        this.srcmap = srcMap.split(';');
    }

    // http://solidity.readthedocs.io/en/develop/miscellaneous.html#source-mappings
    public findRange(idx: number): { uri: string, range: Range } {
        let start: number = NaN, len: number = NaN, fileIdx = NaN;
        while (isNaN(start) || isNaN(len) || isNaN(fileIdx)) {
            idx = _.findLastIndex(this.srcmap, s => {
                let mapping = s.split(':');
                start = start || Number.parseInt(mapping[0]);
                if (mapping.length > 1) {
                    len = len || Number.parseInt(mapping[1]);
                }
                if (mapping.length > 2) {
                    fileIdx = fileIdx || Number.parseInt(mapping[2]);
                }
                return !isNaN(start) && !isNaN(len) && !isNaN(fileIdx);
            }, idx);
        }
        return {
            uri: this.sourceList[fileIdx].uri,
            range: {
                start: this.sourceList[fileIdx].positionAt(start),
                end:   this.sourceList[fileIdx].positionAt(start + len)
            }
        };
    }

}