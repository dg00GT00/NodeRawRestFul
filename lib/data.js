/*
* Library for storing and editing data
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require("./helpersMethods/helpersFunc");

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');
// It constructs the base file directory
const pathConstructor = (dir, file) => lib.baseDir + dir + '/' + file + '.json';
// Write data to a file
lib.create = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(pathConstructor(dir, file), 'wx', (error, fd) => {
        if (!error && fd) {
            // Convert data to string
            const stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fd, stringData, (err) => {
                if (!err) {
                    fs.close(fd, (err) => {
                        if (!err) {
                            callback(true);
                        } else {
                            callback('Error closing the new file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            });
        } else {
            callback('Could not create new file. It may already exist');
        }
    });
};

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(pathConstructor(dir, file), 'utf-8', (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};

// Update data inside a file
lib.update = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(pathConstructor(dir, file), 'r+', (err, fd) => {
        if (!err && fd) {
            const stringData = JSON.stringify(data);
            // Truncate the file
            fs.ftruncate(fd, (err) => {
                if (!err) {
                    // Write to the file and close it
                    fs.writeFile(fd, stringData, (err) => {
                        if (!err) {
                            fs.close(fd, (err) => {
                                if (!err) {
                                    callback(true);
                                } else {
                                    callback('Error closing the file');
                                }
                            });
                        } else {
                            callback('Error writing to existing file');
                        }
                    });
                } else {
                    callback('Error truncating the file')
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exit yet')
        }
    });
};

// Delete a file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(pathConstructor(dir, file), (err) => {
        if (!err) {
            callback(true);
        } else {
            callback('Error deleting the file');
        }
    });
};

// List all the items in a directory
lib.list = (dir, callback) => {
    fs.readdir(lib.baseDir + dir + '/', (err, data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileNames = [];
            for (const datum of data) {
                trimmedFileNames.push(datum.replace('.json', ''));
            }
            callback(true, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
};

module.exports = lib;
