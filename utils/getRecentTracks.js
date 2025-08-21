const lastFmApi = require('./lastFmApi');

function getRecentTracks(user, page = 1, limit = 200) {
    // NOTE: currently scrobbling track is shown on all pages
    return lastFmApi('/', { method: 'user.getrecenttracks', user, page, limit }).then(json => ({
        recentTracks: json.recenttracks.track,
        attributes: json.recenttracks['@attr']
    }))
}

module.exports = getRecentTracks;