import {IConfig} from './config';
import get from 'lodash.get';

//设置环境变量，仅供leo-util使用
//其它插件应当从市里话传参中获取相应数据

export default (config:IConfig) =>{
    const env= {
        //loadPkg的安装路径
        __NODEMODULEPATH: 'virtualPath.nodeModulesPath',
        //是否使用yarn
        __USEYARN: 'useYarn',
        //是否dev模式
        __ISDEV:'isDev',
        //是否debug模式
        __ISDEBUG: 'isDebug'
    }

    Object.entries(env).forEach((item)=>{
        const [key,path] = item;
        process.env[key] = get(config, path).toString();
    })
}