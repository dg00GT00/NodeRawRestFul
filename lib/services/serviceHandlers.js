/*
* Request serviceHandlers
*/

// Dependencies
const usersHandlers = require('./router/usersHandlers/usersHandlers');
const tokensHandlers = require('./router/tokensHandlers/tokensHandlers');
const checksHandlers = require('./router/checksHandlers/checksHandlers');
const {error: err} = require('./router/errorHandlers/errorHandlers');

const selectFields = (object, data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        object[data.method](data, callback);
    } else {
        callback(405, {Error: "HTTP/HTTPS method handler not implemented"})
    }
};

// Define the serviceHandlers
serviceHandlers = {
    // Ping handler
    ping: (data, callback) => {
        callback(200);
    },
    // Not found handler
    notFound: (data, callback) => {
        callback(404)
    },
    users: (data, callback) => selectFields({...usersHandlers}, data, callback),
    tokens: (data, callback) => selectFields({...tokensHandlers}, data, callback),
    checks: (data, callback) => selectFields({...checksHandlers}, data, callback),
    error: (data, callback) => err(data, callback),
};

module.exports = serviceHandlers;

