const {
    dataValidationUrl,
    dataValidationChecks,
    dataValidationTimeout,
    dataValidationSuccessCodes,
    dataValidationUsers,
} = require('../../../helpersMethods/helpersExtractedData');
const {verifyToken} = require('../tokensHandlers/verifyToken');
const _data = require('../../../data');
const config = require('../../../config');
const helpersFunc = require('../../../helpersMethods/helpersFunc');
const dns = require('dns');

// Container for all the checks methods
const checks = {};

const extractedData = data => {
    const protocol = dataValidationChecks(data, 'protocol', 'payload', ['http', 'https']);
    const url = dataValidationUrl(data, 'url', 'payload');
    const timeoutSeconds = dataValidationTimeout(data, 'timeoutSeconds', 'payload');
    const method = dataValidationChecks(data, 'method', 'payload', ['post', 'get', 'put', 'delete']);
    const successCodes = dataValidationSuccessCodes(data, 'successCodes', 'payload');
    return {protocol, url, timeoutSeconds, method, successCodes};
};

checks.post = (data, callback) => {
    // Validate the inputs
    const {protocol, url, timeoutSeconds, method, successCodes} = extractedData(data);
    if (protocol && url && method && successCodes && timeoutSeconds) {
        verifyToken(data, (verifyData) => {
            if (verifyData) {
                _data.read('tokens', verifyData.id, (err, tokenData) => {
                    if (!err && tokenData) {
                        const userPhone = tokenData.phone;
                        // Look up the user data
                        _data.read('users', userPhone, (err, userData) => {
                            if (!err && userData) {
                                const userChecks = userData.checks instanceof Array ? userData.checks : [];
                                // Verify that the user has less than the number of max-checks-per-user
                                if (userChecks.length < config.maxChecks) {
                                    // Verify if the URL given has DNS entries and therefore resolve
                                    const parseUrl = new URL(protocol + '://' + url);
                                    dns.resolve4(parseUrl.hostname, (err, records) => {
                                        if (!err && records) {
                                            // Create a random id for the checks
                                            const checkId = helpersFunc.createRandomString(20);
                                            // Create the check object and include the user phone
                                            const checkObject = {
                                                id: checkId,
                                                protocol,
                                                userPhone,
                                                url,
                                                method,
                                                successCodes,
                                                timeoutSeconds
                                            };
                                            // Save the object
                                            _data.create('checks', checkId, checkObject, (err) => {
                                                if (typeof err !== "string") {
                                                    // Add the check id to the user's object
                                                    userData.checks = userChecks;
                                                    userData.checks.push(checkId);
                                                    // Save the new user data
                                                    _data.update('users', userPhone, userData, (err) => {
                                                        if (typeof err !== "string") {
                                                            // Return the data about the new check
                                                            callback(200, checkObject);
                                                        } else {
                                                            callback(500, {
                                                                Error: 'Could not update the user with the new check',
                                                                msg: err
                                                            })
                                                        }
                                                    });
                                                } else {
                                                    callback(500, {Error: "Could not create the new check", msg: err})
                                                }
                                            });
                                        } else {
                                            callback(400, {Error: "The hostname of the URL entered did not resolve to any DNS entries"})
                                        }
                                    });
                                } else {
                                    callback(400, {Error: `The user has already achieved the maximum number of checks which is ${config.maxChecks} per user`})
                                }
                            } else {
                                callback(403, {Error: "The user's phone is invalid or was not found"})
                            }
                        });
                    } else {
                        callback(403, {Error: 'Id not found or invalid'})
                    }
                });
            } else {
                callback(403, {Error: 'Token not found or invalid'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required fields'})
    }
};

checks.get = (data, callback) => {
    // Check that the id number is valid
    const id = dataValidationUsers(data, 'id', 'queryStringObject');
    if (id) {
        // Look the checks
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                // Verify if the given token is valid and belongs to the user that create the check
                verifyToken(data, (verifyData) => {
                    if (verifyData) {
                        callback(200, checkData)
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {Error: 'Missing required phone number'})
    }
};

checks.put = (data, callback) => {
    // Check that the id number is valid
    const id = dataValidationUsers(data, 'id', 'payload');
    const {protocol, url, timeoutSeconds, method, successCodes} = extractedData(data);
    // Checks for making sure if the user id is valid
    if (id) {
        // Checks for making sure if one or more optional fields has been sent
        if (protocol || url || method || successCodes || timeoutSeconds) {
            // Look up the checks
            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    // Verify if the given token is valid and belongs to the user that create the check
                    verifyToken(data, (verifyData) => {
                        if (verifyData) {
                            // Update the checks where necessary
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }
                            // Store the new updates
                            _data.update('checks', id, checkData, (err) => {
                                if (typeof err !== "string") {
                                    callback(200);
                                } else {
                                    callback(500, {Error: err})
                                }
                            });
                        } else {
                            callback(403, {Error: 'The token has expired!'});
                        }
                    });
                } else {
                    callback(400, {Error: 'Check ID did not exit'})
                }
            });
        } else {
            callback(400, {Error: 'Missing fields to update'})
        }
    } else {
        callback(400, {Error: 'Missing the id field'})
    }
};

checks.delete = (data, callback) => {
    // Check that the phone number is valid
    const id = dataValidationUsers(data, 'id', 'queryStringObject');
    if (id) {
        // Look up the checks
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                verifyToken(data, (verifyData) => {
                    if (verifyData) {
                        _data.delete('checks', id, (err) => {
                            if (typeof err !== "string") {
                                _data.read('users', checkData.userPhone, (err, userData) => {
                                    if (!err && userData) {
                                        const userChecks = userData.checks instanceof Array ? userData.checks : [];
                                        // Remove the delete checks from their list of checks
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition !== -1) {
                                            userChecks.splice(checkPosition, 1);
                                            // Re-save the user's data
                                            _data.update('users', checkData.userPhone, userData, (err) => {
                                                if (typeof err !== "string") {
                                                    callback(200);
                                                } else {
                                                    callback(500, {Error: "Could not update the user", msg: err})
                                                }
                                            });
                                        } else {
                                            callback(500, {Error: 'Could not find the check on the user object so that it could not remove it'})
                                        }
                                    } else {
                                        callback(500, {Error: 'Could not find the user who has created the check'})
                                    }
                                });
                            } else {
                                callback(500, {Error: 'Could not delete the check data', msg: err})
                            }
                        });
                    } else {
                        callback(403, {Error: 'Missing the required token in the header or the token is invalid'})
                    }
                });
            } else {
                callback(400, {Error: 'The specified check ID does not exit'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required phone number'})
    }
};

module.exports = checks;
