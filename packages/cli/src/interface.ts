export interface ICommandSettingAlone {
    cmdDesc: string;
    arguments: string|null;
    argumentsDesc: {[key:string]:string}|null;
    allowUnknowOption: boolean;
    options: Array<[string, string?,(string|boolean)?]>|null;
    subCommands: {[key:string]:ICommandSettingAlone};
    helpTexts?: Array<{position:'before'|'after'; text:string}>;

    action?: (params:{args:IActionArgs;subCommandName:string})=>void;
}

export interface ICommandSettings {
    [key:string]:ICommandSettingAlone;
}

export interface IActionArgs {
    arguments: any[];
    options: {[key:string]:any};
    command: any;
    unexpectedOptions: {[key:string]:any}
}

export interface IextendsCommands extends ICommandSettingAlone{
    helpTexts?: Array<{position:'before'|'after'; text:string}>
}