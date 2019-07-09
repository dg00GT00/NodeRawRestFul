/*
* CLI related tasks
*/

const ly = require('./consoleStrut');
const util = require('util');
const readline = require('readline');
const debug = util.debuglog('cli');
const Event = require('events');
const os = require('os');
const v8 = require('v8');
const _data = require('../data');

const event = new Event();

const uniqueInputs = {
    'exit': 'Kill the CLI',
    'man': 'Show the help page',
    'help': 'Alias of the "man" command',
    'stats': 'Get statistics on the underlying operation and resource utilization',
    'list users': 'Show a list of all registered users in the system',
    'more user info': 'Show details of a specific user with the --fileDirectory flag',
    'list checks': 'Show a list of all the active checks in the system including their state. The --up and --down are both optional',
    'more checks info': 'Show details of a specified check',
    'list logs': 'Show a list of all log files to be read (compress or uncompressed)',
    'more log info': 'Show details of a specified log file'
};

const clgConstructor = (object, title, pad) => {
    // Show a header for the help page that is as wide as the screen
    ly.horizontalLine();
    ly.centered(title);
    ly.horizontalLine();
    ly.verticalSpace();
    // Show for each command its explanation highlighted respectively in white and yellow
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const value = object[key];
            let line = '\x1b[33m' + key + '\x1b[0m';
            const padding = pad - line.length;
            for (let i = 0; i < padding; i++) {
                line += ' ';
            }
            line += value;
            console.log(line);
            ly.verticalSpace();
        }
    }
    ly.horizontalLine();
};

// Responders objects
const responders = {
    stats: () => {
        // Compile an object of stats
        const stats = {
            'Load Average': os.loadavg().join(' '),
            'CPU Count': os.cpus().length,
            'Free Memory': os.freemem(),
            'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
            'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
            'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
            'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
            'Uptime': os.uptime() + ' seconds',
        };
        clgConstructor(stats, 'SYSTEM STATISTICS', 40);
    },

    listUsers: () => {
        return new Promise(resolveOuter => {
            _data.list('users', (err, userIds) => {
                if (typeof err !== "string" && userIds.length > 0) {
                    ly.verticalSpace();
                    resolveOuter(userIds.map(userId => {
                        return new Promise(resolve => {
                            _data.read('users', userId, (err, userData) => {
                                if (!err && userData) {
                                    const checks = typeof userData.checks !== "undefined" ? userData.checks : [];
                                    resolve("Name: " + userData.firstName + " " + userData.lastName +
                                        "\nPhone: " + userData.phone +
                                        "\nChecks: " + checks)
                                }
                            })
                        })
                    }))
                }
            })
        })
    },

    moreUserInfo: (args, prompt) => {
        if (args) {
            _data.read('users', args, (err, userData) => {
                if (!err && userData) {
                    delete userData.hashedPassword;
                    // Print the JSON with text highlighting
                    console.dir(userData, {colors: true});
                    prompt.prompt();
                } else {
                    console.error(err);
                    prompt.prompt();
                }
            });
        } else {
            console.error('Invalid switch or undefined');
            prompt.prompt();
        }
    },
    listLogs: () => debug('Not implemented!'),
    listChecks: () => debug('Not implemented!'),
    moreLogInfo: () => debug('Not implemented!'),
    moreChecksInfo: (args, prompt) => {
        if (args) {
            _data.read('checks', args, (err, checkData) => {
                if (!err && checkData) {
                    // Print the JSON with text highlighting
                    console.dir(checkData, {colors: true});
                    prompt.prompt();
                } else {
                    console.error(err);
                    prompt.prompt();
                }
            });
        } else {
            console.error('Invalid switch or undefined');
            prompt.prompt();
        }
    },
};

// Input handlers
event.on('switch', (str, args, prompt) => {
    switch (str) {
        case 'man':
        case 'help':
            clgConstructor(uniqueInputs, 'CLI MANUAL', 30);
            break;
        case 'exit':
            // IIFE
            (process.exit())();
            break;
        case 'stats':
            responders.stats();
            break;
        case 'list users':
            responders.listUsers()
                .then(results => Promise.all(results))
                .then((finalResults) => {
                    for (const finalResult of finalResults) {
                        console.log(finalResult);
                    }
                    prompt.prompt();
                });
            break;
        case 'list logs':
            responders.listLogs();
            break;
        case 'more checks info':
            responders.moreChecksInfo(args, prompt);
            break;
        case 'more user info':
            responders.moreUserInfo(args, prompt);
            break;
        case 'more log info':
            responders.moreLogInfo(args);
            break;
        case 'list checks':
            responders.listChecks(args);
            break;
        default:
            return
    }
});

const splitArgs = str => {
    if (str.indexOf('--') !== -1) {
        const args = str.slice(str.indexOf('--'));
        const input = str.split(args)[0].trim();
        return [input, args.split('--')[1].trim()]
    } else {
        return [str]
    }
};

const processInput = (str, prompt) => {
    str = str.trim().length > 0 ? str.trim() : false;
    // Only process the input if the user actually wrote something otherwise ignore
    if (str) {
        // Codify the unique strings that identify the questions allowed to be asked
        const [input, args] = splitArgs(str);
        if (Object.keys(uniqueInputs).includes(input)) {
            event.emit('switch', input, args, prompt);
        } else {
            // If no match is found, tell the user to try again
            console.log('Sorry, try again');
        }
    }
};

// Init the script
exports.init = () => {
    // Send the start message to the console in dark blue
    console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');
    // Start the _interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    // Create an initial prompt
    _interface.prompt();
    // Handle each line of input separately
    _interface.on('line', (str) => {
        // Send to the input processor
        processInput(str, _interface);
        // Re-initialize the prompt afterwards
        _interface.prompt();
    });
    // If the user stops the CLI, the associated process should be killed
    _interface.on('close', () => {
        process.exit(0);
    });
};
