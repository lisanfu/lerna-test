const { getRepo, getTagsByRepo } = require('./api')

const { loading } = require('./utils')

module.exports = {
    getRepo,
    getTagsByRepo,
    loading
}