import * as _ from 'lodash';
import { Range, Position, TextDocument } from "vscode-languageserver";

export class SourceMap {

    // TODO: only supports single file
    private doc: TextDocument;
    private srcMaps: {[contract: string]: string};

    constructor(doc: TextDocument, srcMaps: {[fileContract: string]: string}) {
        this.doc = doc;
        this.srcMaps = _.mapKeys(srcMaps, (v, k) => _.last(k.split(':')));
    }

    // http://solidity.readthedocs.io/en/develop/miscellaneous.html#source-mappings
    public toRange(contract: string, idx: number): Range {
        contract = _.last(contract.split(':'));
        let srcmap = this.srcMaps[contract].split(';');
        let start: number = NaN, len: number = NaN;
        while (isNaN(start) || isNaN(len)) {
            idx = _.findLastIndex(srcmap, s => {
                let mapping = s.split(':');
                start = start || Number.parseInt(mapping[0]);
                if (mapping.length > 1) {
                    len = len || Number.parseInt(mapping[1]);
                }
                return !isNaN(start) && !isNaN(len);
            }, idx);
        }
        return {
            start: this.doc.positionAt(start),
            end:   this.doc.positionAt(start + len)
        };
    }

}