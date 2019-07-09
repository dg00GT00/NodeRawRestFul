/*
* Server-related tasks
*/

// Dependencies
const http = require('http');
const https = require('https');
const {StringDecoder} = require('string_decoder');
const config = require('./config');
const serviceHandlers = require('./services/serviceHandlers');
const helpers = require('./helpersMethods/helpersFunc');
const debug = require('util').debuglog('server');
const fs = require('fs');
const path = require('path');

/* This piece of code doesn't work. Only here for course completeness*/
// twilio.sendTwilioSms('4158375309', 'Hello', (err) => {
//     console.error(err);
// });

// The server should respond to all requests with a string
httpServer = http.createServer((req, res) => {
    unifiedServer(req, res, 'http://');
});

httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname, '../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../https/cert.pem')),
};

httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res, 'https://');
});


const responseHandler = (res, statusCode, payloadResponse) => {
// Use the status code called back by the handler or default to 200
    statusCode = typeof statusCode === 'number' ? statusCode : 200;
    // Use the payloadResponse called back by the handler or default to an empty object
    payloadResponse = typeof payloadResponse === 'object' ? payloadResponse : {};
    // Convert the payloadResponse to a string
    const payloadString = JSON.stringify(payloadResponse);
    // Send the response
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(payloadString);
    // Log the request path
    console.log('Returning this response: %s\n%s', statusCode, payloadString);
};

// All the server logic for both the http and https servers
unifiedServer = (req, res, scheme) => {
    const port = scheme === 'http://' ? config.httpPort : config.httpsPort;
    let parsedUrl = new URL(req.url, scheme + 'localhost:' + port);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.searchParams;

    // Get the HTTP method
    const method = req.method.toLowerCase();

    // Get the headers as an objects
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();
        // Choose the handler this request should go to. If one is not found use the NOT FOUND handler
        const chosenHandler = typeof router[trimmedPath] !== "undefined" ? router[trimmedPath] : serviceHandlers.notFound;
        // Constructor the data object to send to the handler
        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: helpers.parseJsonToObject(buffer)
        };
        // Route the request to the handler specified in the server.router
        try {
            chosenHandler(data, (statusCode, payloadResponse) => {
                responseHandler(res, statusCode, payloadResponse);
            });
        } catch (e) {
            debug(e);
            responseHandler(res, 500, '{"Error": "Unknown error"}')
        }
    });
};


// Define a request server.router
router = {
    ping: serviceHandlers.ping,
    users: serviceHandlers.users,
    tokens: serviceHandlers.tokens,
    checks: serviceHandlers.checks,
    error: serviceHandlers.error
};

// Init the script
exports.init = () => {
    // Start the server
    httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `The server is listening on port ${config.httpPort} in ${config.endName} mode now`)
    });
    // Instantiate the HTTPS server
    httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m',`The server is listening on port ${config.httpsPort} in ${config.endName} mode now`)
    });
};

