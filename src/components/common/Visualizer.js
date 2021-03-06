import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/* https://github.com/DavidLazic/react-audio-visualizer/blob/master/src/Visualizer.js */

const STATES = [
  'ENDED',
  'PLAYING',
  'PAUSED',
  'BUFFERING'
];

const OPTIONS_ANALYSER = {
  smoothingTime: 0.6,
  fftSize: 512,
  minDecibels: -140,
  maxDecibels: 0,
};

const OPTIONS_DEFAULT = {
  autoplay: false,
  shadowBlur: 60, //20,
  shadowColor: '#ffffff',
  barColor: '#c3383b' /* '#cafdff' */,
  barWidth: 2,
  barHeight: 2,
  barSpacing: 7,
  font: ['12px', 'Helvetica'],
  textColor: 'rgba(100%, 100%, 100%, 0.8)',
  altColor: 'rgba(100%, 100%, 100%, 0.1)',
};


const secondsToTime = (seconds) => {
  /*
  seconds = Math.round(seconds);
  let ss = seconds % 60;
  let mm = Math.round(seconds % 60 % 60);
  let hh = Math.round(seconds % 60 % 60 % 24);
  //let d = seconds / 60 / 60 / 24;
  if (hh < 10) {hh = '0'+hh;}
  if (mm < 10) {mm = '0'+mm;}
  if (ss < 10) {ss = '0'+ss;}
  */
  // new Date(0).toISOString() => '1970-01-01T00:00:00.000Z'
  const ms = 1000 * seconds
  return new Date(ms).toISOString().substr(14, 5);
}

