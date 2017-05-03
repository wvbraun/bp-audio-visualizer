const delay = 1000;

const tracks = [
  {
    url: 'http://localhost:8080/audio/07 Rejoice.flac',
    title: 'Rejoice',
    artist: 'Julien Baker',
    album: 'Sprained Ankled',
    duration: '00:03:33.800',
  },
];

class VisualizerApi {
  static getAllTracks() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(Object.assign([], tracks));
      }, delay);
    });
  }

  static addTrack(track) {
    track = Object.assign({}, track);

    return new Promise((resolve, reject) => {
        setTimeout(() => {
          tracks.push(track);
        }, delay);
    });
  }
}

export default VisualizerApi;
