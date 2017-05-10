import React, { Component } from 'react';
import PropTypes from 'prop-types';

/*
const tmp = {
  playing: false,
  updating: true,
  bufSize: 2048,
  smoothing: 0.2,
  delay: 0.25,
  numFreq: 64,
  numWave: 64,
  freqColor: 'white',
  waveColor: 'rgb(0%, 50%, 100%)',
  kickOn: true,
  kickFreq: [5, 15],
  kickThreshold: 0.7,
  kickDecay: -0.01,
  kickColor: 'rgba(100%, 100%, 100%, 0.02)',
  bgColor: 'transparent',
  textColor: 'rgba(100%, 100%, 100%, 0.8)',
  altColor: 'rgba(100%, 100%, 100%, 0.1)',
}
*/

class AudioVisualizer extends Component {

  render() {
    const { className, src } = this.props;
    return (
      <div className={className}>
        <audio src={src} />
      </div>
    )
  }
}

AudioVisualizer.propTypes = {
    className: PropTypes.string,
    src: PropTypes.string,
};

export default AudioVisualizer;
