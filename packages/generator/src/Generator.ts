import merge from 'lodash.merge';
import get from 'lodash.get';
import fs from 'fs-extra';

import Metalsmith from 'metalsmith';
import inquirer from 'inquirer';

import match, { filter } from 'minimatch';
import consolidate from 'consolidate';
import Handlebars from 'handlebars';

import multimatch from 'multimatch';
import simpleGit from 'simple-git';
import {IFiles, IMetaData, IFilterFilesMap, IHelper} from './interface'
import {log as testLog} from '@lerna-test/utils'
import { down } from 'inquirer/lib/utils/readline';

const log = testLog.scope('generator');

//这个没有@type发布接口
const downloadGitRepo = require('download-git-repo');

type metalsmithCB = (files:IFiles, metalsmith: Metalsmith,done:Function);

class Generator {
    //虚拟目录路径 在linux 中一般都是～/.leo/template
    cachePath: string;
    //~/.leo/templates/${templateName}
    localTemplatePath: string;

    //远程模版地址
    repoRemoteAddress: string;

    //当前虚拟目录模版下的template文件夹
    currentTemplatePath: string;
    // 当前虚拟目录模板下的meta.js
    currentMetaPath: string;

    templateName: string;

    projectName: string;
    projectPath: string;

    answer: Record<string,any>;
    officialEnv: Record<string,any>;
    metalsmith: Metalsmith;

    //默认编译文件
    defaultCompileFiles: string[];

    leoRC: {[key:string]:any};

    leoConfig: {[key:string]:any};
    metaConfig: {[key:string]:any}|null;

    hooks: {
        //返回true接管构建任务 不再执行原有逻辑 发在下载模版完成后
        beforeGenerate: null|((generator: Generator)=>Promise<boolean>);
        afterGenerate: null|((generator:Generator)=>Promise<void>);

        /**
         * 渲染占位符的hook 如果实现讲自己接管渲染占位符
         */
        renderTemplatePlaceholder:null|((
            generator: Generator,
        )=>(files: IFiles, metalsmith:Metalsmith,done: Function)=>void);

        renderTamplateFile:null|((
            generator: Generator
        )=>(files:IFiles, metalsmith: Metalsmith, done: Function)=>void);

    } = {
        beforeGenerate:null,
        afterGenerate: null,
        renderTamplateFile: null,
        renderTemplatePlaceholder:null
    };

    options: {
        useCache: false,
        repo: ''
    }

    constructor(params: {
        templateName: string;
        projectName: string;
        leoCOnfig: {[key:string]:any};
        options: {[key:string]:any};
        cachePath: string
    }) {
        this.templateName = params.templateName;
        this.projectName = params.projectName;
        this.cachePath = params.cachePath;
        this.leoConfig = params.leoCOnfig;
        //模版的git地址
        this.repoRemoteAddress = `${this.leoConfig.gitTemplateGroupURL}/${this.templateName}-template.git`;

        //本地模版地址
        this.localTemplatePath = `${this.cachePath}/${this.templateName}-template`;

        this.currentTemplatePath = `${this.localTemplatePath}/template`;

        this.currentMetaPath = `${this.localTemplatePath}/meta.js`;

        this.defaultCompileFiles = ['package.json', this.leoConfig.rcFileName];

        this.answer = [];
        this.officialEnv = {};
        this.metalsmith = null;

        //合并命令行设置参数
        this.options = merge({}, this.options, params.options);

    }

    async start() {
        try{
            await this.prepare();

            this.answer = await this.askQuestions(get(this.metaConfig, 'prompts', []));

            this.officialEnv = await this.getGeneratorEnv();
            
            //若beforeGenerate为true 直接返回 相当于模版自己接管
            if(this.hooks.beforeGenerate && (await this.hooks.beforeGenerate(this) === true)) {
                return;
            }

            await this.generate();
            await this.initGitRepo(this.options.repo);

            //构建结束之后执行afterGenerate
        }catch(e){

        }

    }

    async getGeneratorEnv(): Promise<{[key:string]:any}> {
        return {
            $projectName: this.projectName
        }
    }

    async prepare() {
        const isUseCache = await this.useLocalCacheTemplate();

        if(!isUseCache) {
            await this.downloadTemplate();
        }
        //判断是否有template的文件夹
        const hasCurTemplateFolder = await fs.pathExists(this.currentTemplatePath);

        if(!hasCurTemplateFolder) {
            throw new Error('模版不存在tempalte目录')
        }

        const projectPath = `${process.cwd()}/${this.projectName}`;
        const currentHasProject = await fs.pathExists(projectPath);

        if(this.leoConfig.isDebugger){
            log.debug('generator.start', 'projectPath:', projectPath);
        }
        if(currentHasProject) {
            throw new Error('当前目录下已存在相同目录名')
        }

        this.projectPath = projectPath;

        //不在获取leorc 改为获取模版的meta.js的配置
        this.metaConfig = await this.getTemplateMetaConfig();

        merge(this.hooks, get(this.metaConfig, 'hooks', {}))
    }

