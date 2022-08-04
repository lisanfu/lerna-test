'use strict';
const program = require('commander');
function cli() {

    program
        .command("create <project-name>")
        .description("create a new project")
        .option('-f,--force', 'overwrite target directory if it exists')
        .action((projectName, cmd) => {
            require('@lerna-test/core')(projectName, cmd);
        })

    program
        .on('--help', function () {

        })

    program.parse(process.argv);
}
cli()
module.exports = cli;


