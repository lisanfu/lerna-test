const axios = require('axios');
//拦截全局响应
axios.interceptors.response.use((res) => {
    return res.data;
})

/**
 * 获取模版
 * @returns  Promise 仓库信息
 */
async function getRepo() {
    return axios.get();
}

/**
 * 获取仓库版本
 * @param {*} repo  模版名称
 * @returns  Promise 版本信息
 */
async function getTagsByRepo(repo) {
    return axios.get();
}


module.exports = {
    getRepo,
    getTagsByRepo
}