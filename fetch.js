const fs = require('fs');

const config = require('./config.json');

const debug = require('./utils/debug');
const getRecentTracks = require('./utils/getRecentTracks');
const getTrackInfo = require('./utils/getTrackInfo');

const tracks = fs.existsSync(config.tracksPath) ? JSON.parse(fs.readFileSync(config.tracksPath)) : [];
const scrobbles = fs.existsSync(config.scrobblesPath) ? JSON.parse(fs.readFileSync(config.scrobblesPath)) : [];

const logInterval = config.logInterval ? setInterval(() => {
    console.log(`Minutes scrobbled so far: ${(getTotalDuration() / 1000 / 60).toFixed()} (${scrobbles.length} scrobbles)`);
}, config.logInterval) : null;

const saveInterval = config.saveInterval ? setInterval(() => {
    const { writeTracksTime, writeScrobblesTime } = saveData();
    console.log(`Saved data in ${((writeTracksTime + writeScrobblesTime) / 1000).toFixed()} seconds`);
}, config.saveInterval) : null;

console.log(`Getting all tracks from "${config.username}"`);

const startDate = Date.now();
(async function getAllTracks(page = 1) {
    debug(`Getting page ${page}`);
    // Get page
    await getRecentTracks(config.username, page).then(async ({ recentTracks, attributes }) => {
        if (page === 1) {
            // if (recentTracks.find(recentTrack => recentTrack['@attr'].nowplaying === 'true')) throw new Error('Currently scrobbling, please do not scrobble while this script is running!');
            console.log(`Going through ${attributes.total} scrobbles...`);
        }

        // For each scrobble on page
        for (const recentTrack of recentTracks) {
            const trackMbid = undefined; // Just use track and artist name
            const { name: trackTitle, url } = recentTrack; // Add `mbid: trackMbid`
            const artistName = recentTrack.artist['#text'];
            const albumTitle = recentTrack.album?.['#text'];
            const nowPlaying = recentTrack['@attr']?.nowplaying === 'true' ? true : false;
            const dateScrobbled = recentTrack.date ? parseInt(recentTrack.date.uts, 10) * 1000 : null;

            if (nowPlaying) {
                // Skip currently playing track
                debug(`Skipping currently scrobbling track ${trackTitle} - ${artistName}`);
                continue;
            }

            if (scrobbles.find(scrobble => scrobble.dateScrobbled === dateScrobbled && scrobble.url === url)) {
                // Skip existing scrobbles
                debug(`Already have scrobble for ${trackTitle} - ${artistName} at ${new Date(dateScrobbled).toUTCString()}`);
                continue;
            }

            // Find track
            let track = findTrack({
                trackMbid,
                trackTitle,
                artistName,
                albumTitle
            });

            if (!track) {
                // Track not found
                debug(`Getting track info for ${trackTitle} - ${artistName}${trackMbid ? '. MBID is present' : ''}`);
                await getTrackInfo(trackMbid, trackTitle, artistName).then(trackInfo => {
                    // Try find track again
                    const foundTrack = findTrack({
                        trackMbid: trackInfo.mbid,
                        trackTitle: trackInfo.name,
                        artistName: trackInfo.artist.name,
                        albumTitle: trackInfo.album?.title
                    });

                    if (foundTrack) {
                        // Track exists with different name
                        debug(`Track already exists as ${foundTrack.title} - ${foundTrack.artist.name}, adding aliases`);
                        if (trackTitle !== foundTrack.title) foundTrack.aliases.push(trackTitle);
                        if (artistName !== foundTrack.artist.name) foundTrack.artist.aliases.push(artistName);
                        track = foundTrack;
                    } else {
                        // Track still wasn't found
                        track = {
                            id: tracks.length,
                            title: trackInfo.name,
                            mbid: trackInfo.mbid,
                            url: trackInfo.url,
                            aliases: [],
                            duration: parseInt(trackInfo.duration, 10),
                            listeners: parseInt(trackInfo.listeners, 10),
                            playCount: parseInt(trackInfo.playcount, 10),
                            dateFetched: Date.now(),
                            artist: {
                                name: trackInfo.artist.name,
                                mbid: trackInfo.artist.mbid,
                                url: trackInfo.artist.url,
                                aliases: [],
                            },
                            album: trackInfo.album ? {
                                title: trackInfo.album.title,
                                artist: trackInfo.album.artist,
                                url: trackInfo.album.url,
                                images: trackInfo.album.image.map(image => ({ url: image['#text'], size: image.size })),
                                aliases: [],
                            } : null,
                            wiki: trackInfo.wiki ? {
                                published: new Date(trackInfo.wiki.published).getTime(),
                                summary: trackInfo.wiki.summary,
                                content: trackInfo.wiki.content
                            } : null
                        };

                        tracks.push(track);
                    }
                }).catch(err => {
                    console.log(`Failed to get track info for ${trackTitle} - ${artistName}! Error: ${err.message}`);
                });
            } else {
                debug(`Using existing track info for ${trackTitle} - ${artistName}`);
            }
            
            // Add scrobble
            scrobbles.push({
                trackId: track?.id,
                trackMbid,
                trackTitle,
                artistName,
                albumTitle,
                url,
                nowPlaying,
                dateScrobbled
            });
        }

        if (page < parseInt(attributes.totalPages, 10) && scrobbles.length < attributes.total) {
            // Get next page
            return getAllTracks(page + 1);
        }
    });
})(1).then(() => {
    clearInterval(logInterval);
    clearInterval(saveInterval);

    console.log(`Got all scrobbles in ${((Date.now() - startDate) / 1000 / 60).toFixed()} minutes! Saving to file...`);

    const { writeTracksTime, writeScrobblesTime } = saveData();
    console.log(`Wrote tracks file in ${(writeTracksTime / 1000).toFixed(2)} seconds`);
    console.log(`Wrote scrobbles file in ${(writeScrobblesTime / 1000).toFixed(2)} seconds`);

    console.log();
    require('./analyse');
}).catch(err => {
    clearInterval(logInterval);
    clearInterval(saveInterval);

    console.log(`Error: ${err.message}`);
});

function findTrack(options = { }) {
    const { trackMbid, trackTitle, artistName, albumTitle } = options;

    return tracks.find(track =>
        trackMbid ?
            track.mbid === trackMbid :
        (track.title === trackTitle || track.aliases.includes(trackTitle)) &&
        (track.artist.name === artistName || track.artist.aliases.includes(artistName))
    );
}

function getTotalDuration() {
    return scrobbles.reduce((acc, obj) => acc + (tracks.find(track => track.id === obj.trackId)?.duration || config.defaultDuration || 0), 0);
}

function saveData() {
    const writeTracksStartDate = Date.now();
    fs.writeFileSync(config.tracksPath, JSON.stringify(tracks));
    const writeTracksEndDate = Date.now();

    const writeScrobblesStartDate = writeTracksEndDate;
    fs.writeFileSync(config.scrobblesPath, JSON.stringify(scrobbles));
    const writeScrobblesEndDate = Date.now();
    
    return {
        writeTracksTime: writeTracksEndDate - writeTracksStartDate,
        writeScrobblesTime: writeScrobblesEndDate - writeScrobblesStartDate
    };
}