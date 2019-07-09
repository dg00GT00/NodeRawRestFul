/*
* Test runner
*/

const assert = require('assert').strict;

const getNumber = () => 1;

// Application logic for the test runner
try {
    assert.equal(getNumber(), '1');
} catch (e) {
    console.error(e.message)
}
