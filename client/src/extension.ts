import * as path from 'path'
import { ExtensionContext, commands, window, workspace, TextEditor } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, State } from 'vscode-languageclient';
import { TextDocumentIdentifier, RequestType } from 'vscode-languageserver';

enum Status {
    ok = 1,
    fail
}
interface ActiveAnalysisParams {
    textDocument: TextDocumentIdentifier
}
interface ActiveAnalysisResult {
    status: Status;
}
interface AllAnalysisParams {
}
interface AllAnalysisResult {
    status: Status;
}
namespace MythrilRequest {
    export const active = new RequestType <
        ActiveAnalysisParams,
        ActiveAnalysisResult,
        void, void > ('textDocument/mythril/activeAnalyze');
    export const all = new RequestType <
        AllAnalysisParams,
        AllAnalysisResult,
        void, void > ('textDocument/mythril/allAnalyze');
}

export function activate(context: ExtensionContext) {
    let serverRunning: boolean = false;

    let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    let serverOptions: ServerOptions = {
        run : { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    }

    let clientOptions: LanguageClientOptions = {
        documentSelector: ['solidity'],
        synchronize: {
        	configurationSection: 'mythril'
        },
        diagnosticCollectionName: 'mythril'
    }

    let client = new LanguageClient('mythril', 'Solidity Security Server', serverOptions, clientOptions);


	const running = 'Mythril is running.';
	const stopped = 'Mythril has stopped.';

	client.onDidChangeState((event) => {
		if (event.newState === State.Running) {
			client.info(running);
			serverRunning = true;
		} else {
			client.info(stopped);
			serverRunning = false;
		}
	});

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

    async function analyzeAll() {
        try {
            let result = await client.sendRequest(MythrilRequest.all, { });
            console.log(result);
        } catch (error) {
            window.showErrorMessage('Failed to analyze Solidity files');
        }
    }

    context.subscriptions.push(
        client.start(),
        commands.registerTextEditorCommand('mythril.analyzeActive', analyzeActive),
        commands.registerCommand('mythril.analyzeAll', analyzeAll)
    );
}

export function deactivate() {
}
