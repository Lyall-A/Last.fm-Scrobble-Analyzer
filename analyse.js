const config = require('./config.json');

const tracks = require('./tracks.json');
const scrobbles = require('./scrobbles.json');

const timeListened = scrobbles.reduce((acc, obj) => acc + (tracks.find(track => track.id === obj.trackId)?.duration || config.defaultDuration || 0), 0);

// TODO: most listened to track, artist, etc
console.log(`
Total scrobbles: ${scrobbles.length}
Total time listened: ${(timeListened / 1000 / 60).toFixed()} minutes (or ${(timeListened / 1000 / 60 / 60).toFixed()} hours)
First scrobble: ${new Date(scrobbles.reduce((acc, obj) => obj.dateScrobbled < acc.dateScrobbled ? obj : acc).dateScrobbled).toLocaleString()}
Last scrobble: ${new Date(scrobbles.reduce((acc, obj) => obj.dateScrobbled > acc.dateScrobbled ? obj : acc).dateScrobbled).toLocaleString()}
`.trim());