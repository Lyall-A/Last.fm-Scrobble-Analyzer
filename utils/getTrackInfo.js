const lastFmApi = require('./lastFmApi');

function getTrackInfo(mbid, trackTitle, artistName) {
    const params = {
        method: 'track.getInfo',
        // autocorrect: 1
    };
    if (mbid) {
        params.mbid = mbid;
    } else {
        params.track = trackTitle;
        params.artist = artistName;
    }

    return lastFmApi('/', params).then(json => json.track);
}

module.exports = getTrackInfo;