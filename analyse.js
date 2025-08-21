const fs = require('fs');

const getMostFrequent = require('./utils/getMostFrequent');

const config = require('./config.json');

if (!fs.existsSync('./tracks.json') || !fs.existsSync('./scrobbles.json')) return console.log('No scrobbles to analyse! Fetch scrobbles first');

const tracks = require('./tracks.json');
const scrobbles = require('./scrobbles.json').sort((a, b) => b.dateScrobbled - a.dateScrobbled);

const years = new Set(scrobbles.map(i => new Date(i.dateScrobbled).getFullYear()).sort((a, b) => a - b));

years.forEach(year => {
    analyseScrobbles(year, scrobbles.filter(scrobble => new Date(scrobble.dateScrobbled).getFullYear() === year))
});
analyseScrobbles('Total', scrobbles);

function analyseScrobbles(title, scrobbles) {
    console.log(`${title}:`);
    console.log(`   Scrobbles: ${scrobbles.length}`);

    const missingTracks = scrobbles.filter(scrobble => !scrobble.trackId);
    console.log(`   Scrobbles without tracks: ${missingTracks.length}, around ${Math.floor((config.defaultDuration * missingTracks.length) / 1000 / 60 / 60)} hour(s) with ${Math.floor(config.defaultDuration / 1000)} second(s) per track`);

    const timeListened = scrobbles.reduce((acc, obj) => acc + (tracks.find(track => track.id === obj.trackId)?.duration || config.defaultDuration || 0), 0);
    const timePassed = Date.now() - new Date(0).setFullYear(new Date().getFullYear());
    console.log(`   Total time listened: ${Math.floor(timeListened / 1000 / 60 / 60 / 24)} day(s), ${Math.floor(timeListened / 1000 / 60 / 60)} hour(s), ${Math.floor(timeListened / 1000 / 60)} minute(s), ${Math.floor(timeListened / 1000)} second(s) - ${((timeListened / timePassed) * 100).toFixed(1)}% of ${new Date().getFullYear()} so far`);

    const { latestStreak, highestStreak } = getStreak(scrobbles);
    console.log(`   Latest scrobbling streak: ${Math.floor(latestStreak)} day(s)`);
    console.log(`   Highest scrobbling streak: ${Math.floor(highestStreak)} day(s)`);

    const firstScrobble = scrobbles.reduce((acc, obj) => obj.dateScrobbled < acc.dateScrobbled ? obj : acc);
    console.log(`   First scrobble: ${new Date(firstScrobble.dateScrobbled).toLocaleString()}`);

    const lastScrobble = scrobbles.reduce((acc, obj) => obj.dateScrobbled > acc.dateScrobbled ? obj : acc);
    console.log(`   Last scrobble: ${new Date(lastScrobble.dateScrobbled).toLocaleString()}`);

    const mostScrobbledTrack = getMostFrequent(scrobbles, scrobble => scrobble.trackId);
    const mostScrobbledTrackScrobbles = scrobbles.filter(scrobble => scrobble.trackId === mostScrobbledTrack.trackId).length;
    console.log(`   Most scrobbled track: ${mostScrobbledTrack.trackTitle} - ${mostScrobbledTrack.artistName} (${mostScrobbledTrackScrobbles} scrobbles)`);

    const mostScrobbledAlbum = getMostFrequent(scrobbles, scrobble => scrobble.albumTitle);
    const mostScrobbledAlbumScrobbles = scrobbles.filter(scrobble => scrobble.albumTitle === mostScrobbledAlbum.albumTitle).length;
    console.log(`   Most scrobbled album: ${mostScrobbledAlbum.albumTitle} - ${mostScrobbledAlbum.artistName} (${mostScrobbledAlbumScrobbles} scrobbles)`);

    const mostScrobbledArtist = getMostFrequent(scrobbles, scrobble => scrobble.artistName);
    const mostScrobbledArtistScrobbles = scrobbles.filter(scrobble => scrobble.artistName === mostScrobbledArtist.artistName).length;
    console.log(`   Most scrobbled artist: ${mostScrobbledArtist.artistName} (${mostScrobbledArtistScrobbles} scrobbles)`);
    
    const mostScrobbledDate = new Date(getMostFrequent(scrobbles, scrobble => new Date(scrobble.dateScrobbled).toLocaleDateString()).dateScrobbled);
    const mostScrobbledDateScrobbles = scrobbles.filter(scrobble => new Date(scrobble.dateScrobbled).toLocaleDateString() === mostScrobbledDate.toLocaleDateString()).length;
    const mostScrobbledMonthScrobbles = scrobbles.filter(scrobble => new Date(scrobble.dateScrobbled).getMonth() === mostScrobbledDate.getMonth()).length;
    console.log(`   Most scrobbled date: ${mostScrobbledDate.toLocaleDateString()} (${mostScrobbledDateScrobbles} scrobbles that day, ${mostScrobbledMonthScrobbles} scrobbles that month)`);
}

function getStreak(scrobbles) {
    let currentStreak = 0;
    let highestStreak = 0;
    let latestStreak = 0;
    let previousScrobbleDate;

    for (const scrobble of scrobbles) {
        const day = 1000 * 60 * 60 * 24;
        const scrobbleDate = scrobble.dateScrobbled;
        const dateDiff = previousScrobbleDate - scrobbleDate;
        
        if (dateDiff && dateDiff > day) {
            // Streak broken
            if (!latestStreak) latestStreak = currentStreak;
            currentStreak = 0;
        } else {
            // Streak ongoing
            currentStreak += (dateDiff || 0) / day;
            if (currentStreak > highestStreak) highestStreak = currentStreak;
        };
        
        previousScrobbleDate = scrobbleDate;
    }
    if (!latestStreak) latestStreak = currentStreak;
    
    return {
        highestStreak,
        latestStreak
    };
}