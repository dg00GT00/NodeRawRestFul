const _data = require('../../../data');

exports.verifyToken = (data, verifyCallBack) => {
    // Gets the token from the header and looks it up on data module
    _data.read('tokens', data.headers['token'], (err, tokenData) => {
        if (!err && tokenData.expires > Date.now()) {
            verifyCallBack(tokenData);
        } else {
            verifyCallBack(false);
        }
    });
};
