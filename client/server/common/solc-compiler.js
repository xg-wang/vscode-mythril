"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_uri_1 = require("vscode-uri");
const child_process_1 = require("child_process");
const SOLC_COMMAND = 'solc';
class SolcCompiler {
    constructor() {
    }
    parseResult(input) {
        return JSON.parse(input.substr(input.indexOf(`{"contracts":`)));
    }
    compile(docUri) {
        const filePath = vscode_uri_1.default.parse(docUri).fsPath;
        return new Promise((resolve, reject) => {
            child_process_1.exec(`${SOLC_COMMAND} --combined-json srcmap-runtime ${filePath}`, (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(`An error occurred when running myth.
    Output: ${stdout}
    Error Output: ${stderr}`));
                }
                resolve(this.parseResult(stdout));
            });
        });
    }
}
exports.SolcCompiler = SolcCompiler;
/** example:
{
    "contracts":{
        "/Users/xgwang/Workspace/playground/JavaScript/testsolc/weak.sol:StringRandom":{
            "srcmap-runtime":"26:1390:0:-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;432:14;548:15;449:9;432:26;;469:231;208:2;157:9;254:20;;;;;;;;476:9;:27;;:56;;;;;208:2;507:10;;:25;476:56;469:231;;;566:10;;:12;;;;;;;;;;;;548:30;;618;;;;;;;;;629:10;618:30;;;;;;641:6;;618:30;;;592:11;:23;604:10;592:23;;;;;;;;;;;:56;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;208:2;157:9;254:20;;;;;;;;662:27;;;;469:231;;;208:2;714:10;;:26;710:71;;;756:14;:12;:14::i;:::-;710:71;843:1;831:9;:13;827:74;;;860:10;:19;;:30;880:9;860:30;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;827:74;395:512;;26:1390;309:26;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;281:22;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;172:38;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;341:47;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;128:38;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;216:58;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;913:501;955:13;1034;1109:10;1148:16;1208:18;1268:22;971:11;:48;208:2;988:14;983:20;;:35;;;;;;;;971:48;;;;;;;;;;;:53;;;;;;;;;;;;955:69;;1050:11;:44;208:2;1067:10;1062:16;;:31;;;;;;;;1050:44;;;;;;;;;;;:49;;;;;;;;;;;;1034:65;;1122:16;1109:29;;1177:5;1184;1191;1167:30;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1148:49;;208:2;1234:8;1229:14;;;:29;;;;;;;;1208:50;;1293:11;:26;1305:13;1293:26;;;;;;;;;;;:31;;;;;;;;;;;;1268:56;;1335:6;;:8;;;;;;;;;;;;;1366:1;1353:10;:14;;;;1377;:23;;:30;157:9;1377:30;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;913:501;;;;;;:::o;309:26::-;;;;:::o;281:22::-;;;;:::o;172:38::-;208:2;172:38;:::o;341:47::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;128:38::-;157:9;128:38;:::o;216:58::-;208:2;157:9;254:20;;;;;;;;216:58;:::o"
        }
    },
    "sourceList":["/Users/xgwang/Workspace/playground/JavaScript/testsolc/weak.sol"],
    "version":"0.4.19+commit.c4cbbb05"
}
 */ 
//# sourceMappingURL=solc-compiler.js.map