import * as path from 'path'
import { ExtensionContext, commands, window, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { analyzeActive, analyzeAll } from './commands';

export function activate(context: ExtensionContext) {

    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join(__dirname, 'server', 'server.js'));
    // The debug options for the server
    let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run : { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    }

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{scheme: 'file', language: 'solidity'}],
        // synchronize: {
        // 	configurationSection: 'solsec',
        // 	fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        // }
        diagnosticCollectionName: 'solsec'
    }

    // Create the language client and start the client.
    let client = new LanguageClient('solsec', 'Solidity Security Server', serverOptions, clientOptions);

    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(
        client.start(),
        commands.registerCommand('solsec.analyzeActive', analyzeActive),
        commands.registerCommand('solsec.analyzeAll', analyzeAll)
    );
}

export function deactivate() {
}
