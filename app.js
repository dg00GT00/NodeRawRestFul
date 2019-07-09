const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/layout/cli');

// Declare the app
const init = () => {
    return new Promise(resolve => {
        server.init();
        workers.init();
        resolve();
    });
};
// Init function
init().then(() => cli.init());

module.exports = init;
