import {IConfig} from './config';
import {IRC} from './defaultRC';

export interface ILeoCaller {
    start:()=>Promise<any>;
    [key:string]:any;
}

export interface iBuilder extends ILeoCaller {
    build: ()=>Promise<any>;
}

export interface IVirtualPath {
    entry:string;
    configPath: string;
    templatePath: string;
    nodeModulesPath: string;
}

export interface ICommonParams {
    leoConfig: IConfig;
    leoRC: IRC;
    leoUtils:{},
    pkg?:{[key:string]:any}
}