    async generate():Promise<any> {
        this.metalsmith = Metalsmith(this.currentTemplatePath);
        //获取并注册用户的自定义handlebars的helper函数
        const customHelpers = get(this.metaConfig, 'helpers', {});

        if(Object.keys(customHelpers).length>0) {
            this.registerCustomHelper(customHelpers);
        }

        Object.assign(this.metalsmith.metaData(), this.officialEnv, this.answer,customHelpers);

        const filterFilesMap = get(this.metaConfig, 'filterFilesMap', null);

        if(filterFilesMap) {
            this.metalsmith = this.metalsmith.use(this.filterFiles(filterFilesMap));
        }

        const compileWhiteList  = get(this.metaConfig, 'compileWhiteList', null);

        let renderTemplatePlaceholder = this.renderTemplatePlacehodler(compileWhiteList);

        if(this.hooks.renderTemplatePlaceholder){
            renderTemplatePlaceholder = this.hooks.renderTemplatePlaceholder(this);
        }

        this.metalsmith = this.metalsmith.use(renderTemplatePlaceholder);

        if(this.hooks.renderTamplateFile) {
            this.metalsmith = this.metalsmith.use(this.hooks.renderTamplateFile(this));
        }

        return new Promise((resolve, reject)=>{
            this.metalsmith
            .source('.')
            .destination(this.projectPath)
            .clean(false)
            .build(async (err:Error)=>{
                if(err) {
                    reject(err);
                }
                log.success('Generatore构建完成')
                resolve(0);
            })
        })
    }

    /**
     * 询问用户
     * @param prompts 
     * @returns 
     */
    async askQuestions(prompts: any[]):Promise<{[key:string]:any}>{
        return inquirer.prompt(prompts);
    }

    /**
     * 根据用户的回答的结果过滤相关文件
     * @param {IFilterFilesMap} filterFilesMap 
     * @return {metalsmithCB} 执行done()回调表示执行完毕 
     */
    filterFiles(filterFilesMap:IFilterFilesMap):metalsmithCB {
        return (files:IFiles, metalsmith:Metalsmith,done: Function)=>{
            //如果不需要过滤文件直接终止
            if(!filterFilesMap) {
                return done();
            }

            const metaData: IMetaData = Metalsmith.metadata();

            const fileNameList = Object.keys(files);
            const filtersList = Object.keys(filterFilesMap);

            if(this.leoConfig.isDebugger) {
                log.debug('generator.filterFiles.before', Object.keys(files));
            }

            //根据用户选择的配置所对应的文件名进行匹配
            filtersList.forEach(filter=>{
                fileNameList.forEach(filename=>{
                    if(match(filename, filter, {dot: true})) {
                        const conditionKey = filterFilesMap[filter];
                        if(!metaData[conditionKey]) {
                            delete files[filename];
                        }
                    }
                })
            })
            if(this.leoConfig.isDebugger){
                log.debug('generator.filterFiles.after', Object.keys(files))
            }
            done()
        }
    }

    /**
     * 渲染template文件 若有renderTemplatePlaceholder钩子函数则不执行官方的渲染
     * @param compileWhiteList  执行done()回调表示执行完毕
     * @returns 
     */
     renderTemplatePlacehodler(compileWhiteList:string[]):metalsmithCB{
        return (files: IFiles, metalsmith: Metalsmith, done:Function)=>{
            const keys = Object.keys(files);

            const metalsmithMetadata = metalsmith.metadata();
            //判断模版是否有白名单
            const hasWhiteList = this.existCompileWhiteList(compileWhiteList);
            //循环查询有模版语法的文件，替换相关handlebars文语法的地方 然后生成新的文件
            keys.forEach(filename=>{
                const str = files[filename].contents.toString();
                const shouldCompileFile = this.isDefaultCompileFile(filename) ||
                this.matchCompileFile(hasWhiteList, filename, compileWhiteList);

                //匹配有handlebars语法的文件
                if(shouldCompileFile && /{{[^{}]+}}/g.test(str)) {
                    consolidate.handlebars.render(str, metalsmithMetadata, (err:Error, res:string)=>{
                        if(err){
                            throw new Error(`模版文件${filename}渲染出现异常`);
                        }
                        files[filename].contents = Buffer.from(res);
                    })
                }
            });
            done();
        };
    }

