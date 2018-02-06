export interface Solc {
    version: any,
    license: any,
    compile: (input: any, optimise: boolean, readCallback: any) => {
        contracts: any,
        sourceList: string[],
        sources: any
    },
    compileStandard: any,
    compileStandardWrapper: any,
    linkBytecode: any,
    supportsMulti: boolean,
    supportsImportCallback: boolean,
    supportsStandard: boolean,
    // Loads the compiler of the given version from the github repository
    // instead of from the local filesystem.
    loadRemoteVersion: (versionString, cb) => void,
    // Use this if you want to add wrapper functions around the pure module.
    setupMethods: any
}

export interface CompiledResult {
    runtimeBytecode: string,
    srcmapRuntime: string
}

export interface MythrilOutput {
    name: string,
    type: string,
    contract: string,
    functionName: string,
    pcAddress: number,
    description: string
}
