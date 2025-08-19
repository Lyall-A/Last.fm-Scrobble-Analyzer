const config = require('./config.json');

const tracks = require('./tracks.json');
const scrobbles = require('./scrobbles.json');

const years = [...new Set(scrobbles.map(i => new Date(i.dateScrobbled).getFullYear()))].reverse();

years.forEach(year => {
    analyseScrobbles(year, scrobbles.filter(scrobble => new Date(scrobble.dateScrobbled).getFullYear() === year))
});
analyseScrobbles('Total', scrobbles);

function analyseScrobbles(title, scrobbles) {
    console.log(`${title}:`);
    console.log(`   Scrobbles: ${scrobbles.length}`);

    const timeListened = scrobbles.reduce((acc, obj) => acc + (tracks.find(track => track.id === obj.trackId)?.duration || config.defaultDuration || 0), 0);
    const timePassed = Date.now() - new Date(0).setFullYear(new Date().getFullYear());
    console.log(`   Total time listened: ${Math.floor(timeListened / 1000 / 60 / 60 / 24)} day(s), ${Math.floor(timeListened / 1000 / 60 / 60)} hour(s), ${Math.floor(timeListened / 1000 / 60)} minute(s), ${Math.floor(timeListened / 1000)} second(s), thats ${Math.floor((timeListened / timePassed) * 100)}% of whats passed in ${new Date().getFullYear()} so far`);

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

function getMostFrequent(arr, getValue) {
    const counts = new Map();

    let mostFrequentCount = 0;
    let mostFrequentItem;

    for (const item of arr) {
        const value = getValue ? getValue(item) : item;
        const count = (counts.get(value) || 0) + 1;
        
        counts.set(value, count);

        if (count > mostFrequentCount) {
            mostFrequentCount = count;
            mostFrequentItem = item;
        }
    }

    return mostFrequentItem;
}