    async initGitRepo(repo: string): Promise<any> {
        if(!repo) {
            return;
        }
        const git = simpleGit(this.projectPath);

        log.await(`正在关联远程仓库: ${repo}`);
        await git.init();
        await git.addRemote('origin', repo);
        await git.add(['.']);
        await git.commit(`leo init from ${this.templateName}-template`);
        await git.push('origin', 'master', ['--set-upstream']);
        log.success('关联成功')
    }
    private async useLocalCacheTemplate(): Promise<boolean> {
        if(!this.options.useCache) {
            return false;
        }
        const templatePath = `${this.localTemplatePath}`;
        const hasTemplatePath = await fs.pathExists(templatePath);

        if(!hasTemplatePath) {
            throw new Error(`${templatePath} 不存在，无法使用缓存模版`);
        } else {
            return true;
        }
    }


    /**
     * 下载远程模版
     * @returns {Promise}
     */
    private async downloadTemplate():Promise<void> {
        log.await('generator', `下载远程模版: ${this.templateName}-template`);
        const gitPath = this.repoRemoteAddress;
        const target = this.localTemplatePath;
        if(this.leoConfig.isDebugger) {
            log.debug('generator.downloadTemplate', `gitPath:${gitPath} target: ${target}`);
        }

        //删除本地缓存文件后创建一个新的空文件夹
        await fs.remove(target);
        await fs.ensureDir(target);

        //下载仓库的模版至缓存文件夹
        return new Promise((resolve, reject)=>{
            downloadGitRepo(
                `direct: ${gitPath}`,
                target,
                {
                    clone: true,
                    headers: this.leoConfig.gitTemplateLikeQueryHeader||{}
                },(err: Error)=>{
                    if(err) {
                        return reject(new Error(`下载模版错误: ${err}`))
                    }
                    log.success('generator', '模版下载成功');
                    return resolve();
                }
            )
        })

    }


    /**
     * 获取模版的meta.js
     * 
     * @returns  Promsie<null|Object> meta.js的值
     */
    private async getTemplateMetaConfig(): Promise<Object|null> {
        const templateMetaPath = `${this.localTemplatePath}/meta.js`;
        const templatePackagePath = `${this.localTemplatePath}/package.json`;
        const hasMeta = await fs.pathExists(templateMetaPath);
        const hasPackage = await fs.pathExists(templatePackagePath);

        if(hasPackage) {
            log.await('==== 安装tempalte的依赖====');
            await this.installTemplatePkg();
        }

        if(hasMeta) {
            const metaConfig = require(templateMetaPath);
            if(this.leoConfig.isDebugger) {
                log.debug('generator.getTemplateMetaConfig', JSON.stringify(metaConfig));

            }
            return metaConfig;
        }
        return null;
    }

    /**
     * 判断metaConfig是否存在编译白名单
     * @param compileWhiteList 
     * @returns 
     */
    private existCompileWhiteList(compileWhiteList:string[]|null):boolean{
        return !!compileWhiteList && Array.isArray(compileWhiteList) && compileWhiteList.length > 0;
    }

    /**
     * 判断当前文件是否需要编译
     * @param hasWhiteList 
     * @param fileName 
     * @param compileWhiteList 
     * @returns 
     */
    private matchCompileFile(
        hasWhiteList: boolean,
        fileName: string,
        compileWhiteList: string[]
        ):boolean{
            return (
                !hasWhiteList ||
                (hasWhiteList && multimatch([fileName], compileWhiteList,{dot:true}).length>0)
            )
        }
    
        /**
         * 默认自动编译的文件
         * @param fileName 
         * @returns 
         */
    private isDefaultCompileFile(fileName: string):boolean {
        return this.defaultCompileFiles.indexOf(fileName)>=0;
    }

    private async installTemplatePkg():Promise<void>{
        const npmi = require('npminstall');
        try{
            await npmi({
                production: true,
                root: this.localTemplatePath,
                registry: 'http://registry.m.jd.com/'
            })
        }catch(e){
            log.warn('template依赖包安装存在问题')
        }
        log.success('installTemplatePkg', '安装成功')
    }

    /**
     * 注册用户自定义handlebars函数
     * @param helpers 
     */
    private registerCustomHelper(helpers:IHelper): void {
        Object.keys(helpers).forEach((key:string)=>{
            Handlebars.registerHelper(key, helpers[key]);
        })
    }


}