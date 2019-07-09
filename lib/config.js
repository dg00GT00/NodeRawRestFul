/*
* Create and export configuration variables
* On Windows is needed to set the NODE_ENV before requesting the node for running the app.
* This operation is accomplished by the set command line on Command prompt
*/

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    endName: 'staging',
    hashingSecret: 'thisIsASecret',
    maxChecks: 5,
    // twilio: {
    //     accountSid: 'Acb32d411ad7fe886aac54c665d25e5c5d',
    //     authToken: '9455e3eb3109edc12e3d8c92768f7a67',
    //     fromPhone: '+15005550006'
    // }
};

// Production environment
environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    endName: 'production',
    hashingSecret: 'thisIsAlsoASecret',
    maxChecks: 5,
    // twilio: {
    //     accountSid: '',
    //     authToken: '',
    //     fromPhone: ''
    // }
};

// Determine which environment was passed as command-line argument
const nodeEnv = process.env.NODE_ENV;
const currentEnvironment = typeof nodeEnv == 'string' ? nodeEnv.toLowerCase() : '';
// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
