'use strict';

const Inquirer = require('inquirer');
const util = require('util');
const path = require('path');
const downloadGitRepo = require('download-git-repo');
const { getRepo, getTagsByRepo, loading } = require('@lerna-test/utils')
class Creator {
    constructor(name, target) {
        this.name = name;
        this.target = target;
        this.downloadGitRepo = util.promisify(downloadGitRepo);
    }

    async create() {
        let repo = await this.getRepoInfo();
        let tag = await this.getTagInfo(repo);

        await this.download(repo, tag);
    }

    //获取模版信息以及用户最终选择的模版
    async getRepoInfo() {
        //获取组织下的仓库信息
        let repoList = await loading(
            'waiting for fetching template',
            getRepo
        )

        //提取仓库名称
        const repos = repoList.map(item => item.name);

        //选取模版信息
        let { repo } = await new Inquirer.prompt([{
            name: 'repo',
            type: 'list',
            message: 'Please choosea template',
            choices: repos
        }])

        return repo;
    }

    //获取版本信息以及用户选择版本
    async getTagInfo(repo) {
        let tagList = await loading(
            'waiting for fetching version',
            getTagsByRepo,
            repo
        )

        const tags = tagList.map(item => item.name);
        let { tag } = await new Inquirer.prompt([{
            name: 'tag',
            type: 'list',
            message: 'Please choose a version',
            choices: tags
        }])

        return tag;
    }


    async download(repo, tag) {
        const templateUrl = '';
        await loading(
            'downloading template, please wait',
            this.downloadGitRepo,
            templateUrl,
            path.join(process.cwd(), this.target)
        )
    }
}

module.exports = Creator;
