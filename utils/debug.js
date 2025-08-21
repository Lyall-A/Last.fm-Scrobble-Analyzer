const config = require('../config.json');

function debug(...msg) {
    if (config.debug) console.log('[DEBUG]', ...msg);
}

module.exports = debug;