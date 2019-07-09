/*
* Helpers for various tasks
*/

// Dependencies
const crypto = require('crypto');
const config = require('../config');


// Container for all the helpersFunc
const helpersFunc = {};

// Create a SHA256 hash
helpersFunc.hash = (str) => {
    if (typeof str === 'string' && str.length > 0) {
        return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases without throwing an error
helpersFunc.parseJsonToObject = (str) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return {};
    }
};

// Create a string of random alphanumeric characters of a given length
helpersFunc.createRandomString = (stringLength) => {
    if (typeof stringLength === 'number' && stringLength > 0 ? stringLength : false) {
        // Define all the possible characters that could go into a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        // Start the final string
        let str = '';
        for (let i = 1; i <= stringLength; i++) {
            // Get a random character from the 'possibleCharacters' const
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            str += randomCharacter
        }
        // Return the final string
        return str;
    } else {
        return false
    }
};

module.exports = helpersFunc;


