// Dependencies
const {extractedBodyData, dataValidationUsers} = require('../../../helpersMethods/helpersExtractedData');
const _data = require('../../../data');
const helpersFunc = require('../../../helpersMethods/helpersFunc');
const {performance, PerformanceObserver} = require('perf_hooks');
const debug = require('util').debuglog('performance');

// Container for all the tokens methods
const tokensServices = {};

tokensServices.post = (data, callback) => {
    performance.mark('entered function');
    const {phone, password} = extractedBodyData(data);
    performance.mark('inputs validated');
    if (phone && password) {
        // Look up the user who matches the phone number
        performance.mark('beginning user lookup');
        _data.read('users', phone, (err, userData) => {
            performance.mark('user lookup complete');
            if (!err && userData) {
                // Hash the sent password and compare it to the password stored in the user object
                performance.mark('beginning password hashing');
                const hashedPassword = helpersFunc.hash(password);
                performance.mark('password hashing complete');
                if (hashedPassword === userData.hashedPassword) {
                    // If valid, create a new token with a random name. Set expiration data to 1 hour in the future
                    performance.mark('creating data for token');
                    const tokenId = helpersFunc.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        id: tokenId,
                        phone,
                        expires
                    };
                    // Store the token
                    performance.mark('beginning storing the token');
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        performance.mark('storing token complete');

                        // Log out all the measurements
                        const measurements = new PerformanceObserver((list, observer) => {
                            const measurement = list.getEntries()[0];
                            debug('\x1b[33m%s\x1b[0m', measurement.name + ' ' + measurement.duration + ' ms');
                        });
                        measurements.observe({entryTypes: ['measure']});

                        // Gather all the measurements
                        performance.measure('Beginning to end', 'entered function', 'storing token complete');
                        performance.measure('Validating the user input', 'entered function', 'inputs validated');
                        performance.measure('User lookup', 'beginning password hashing', 'password hashing complete');
                        performance.measure('Token data creation', 'creating data for token', 'beginning storing the token');
                        performance.measure('Token storing', 'beginning storing token', 'storing token complete');

                        if (typeof err !== "string") {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {Error: 'Could not create the new token'})
                        }
                    });
                } else {
                    callback(400, {Error: "Password did not match the specified user's stored password"})
                }
            } else {
                callback(400, {Error: 'Could not find the specified user'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required fields'})
    }
};

tokensServices.get = (data, callback) => {
    // Check that the phone number is valid
    const id = dataValidationUsers(data, 'id', 'queryStringObject');
    if (id) {
        // Look up the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404, {Error: 'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required phone number'})
    }
};
tokensServices.put = (data, callback) => {
    const id = dataValidationUsers(data, 'id', 'payload');
    if (id && typeof data.payload.extend === 'boolean' && data.payload.extend === true) {
        // Look up the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // Checking to make sure the token doesn't have already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration to an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // Stores the new updates
                    _data.update('tokens', id, tokenData, (err) => {
                        if (typeof err !== "string") {
                            callback(200);
                        } else {
                            callback(500, {Error: "Could not update the token's expiration"})
                        }
                    });
                } else {
                    callback(400, {Error: 'The token has already expired and it cannot be extended'})
                }
            } else {
                callback(400, {Error: 'Specified token does not exist'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field(s) or field(s) are invalid'})
    }
};

tokensServices.delete = (data, callback) => {
    // Check that the id is valid
    const id = dataValidationUsers(data, 'id', 'queryStringObject');
    if (id) {
        _data.read('tokens', id, (err, data_read) => {
            if (!err && data_read) {
                _data.delete('tokens', id, (err) => {
                    if (typeof err !== "string") {
                        callback(200);
                    } else {
                        callback(500, {Error: "Could not delete the specified user's token"})
                    }
                });
            } else {
                callback(404, {Error: 'Could not find the specified token'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required id'})
    }
};

module.exports = tokensServices;
