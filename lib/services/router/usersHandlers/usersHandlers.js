// Dependencies
const {extractedBodyData, dataValidationUsers} = require('../../../helpersMethods/helpersExtractedData');
const _data = require('../../../data');
const helpers = require('../../../helpersMethods/helpersFunc');
const {verifyToken} = require('../tokensHandlers/verifyToken');

// Container for the users submethods
const usersServices = {};

// Users - post
usersServices.post = (data, callback) => {
    // Check that all required fields are filled out
    let tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' ? data.payload.tosAgreement : false;
    const {firstName, lastName, password, phone} = extractedBodyData(data);
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if (!err) {
                // User already exists
                callback(400, {Error: 'A user with that phone number already exits'})
            } else {
                // Hash the password
                const hashedPassword = helpers.hash(password);
                // Create the user object
                const userObject = {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    hashedPassword: hashedPassword,
                    tosAgreement: true
                };
                // Store the user
                _data.create('users', phone, userObject, (err) => {
                    if (typeof err !== "string") {
                        callback(200);
                    } else {
                        callback(500, {Error: 'Could not create the new user', msg: err})
                    }
                });
            }
        });
    } else {
        callback(400, {Error: 'Missing required fields'})
    }
};

usersServices.get = (data, callback) => {
    // Check that the phone number is valid
    const phone = dataValidationUsers(data, 'phone', 'queryStringObject');
    if (phone) {
        // Verify if the given token is valid
        verifyToken(data, (verifyData) => {
            if (verifyData) {
                _data.read('users', phone, (err, data_read) => {
                    if (!err && data_read) {
                        // Remove the hashed password from the user object before returning it to the requester
                        delete data_read.hashedPassword;
                        callback(200, data_read);
                    } else {
                        callback(404, {Error: 'Could not find the specified user'});
                    }
                });
            } else {
                callback(403, {Error: 'Missing the required token in header or the token is invalid'});
            }
        });
    } else {
        callback(400, {Error: 'Missing required phone number'})
    }
};

usersServices.put = (data, callback) => {
    // Check for the required field
    const phone = dataValidationUsers(data, 'phone', 'payload');
    // Check that all required fields are filled out
    const {firstName, lastName, password} = extractedBodyData(data);
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            // Verify if the given token is valid
            verifyToken(data, (verifyData) => {
                if (verifyData) {
                    _data.read('users', phone, (err, userData) => {
                        if (!err && userData) {
                            // Update the necessary fields
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users', phone, userData, (err) => {
                                if (typeof err !== "string") {
                                    callback(200);
                                } else {
                                    callback(500, {Error: 'Could not update the user', msg: err})
                                }
                            });
                        } else {
                            callback(400, {Error: 'The specified user does not exit'})
                        }
                    });
                } else {
                    callback(403, {Error: 'Missing the required token in header or the token is invalid'})
                }
            });
        } else {
            callback(400, {Error: 'Missing fields to update'})
        }
    } else {
        callback(400, {Error: 'Missing the required phone number'})
    }
};

usersServices.delete = (data, callback) => {
    // Check that the phone number is valid
    const phone = dataValidationUsers(data, 'phone', 'queryStringObject');
    if (phone) {
        verifyToken(data, (verifyData) => {
            if (verifyData) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', phone, (err) => {
                            if (typeof err !== "string") {
                                // Delete each of the checks associated with the user
                                const userChecks = userData.checks instanceof Array ? userData.checks : [];
                                if (userChecks.length > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    // Loop through the checks
                                    /*
                                    * This approach of loop through all items in the array and afterwards to check if
                                    * some errors have occurred is needed because is not possible sent more than one status code
                                    * for request on the server
                                    */
                                    userChecks.forEach(userCheck => {
                                        _data.delete('checks', userCheck, (err) => {
                                            if (typeof err === "string") {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted === userChecks.length) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {Error: "Errors on deletion's checks process"})
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {Error: 'Could not delete the specified user'})
                            }
                        });
                    } else {
                        callback(404, {Error: 'Could not find the specified user'});
                    }
                });
            } else {
                callback(403, {Error: 'Missing the required token in header or the token is invalid'})
            }
        });
    } else {
        callback(400, {Error: 'Missing the required phone number'})
    }
};

module.exports = usersServices;
