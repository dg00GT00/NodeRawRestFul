/*
* This module doesn't work. Only here for course completeness
* Twilio API outdated
*/

const querystring = require('querystring');
const config = require('../../config');
const https = require('https');

// Send a SMS message via Twillo
exports.sendTwilioSms = (phone, msg, callback) => {
    // Validate parameters
    phone = typeof phone === "string" && phone.trim().length === 10 ? phone.trim() : false;
    msg = typeof msg === "string" && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
    if (phone && msg) {
        // Configure the request payload
        const payload = {
            From: config.twilio.fromPhone,
            To : '+1' + phone,
            Body: msg
        };
        // Stringify the payload
        const stringPayload = querystring.stringify(payload);
        // Configure the request details
        const requestDetails = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: '/2010-04-01/Accounts/' + config.twilio.accountSid+ '/Messages.json',
            auth: config.twilio.accountSid + ':' + config.twilio.authToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };
        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            // Grab the status of the sent request
            const status = res.statusCode;
            // Callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback(true)
            }else{
                callback('Status code returned was ' + status);
            }
        });
        // Bind to the error event so that it doesn't get thrown
        req.on('error', (err) => {
            callback(err);
        });
        // Add the payload
        req.write(stringPayload);
        // End the request
        req.end();
    } else {
        callback('Given parameters are missing or invalid');
    }
};

