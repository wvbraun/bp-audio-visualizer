const delay = 1000;

const tracks = [
  {
    src: 'http://localhost:8080/audio/Rejoice.wav',
    title: 'Rejoice',
    artist: 'Julien Baker',
    album: 'Sprained Ankled',
  },
  {
    src: 'http://localhost:8080/audio/Paris.mp3',
    title: 'PARIS',
    artist: 'LE SINNER',
    album: '',
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
          resolve(track);
        }, delay);
    });
  }
}

export default VisualizerApi;
