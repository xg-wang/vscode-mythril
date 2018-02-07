# mythril README

## Usage

1. install Mythril: `pip3 install mythril`
2. install [`solc`](https://solidity.readthedocs.io/en/develop/installing-solidity.html#binary-packages)

```plaintext
{
    "command": "mythril.analyzeActive",
    "title": "Mythril: Analyze active Solidity contract"
},
{
    "command": "mythril.analyzeAll",
    "title": "Mythril: Analyze all Solidity contracts"
}
```

## Screenshot

![screenshot](https://raw.githubusercontent.com/xg-wang/vscode-mythril/master/screenshot.png)

## Feature

- Visual Studio Code extension for [Mythril](https://github.com/ConsenSys/mythril), security analysis tool for Ethereum smart contracts.
- Analyze current active solidity file or all opened solidity files.
- Code diagnostics on all source file lines.
- Handles imported contracts.

## How to local dev

- `npm install` to initialize the extension and the server
- `npm run compile` to compile the extension and the server
- open this folder in VS Code. In the Debug viewlet, run 'Launch Client' from drop-down to launch the extension and attach to the extension.
- to debug the server use the 'Attach to Server' launch config.
- set breakpoints in the client or the server.

## TODO

- add configurations
- open new tab with DocLink? needs discussion
- status bar
- analyzing animation
- icon
- exception handling, e.g., if user don't have `solc`, `myth` installed.

## Issues

- when analyzing multiple files, there is a chance the `~/.mythril/signatures.json` gets corrupted due to it can't handle parallelism.
- the extra side view could not be diagnosed, should come up with a better design for displaying, might take some discussion.
- Can only handle opened multiple files, as the `documents` object in server only have access to the opened ones.