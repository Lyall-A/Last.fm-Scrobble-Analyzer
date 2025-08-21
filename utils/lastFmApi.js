const { setTimeout } = require('timers/promises');

const debug = require('./debug');

const config = require('../config.json');

async function lastFmApi(path = "/", params = { }) {
    const urlSearchParams = new URLSearchParams({
        ...params,
        api_key: config.apiKey,
        format: 'json'
    });

    return fetch(`${config.baseUrl}${path}?${urlSearchParams.toString()}`).then(async res => {
        if (res.status !== 200) throw new Error(`Got status code ${res.status}: ${res.statusText}`);

        const json = await res.json();
        if (json.error) {
            if (json.error === 29) {
                // Rate limited
                debug('Rate limited!');
                await setTimeout(2000);
                return getRecentTracks(user, page, limit);
            } else {
                throw new Error(`Got error code ${json.error}: ${json.message}`);
            }
        }
        
        return json;
    });
}

module.exports = lastFmApi;