class Visualizer extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isPlaying: false,
      requestAnimationFrame: null,
      animFrameId: null,
      ctx: null,
      analyser: null,
      frequencyData: 0,
      sourceNode: null,
      gradient: {
        foregoundGradient: null,
        backgroundGradient: null,
      },
      canvasCtx: {
        foregroundCtx: null,
        particleCtx: null,
        backgroundCtx: null,
      },
      interval: null,
      duration: null,
      options: OPTIONS_DEFAULT,
      extensions: {},
      model: null,
      progress: 0,
      particles: [],
    };
  }

  componentWillMount () {
    //window.addEventListener('resize', this._onResize, true);
    this._setContext().then(() => {
      this._setAnalyser();
    }).then(() => {
      this._setFrequencyData();
    }).then(() => {
      this._setRequestAnimationFrame();
    }).catch((error) => {
      this._onDisplayError(error);
    });
  }

  componentDidMount () {
    this._extend().then(() => {
      this._setSourceNode();
    }).then(() => {
      this._setCanvasContext();
    }).then(() => {
      this._setCanvasStyles();
    }).then(() => {
      this._setParticles();
    }).then(() => {
      this._onRender({
        renderText: this.state.extensions.renderText,
        renderTime: this.state.extensions.renderTime
      });
      if (this.state.options.autoplay) {
        this._onResolvePlayState();
      } else {
        this._onRenderFrame(true);
      }
      // this.state.options.autoplay && this._onResolvePlayState();
    }).catch((error) => {
      this._onDisplayError(error);
    });
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.model !== nextProps.model) {
      this._onAudioStop().then(() => {
        this.setState({ model: nextProps.model }, () => {
          this.componentDidMount();
        });
      });
    } /* else {
      //console.log(this.props.isPlaying);
      if (this.props.isPlaying) {
        this._onAudioPlay(false);
      } else {
        this._onAudioPause(false);
      }
      //this._onResolvePlayState();
    } */
  }

  componentWillUnmount () {
    this.state.ctx.close();
  }

  _onDisplayError = (error) => {
    return window.console.table(error);
  }

  _extend = () => {
    const options = Object.assign(OPTIONS_DEFAULT, this.props.options);
    const extensions = Object.assign({}, this.props.extensions || {
      renderStyle: this._onRenderStyleDefault,
      renderText: this._onRenderTextDefault,
      renderTime: this._onRenderTimeDefault
    });

    return new Promise((resolve, reject) => {
      this.setState({
        options,
        model: this.props.model,
        extensions
      }, () => {
        return resolve();
      });
    });
  }

  _setCanvasContext = () => {
    const canvasCtx = {
      foregroundCtx: this.foregroundCanvas.getContext('2d'),
      particleCtx: this.particleCanvas.getContext('2d'),
      backgroundCtx: this.backgroundCanvas.getContext('2d'),
    };

    return new Promise((resolve, reject) => {
      this.setState({ canvasCtx }, () => {
        return resolve();
      });
    });
  }

  _setContext = () => {
    const error = { message: 'Web Audio API is not supported.' };

    return new Promise((resolve, reject) => {
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.setState({ ctx: new window.AudioContext() }, () => {
          return resolve();
        });
      } catch (e) {
          return reject(error);
      }
    });
  }

  _setAnalyser = () => {
    const { ctx } = this.state;

    return new Promise((resolve, reject) => {
      let analyser = ctx.createAnalyser();

      analyser.smoothingTimeConstant = OPTIONS_ANALYSER.smoothingTime;
      analyser.fftSize = OPTIONS_ANALYSER.fftSize;
      analyser.minDecibels = OPTIONS_ANALYSER.minDecibels;
      analyser.maxDecibels = OPTIONS_ANALYSER.maxDecibels;

      this.setState({ analyser }, () => {
        return resolve();
      });
    });
  }

  _setFrequencyData = () => {
    const { analyser } = this.state;

    return new Promise((resolve, reject) => {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      this.setState({ frequencyData }, () => {
        return resolve();
      });
    });
  }

  _setSourceNode = () => {
    const { audio } = this;
    const { ctx, analyser } = this.state;

    return new Promise((resolve, reject) => {
      let sourceNode = ctx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      sourceNode.connect(ctx.destination);
      sourceNode.onended = () => {
        this._onAudioStop();
      };

      this.setState({ sourceNode }, () => {
        return resolve();
      });
    });
  }

  _setRequestAnimationFrame = () => {
    return new Promise((resolve, reject) => {
      const requestAnimationFrame = (() => {
        return window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function (callback) {
            window.setTimeout(callback, 1000 / 60);
          };
      })();

      this.setState({ requestAnimationFrame }, () => {
        return resolve();
      });
    });
  }

  _setCanvasStyles = () => {
    const { width, height } = this.backgroundCanvas;
    const { canvasCtx } = this.state;
    const { foregroundCtx, particleCtx, backgroundCtx } = canvasCtx;
    const { barColor, shadowBlur, shadowColor, font } = this.state.options;

    let foregroundGradient = foregroundCtx.createLinearGradient(0, 0, 0, 300);
    foregroundGradient.addColorStop(1, barColor);

    const volume = this.audio.volume / 1000;
    const r = Math.round(200 + (Math.sin(volume) + 1) * 28);
    const g = Math.round(volume * 2);
    const b = Math.round(volume * 8);
    const a = 0.4; // 1 + Math.sin(volume + 3 * Math.PI/2);

    let backgroundGradient = backgroundCtx.createRadialGradient(width/2, height/2, volume, width/2, height/2, width-Math.min(Math.pow(volume, 2.7), width-20));
    backgroundGradient.addColorStop(0, 'rgba(0,0,0,0)');
    backgroundGradient.addColorStop(0.8,`rgba(${r}, ${g}, ${b}, ${a})`);

    const fgCtx = Object.assign(foregroundCtx, {
      fillStyle: foregroundGradient,
      shadowBlur: shadowBlur,
      shadowColor: shadowColor,
      font: font.join(' '),
      textAlign: 'center'
    });

    const bgCtx = Object.assign(backgroundCtx, {
      fillStyle: backgroundGradient,
    });

    return new Promise((resolve, reject) => {
      this.setState({
        gradient: {
          foregroundGradient,
          backgroundGradient,
        },
        canvasCtx: {
          particleCtx,
          foregroundCtx: fgCtx,
          backgroundCtx: bgCtx,
        },
      }, () => {
        return resolve();
      });
    });
  }

  _createParticle = ({ x, y, size }) => {
    const angle = Math.atan(Math.abs(y) / Math.abs(x));
    return {
      x,
      y,
      size,
      angle,
      high: 0,
    };
  }

  _setParticles = () => {
    const { width, height } = this.particleCanvas;
    const n = Math.round(width / 15);

    return new Promise((resolve, reject) => {
      let particles = [];
      [...Array(n).keys()].map(i => {
        //let x = (Math.random()) * width;
        //let y = (Math.random()) * height;
        //console.log(`${x}, ${y}`);
        return particles.push(this._createParticle({
          x: Math.random() * width,
          y: Math.random() * height,
          size: (Math.random() + 0.1) * 3,
        }));
      });
      this.setState({ particles }, () => {
        return resolve();
      });
    });
  }

  _onChange = (state) => {
    const { onChange } = this.props;

    return onChange && onChange.call(this, { status: state });
  }

  _onResize = () => {
    const { foregroundCanvas } = this;
    // const { canvasCtx } = this.state;

    console.log(foregroundCanvas.width);
    console.log(foregroundCanvas.height);
    foregroundCanvas.width = window.innerWidth / 2;
    foregroundCanvas.height = window.innerHeight / 2;
    //canvasCtx.translate(canvas.width, canvas.height);

    this._setCanvasStyles().then(() => {
      this._onRender({
        renderText: this.state.extensions.renderText,
        renderTime: this.state.extensions.renderTime
      });
    }).catch((error) => {
      this._onDisplayError(error);
    });
  }

  _onResolvePlayState = () => {
    const { isPlaying } = this.state;

    if (!isPlaying) {
      return this._onAudioPlay();
    } else {
      return this._onAudioPause();
    }
  }

  _onAudioLoad = () => {
    /*
    const { canvasCtx } = this.state;
    canvasCtx.fillText('Loading...', this.canvas.width / 2 + 10, this.canvas.height / 2 - 25);
    this._onChange(STATES[3]);
    this._onAudioPlay();
    */

    this._onRenderFrame();
    return this;
  }

  _onAudioPause = () => {
    const { ctx } = this.state;

    this.setState({ isPlaying: false }, () => {
      ctx.suspend().then(() => {
        this._onChange(STATES[2]);
      });
    });

    return this;
  }

  _onAudioStop = () => {
    const { foregroundCanvas, particleCanvas, backgroundCanvas } = this;
    const { canvasCtx, ctx } = this.state;
    const { foregroundCtx, particleCtx, backgroundCtx } = canvasCtx;

    return new Promise((resolve, reject) => {
      window.cancelAnimationFrame(this.state.animFrameId);
      clearInterval(this.state.interval);
      this.state.sourceNode.disconnect();
      foregroundCtx.clearRect(
      -foregroundCanvas.width,
      -foregroundCanvas.height,
      foregroundCanvas.width * 2,
      foregroundCanvas.height * 2);

    particleCtx.clearRect(
      //-particleCanvas.width / 2,
      //-particleCanvas.height / 2,
      0, 0,
      particleCanvas.width,
      particleCanvas.height);

      //foregroundCtx.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);
      //particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
      this._onChange(STATES[0]);

      ctx.resume().then(() => {
        this._setSourceNode();
      }).then(() => {
        this.setState({
          isPlaying: false,
          animFrameId: null
        }, () => {
          return resolve();
        });
      });
    });
  }

  _onAudioPlay = () => {
    const { ctx } = this.state;

    this.setState({ isPlaying: true }, () => {
      this._onChange(STATES[1]);

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          return this._onRenderFrame();
        });
      }

      this.audio.play();
      this._onRenderFrame();
    });


    return this;
  }

  _onRenderFrame = (init) => {
    const {
      analyser,
      extensions,
      frequencyData,
      requestAnimationFrame,
    } = this.state;

    if (init || this.state.isPlaying) {
      const animFrameId = requestAnimationFrame(this._onRenderFrame);

      this.setState({ animFrameId }, () => {
        analyser.getByteFrequencyData(frequencyData);
        this._onRender(extensions);
      });
    }

    return this;
  }

  _onRender = (extensions) => {
    const { canvasCtx } = this.state;
    const { foregroundCtx, particleCtx, backgroundCtx } = canvasCtx;
    const { foregroundCanvas, particleCanvas, backgroundCanvas } = this;

    foregroundCtx.clearRect(
      //-foregroundCanvas.width,
      //-foregroundCanvas.height,
      0, 0,
      foregroundCanvas.width * 2,
      foregroundCanvas.height * 2);

    particleCtx.clearRect(
      //-particleCanvas.width / 2,
      //-particleCanvas.height / 2,
      0, 0,
      particleCanvas.width,
      particleCanvas.height);

    //foregroundCtx.clearRect(0, 0, foregroundCanvas.width, foregroundCanvas.height);
    //particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    Object.keys(extensions).map((extension) => {
      return extensions[extension] &&
      extensions[extension].call(this, this);
    });
  }

  _onRenderTimeDefault = () => {
    const { audio, foregroundCanvas } = this;
    const { width, height } = foregroundCanvas;
    const { foregroundCtx } = this.state.canvasCtx;

    const cx = width / 2;
    const cy = height / 4;

    let time = secondsToTime(audio.currentTime);
    if (audio.duration) {
      this.setState({ progress: audio.currentTime / audio.duration });
    }
    foregroundCtx.fillText(time, cx + 10, cy + 40);
    return this;
  }

  _onRenderTextDefault = () => {
    const { foregroundCanvas } = this;
    const { canvasCtx, model } = this.state;
    const { foregroundCtx } = canvasCtx;
    const { font } = this.state.options;

    const cx = foregroundCanvas.width / 2;
    const cy = foregroundCanvas.height / 4;
    const fontAdjustment = 6;
    const alignAdjustment = 8;

    foregroundCtx.textBaseline = 'top';
    foregroundCtx.fillText(`by ${model.artist}`, cx + alignAdjustment, cy);
    foregroundCtx.font = `${parseInt(font[0], 10) + fontAdjustment}px ${font[1]}`;
    foregroundCtx.textBaseline = 'bottom';
    foregroundCtx.fillText(model.title, cx + alignAdjustment, cy);
    foregroundCtx.font = font.join(' ');

    return this;
  }

  _drawParticle = (i, particle, canvasCtx) => {
    const { width, height } = this.particleCanvas;
    let { x, y, size, angle, high } = particle;


    const distanceFromOrigin = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const brightness = Math.min(Math.round(high * 5), 55) + 200;
    const distanceVolume = (Math.pow(distanceFromOrigin,2)/30000) * (Math.pow(this.audio.volume,2)/6000000);
    //const distanceVolume = (Math.pow(distanceFromOrigin,2)/300) * (Math.pow(this.audio.volume,2));
    const lengthFactor = 1 + distanceVolume; //Math.min(distanceVolume, distanceFromOrigin);


    let toX = Math.cos(angle) * -lengthFactor;
    let toY = Math.sin(angle) * -lengthFactor;
    toX = x > 0 ? x + toX : x + -toX;
    toY = y > 0 ? y + toY : y + -toY;

/*
    if (i === 10) {
      console.log(`(${x}, ${y}) to (${toX}, ${toY})`);
    }
    */

    // Draw particles as lines
    //canvasCtx.lineWidth = 0.5 + (distanceFromOrigin/2000) * Math.max(size/2, 1);
    //canvasCtx.strokeStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 1)`;

    canvasCtx = Object.assign(canvasCtx, {
      lineWidth: 0.5 + (distanceFromOrigin/2000) * Math.max(size/2, 1),
      strokeStyle: `rgba(${brightness}, ${brightness}, ${brightness}, 1)`,
    });

    canvasCtx.beginPath();
    canvasCtx.moveTo(x, y);
    canvasCtx.lineTo(toX, toY);
    canvasCtx.stroke();
    canvasCtx.closePath();

    // Particle movement towards camera
    const speed = (lengthFactor / 20) * size;
    high -= Math.max(high - 0.0001, 0);
    if (speed > high) {
      high = speed;
    }

    const dx = Math.cos(angle) * high;
    const dy = Math.sin(angle) * high;
    x += x > 0 ? dx : -dx;
    y += y > 0 ? dy : -dy;

    /*
    const maxX = (width / 2); //+ 500;
    const maxY = (height / 2); //+ 500;
    // it has gone off the edge so respawn it somewhere near the middle.
    //if ((y > maxY || y < -maxY) || (x > maxX || x < -maxX)) {
    //if ((x > width || x < 0) || (y > height || y < 0)) {
      x = (Math.random() - 0.5) * (width / 3);
      y = (Math.random() - 0.5) * (height / 3);
      angle = Math.atan(Math.abs(y) / Math.abs(x));
    }
    */


    if (x > width) {
      x = 10;
    }
    /*
    if (x < 0) {
      x = 0;
    }
    */
    if (y > height) { y = 10; }
    /*
    if (y < 0) {
      y = 10; //height - 10;
    }
    */

    /*
    this.setState({ canvasCtx: {
      foregroundCtx,
      backgroundCtx,
      particleCtx: canvasCtx,
    }});
    */

    return {
      x,
      y,
      angle,
      size,
      high,
    };
  }

  _onRenderParticles = () => {
    const { particleCtx } = this.state.canvasCtx;

    return new Promise((resolve, reject) => {
      let particles = Object.assign([], this.state.particles);
      particles.map((particle, i) => {
        return particles[i] = this._drawParticle(i, particle, particleCtx);
      });
      this.setState({ particles }, () => {
        return resolve();
      });
    });
  }

  _drawFreqBar = (freq, canvasCtx) => {
    const { angle, tx, ty, x, y, w, h } = freq;

    canvasCtx.save();
    canvasCtx.translate(tx, ty);
    canvasCtx.rotate(angle);
    canvasCtx.fillRect(x, y, w, h);
    canvasCtx.restore();
  }

  _onRenderFreqBars = () => {
    const { width, height } = this.foregroundCanvas;
    const { frequencyData, canvasCtx, options } = this.state;
    const { foregroundCtx } = canvasCtx;
    const { barWidth, barHeight, barSpacing } = options;

    const radiusReduction = 70;
    const amplitudeReduction = 6;

    const cx = width / 2;
    const cy = height / 4;
    const radius = Math.min(cx, cy) - radiusReduction;
    const maxBarNum = Math.floor((radius * 2 * Math.PI) / (barWidth + barSpacing));
    const slicedPercent = Math.floor((maxBarNum * 25) / 100);
    const barNum = maxBarNum - slicedPercent;
    const freqJump = Math.floor(frequencyData.length / maxBarNum);

    [...Array(barNum).keys()].map(i => {
      const amplitude = frequencyData[i * freqJump];
      const theta = (i * 2 * Math.PI ) / maxBarNum;
      const delta = (3 * 45 - barWidth) * Math.PI / 180;
      const freq = {
        angle: theta - delta,
        tx: cx + barSpacing,
        ty: cy + barSpacing,
        x: 0,
        y: radius - (amplitude / 12 - barHeight),
        w: barWidth,
        h: amplitude / amplitudeReduction + barHeight,
      };

      return this._drawFreqBar(freq, foregroundCtx);
    });

    return Promise.resolve();
  }

  _onRenderBackground = () => {
    const { width, height } = this.backgroundCanvas;
    const { backgroundCtx } = this.state.canvasCtx;

    //backgroundCtx.clearRect(0, 0, width, height);
    backgroundCtx.fillRect(0, 0, width, height);

    return Promise.resolve();
  }

  _onRenderStyleDefault = () => {
    return new Promise((resolve, reject) => {
      this._onRenderParticles()
      .then(this._onRenderFreqBars)
      //.then(this._onRenderBackground)
      .then(resolve);
    });
  }

  render () {
    const { progress } = this.state;
    const { model, className, width, height } = this.props;
    const { altColor, textColor } = this.state.options;
    const classes = classNames('visualizer', className);

    //const width = `${document.documentElement.clientWidth}px`;
    // TODO: Fix this tmp hack :: height - 80 to account for VisualizerPage logo
    //const height = `${document.documentElement.clientHeight}px`;

    const progressStyle = {
        backgroundColor: textColor,
        width: `${progress * 100}%`
    };

    const altStyle = {
        backgroundColor: altColor
    };

    const foregroundStyle = {
      position: 'absolute',
      zIndex: '10',
    };

    const particleStyle = {
      position: 'absolute',
      zIndex: '5',
    };


    return (
      <div className={classes} onClick={this._onResolvePlayState}>
        <audio
          ref={el => this.audio = el}
          className='visualizer__audio'
          src={model.src}>
        </audio>
        <div className='progressContainer' style={altStyle}>
          <div className='progress' style={progressStyle}></div>
        </div>
        <div className='visualizer__canvas-wrapper'>
          <canvas
            ref={el => this.foregroundCanvas = el}
            className='visualizer__canvas-foreground'
            style={foregroundStyle}
            width={width}
            height={height}>
          </canvas>
          <canvas
            ref={el => this.particleCanvas = el}
            className='visualizer__canvas-particle'
            style={particleStyle}
            width={width}
            height={height}>
          </canvas>
          <canvas
            ref={el => this.backgroundCanvas = el}
            className='visualizer__canvas-background'
            width={width}
            height={height}>
          </canvas>
        </div>
      </div>
    );
  }
}

Visualizer.propTypes = {
  model: PropTypes.object.isRequired,
  options: PropTypes.object,
  className: PropTypes.string,
  extensions: PropTypes.object,
  onChange: PropTypes.func,
  onTogglePlayback: PropTypes.func,
  width: PropTypes.string,
  height: PropTypes.string,
};

function mapStateToProps(state, ownProps) {
  const { visualizer } = state;
  return {
    tracks: visualizer.tracks,
    currentTrack: visualizer.currentTrack,
    isPlaying: visualizer.isPlaying,
  };
}

export default connect(mapStateToProps)(Visualizer);
