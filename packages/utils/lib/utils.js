'use strict';
const ora = require('ora');
function sleep(n) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, n)
    })
}
/**
 * loading加载效果
 * @param {String} message  加载信息
 * @param {Function} fn  加载函数
 * @param  {...any} args  函数执行参数
 * @return 异步调用返回值
 */
async function loading(message, fn, ...args) {
    const spinner = ora(message);
    spinner.start();//开启加载动画

    try {
        let executeRes = await fn(...args);
        spinner.succeed();
        return executeRes;
    } catch (e) {
        spinner.fail('request fail,refetching');
        sleep(1000);
        return loading(message, fn, ...args);
    }
}
module.exports = {
    loading
};
