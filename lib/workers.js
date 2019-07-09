/*
* Worker-related tasks
*/
const _data = require('./data');
const http = require('http');
const https = require('https');
const debug = require('util').debuglog('workers');

// Process the check outcome, update the checks data as needed and trigger an alert to the user
// Special logic for accommodating a check that has never been tested before (don't want to alert on that one)
const processCheckOutcome = (checkData, checkOutcome) => {
    // Decide if the check is considered up or down
    const newState = !checkOutcome.error && checkData.successCodes.indexOf(checkOutcome.responseCode) !== -1 ? 'up': 'down';
    // Decide if an alert is warranted
    const alertWarranted = checkData.lastChecked && checkData.state !== newState;
    // Update the check data
    checkData.state = newState;
    checkData.lastChecked = Date.now();
    // Save the updates
    _data.update('checks', checkData.id, checkData, (err) => {
        if (typeof err !== "string") {
            // Send the new check data to the next phase in the next phase in the process if needed
            if (alertWarranted) {
                debug(checkData);
            } else {
                debug('Check outcome has not changed. No alert needed');
            }
        } else {
            console.error('Error on trying to save the updates to one of the checks');
        }
    });
};

// Send the originalCheckData and the outcome of the check process to the next steps
const performCheck = checkData => {
    // Prepare the initial check outcome
    const checkOutcome = {
        error: false,
    };
    // Mark if the outcome has not been sent yet
    let outcomeSent = false;
    // Parse the hostname and the path of the original check data
    const parseUrl = new URL(checkData.protocol + '://' + checkData.url);
    const hostName = parseUrl.hostname;
    const path = parseUrl.pathname + parseUrl.search;
    // Construct the request
    const requestDetails = {
        protocol: checkData.protocol + ':',
        hostname: hostName,
        method: checkData.method.toUpperCase(),
        path: path,
        timeout: checkData.timeoutSeconds * 1000
    };
    // Instantiate the request object (using either the http or https module)
    const moduleToUse = checkData.protocol === 'http' ? http : https;
    const req = moduleToUse.request(requestDetails, (res) => {
        // Grab the status of the sent request and
        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = res.statusCode;
        if (!outcomeSent) {
            processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });
    // Bind to the error event so it doesn't get thrown
    req.on('error', (err) => {
        checkOutcome.error = {
            error: true,
            value: err,
        };
        if (!outcomeSent) {
            processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });
    // Bind to the timeout event so it doesn't get thrown
    req.on('timeout', (err) => {
        checkOutcome.error = {
            error: true,
            value: err,
        };
        if (!outcomeSent) {
            processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });
    req.end();
};

// Sanity-checks the check-data
const validateChecksData = checkData => {
    // Set the keys that may not be set (if the workers have never seen this check before)
    checkData.state = typeof checkData.state === "string" && ['up', 'down'].indexOf(checkData.state) !== -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof checkData.lastChecked === "number" && checkData.lastChecked > 0 ? checkData.lastChecked : false;
    performCheck(checkData)
};

const gatherAllChecks = () => {
    // Get all the checks on the system
    _data.list('checks', (err, checks) => {
        if (typeof err !== "string" && checks && checks.length > 0) {
            for (const check of checks) {
                // Read in the checks data
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        // Pass it to the check validator
                        validateChecksData(originalCheckData)
                    } else {
                        console.error('Error reading one of the checks data')
                    }
                });
            }
        } else {
            console.error('Could not find any checks to process')
        }
    });
};

// Timer to execute the worker-process once per minute
exports.init = () => {
    // Execute all the checks immediately
    gatherAllChecks();
    setInterval(() => gatherAllChecks(), 1000 * 5);
};
