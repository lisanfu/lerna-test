export interface ICommandSetting {
    cmdDesc: string;
    arguments?: string|null;
    argumentsDesc?: {[key:string]:string} |null;
    allowUnknownOptions?: boolean;
    options?: Array<[string, string?, (string|boolean)?]>|null;
    subCommands?: {[key:string]:ICommandSetting};
    helpTexts?: Array<{position: 'before'|'after'; text:string}>;
}

export interface IActionArgs {
    arguments:any[];
    options: {[key:string]:any};
    command: any;
    unexpectedOptions:{[key:string]:any}
}

export interface ICommandJSON {
    [key:string]:ICommandSetting;
}

//暴露用户配置的本地config
export interface ILocalConfig {
    isDebug: boolean;
    //本地开放模式
    isDev: boolean;
    //用于当前用户是否灰度用户
    isGayUser?: false;
    //是否强制升级
    forceUpdate:boolean;
    //在init命令时， 是否启用模糊查询模版名 开启后需要登录才能支持
    fuzzyTemp: boolean;
    useYarn: boolean;
    cmds?:{[key:string]:string}

}

export interface IStaticConfig {
    rootName: string;
    rcFileName: string;
    version: string;

    gitTemplateGroupURL: string;
    gitTemplateGroupQueryURL: string;
    gitQueryHeader: {[key:string]:any};
    npmRegistry: string;
    commands: ICommandJSON;
    remoteConfigUrl: string;
    helpTexts?: Array<{position: 'beforeAll'|'afterAll'; text:string}>;
    questions:{[key:string]:Array<{[key:string]:any}>};
    cli: {
        name: string;
        version: string;
        plugins?: Array<{name: string; version:string}>;
    };
    generator: {
        name: string,
        version?: string
    };
    cmds?: {[key:string]:string}
}

//依赖于静态config生成的config
export interface IDynamicConfig {
    virtualPath: {
        //虚拟目录存储路径
        entry: string;
        configPath: string;
        templatePath: string;
        nodeModulesPath: string;
    }
}

export interface IConfig extends ILocalConfig, IStaticConfig,IDynamicConfig{}