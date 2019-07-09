/*
* Functions that help to build the layout of the CLI
*/

const layout = {};

layout.verticalSpace = lines => {
    lines = lines > 0 ? lines : 1;
    for (let i = 0; i < lines; i++) {
        console.log('');
    }
};

layout.horizontalLine = () => {
    // Get the available size
    const width = process.stdout.columns;
    let line = '';
    for (let i = 0; i < width; i++) {
        line += '-';
    }
    console.log(line);
};

layout.centered = str => {
    str = str.trim().length > 0 ? str.trim() : '';
    // Get the available size
    const width = process.stdout.columns;
    // Calculate the left padding there should be
    const leftPadding = Math.floor((width - str.length) / 2);
    // Put in lef padded spaces before the string itself
    let line = '';
    for (let i = 0; i < leftPadding; i++) {
        line += ' ';
    }
    line += str;
    console.log(line);
};

module.exports = layout;
