'use strict';
const path = require('path');
const fs = require('fs-extra')
const Inquirer = require('inquirer');
const Creator = require('./Creator')
async function core(projectName, options) {
    //获取当前项目目录
    const cwd = process.cwd();

    //拼接得到项目目录
    const targetDirectory = path.join(cwd, projectName);

    //判断是否存在
    if (fs.existsSync(targetDirectory)) {
        //判断是否使用--force参数
        if (options.force) {
            await fs.remove(targetDirectory);
        } else {
            let { isOverwrite } = await new Inquirer.prompt([{
                name: 'isOverwrite',
                type: "list",
                message: 'Target directory exists, Please choose an action',
                choices: [
                    {
                        name: 'Overwrite',
                        value: true
                    }, {
                        name: 'Cancel',
                        value: false
                    }
                ]
            }])

            if (!isOverwrite) {
                return;
            } else {
                await fs.remove(targetDirectory);
            }
        }
    }

    const creator = new Creator(projectName, targetDirectory);
    creator.create();
}

module.exports = core;
