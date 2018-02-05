import * as path from 'path'
import { ExtensionContext, commands, window, workspace, TextEditor } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { TextDocumentIdentifier, RequestType } from 'vscode-languageserver/lib/main';

interface ActiveAnalysisParams {
    readonly textDocument: TextDocumentIdentifier
}
interface ActiveAnalysisResult {
    readonly documentVersion: number;
}
interface AllAnalysisParams {
    readonly textDocuments: TextDocumentIdentifier[]
}
interface AllAnalysisResult {
    readonly folderVersion: number;
}
namespace MythrilRequest {
    export const active = new RequestType<
        ActiveAnalysisParams,
        ActiveAnalysisResult,
        void, void>('textDocument/mythril/activeAnalyze');
    export const all = new RequestType<
        AllAnalysisParams,
        AllAnalysisResult,
        void, void>('textDocument/mythril/allAnalyze');
}

export function activate(context: ExtensionContext) {

    console.log(path.join(__dirname, 'server', 'server.js'))
    let serverModule = path.join(__dirname, 'server', 'server.js');
    let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

    let serverOptions: ServerOptions = {
        run : { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    }

    let clientOptions: LanguageClientOptions = {
        documentSelector: ['solidity'],
        synchronize: {
        	configurationSection: 'mythril',
        	fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        },
        diagnosticCollectionName: 'mythril'
    }

    let client = new LanguageClient('mythril', 'Solidity Security Server', serverOptions, clientOptions);

    async function analyzeActive(editor: TextEditor) {
        if (path.extname(editor.document.fileName) !== '.sol') {
            window.showWarningMessage('Open a Solidity file to analyze');
            return;
        }
        const uri = editor.document.uri.toString();
        try {
            let result = await client.sendRequest(MythrilRequest.active, { textDocument: {uri} });
            console.log(result);
            // TODO: if return value exists, open a new tab
        } catch (error) {
            window.showErrorMessage('Failed to analyze Solidity file');
        }
    }

    function analyzeAll() {
    }

    context.subscriptions.push(
        client.start(),
        commands.registerTextEditorCommand('mythril.analyzeActive', analyzeActive),
        commands.registerCommand('mythril.analyzeAll', analyzeAll)
    );
}

export function deactivate() {
}
