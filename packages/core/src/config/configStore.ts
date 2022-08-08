import merge from 'lodash.merge';
import clonedeep from 'lodash.clonedeep';
import set from 'lodash.set';
import compareVersions  from 'compare-versions';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { IConfig } from './interface';

class ConfigStore {
    config: IConfig;
    remoteConfigPath: string=path.resolve(__dirname, './remote-config.json');
    //运行时的config存储路径
    //在init后 讲获取初始化的config写入该路径 并全部从此处取值
    runTimeConfigPath:string = path.resolve();
    set(keyPath: Array<string|number>, value:any){
        set(this.config, keyPath,value);
        return this.config
    }

    getConfig() {
        return clonedeep(this.config);
    }

    /**
     * config 获取流程
     * 1. 获取项目中的default-config(传入的config)
     * 2. 获取用户虚拟目录下的config 如果不存在则默认为{}
     * 3. 与传入的默认config合并
     * 4. 异步执行 获取cdn 存放的config文件 通过版本号检查与项目中的config 是否匹配  不匹配则写入项目中作为remote-config.json
     * 
     * outerConfig 指的是从new Core传入的参数 进行进一步定制
     * 
     * 注意
     * 1. 异步获取远程config 仅在下次有效
     * 2. 优先级 虚拟目录>远程>初始化传入
     */
    init(defaultConfig:IConfig) {
        const remoteConfig = this.getSavedRemoteConfig() as IConfig;
        const localConfig = this.getLocalConfig(defaultConfig.virtualPath.configPath) as IConfig;
        this.config = merge({}, defaultConfig, remoteConfig, localConfig);
        this.remoteConfigOperation();
        return this;
    } 

    //获取远程config并写入本地
    async remoteConfigOperation() {
        const {remoteConfigUrl, version} = this.config;
        if(!remoteConfigUrl){
            return ;
        }

        try{
            const res = await axios.get(remoteConfigUrl);
            const remoteConfigJSON: {[key:string]:any} = res.data;

            //在项目中的config大于远程config 的version时，不会再本地存储
            if(compareVersions.compare(version, remoteConfigJSON.version, '>')){
                return;
            }
            await fs.writeJson(this.remoteConfigPath, remoteConfigJSON)
        }catch(e){

        }
    }

    //获取存在本地的远程config
    getSavedRemoteConfig=()=>{
        try{
            return require(this.remoteConfigPath)
        }catch(e){
            return {}
        }
    };

    //获取本地虚拟目录中config
    getLocalConfig=(localConfigPath:string) {
        try{
            return require(localConfigPath);
        }catch(e){
            return {}
        }
            
    }
} 

export default new ConfigStore();