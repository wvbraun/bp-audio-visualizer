import React, { Component } from 'react';
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
  if (hh < 10) {hh = "0"+hh;}
  if (mm < 10) {mm = "0"+mm;}
  if (ss < 10) {ss = "0"+ss;}
  */
  // new Date(0).toISOString() => "1970-01-01T00:00:00.000Z"
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
      gradient: null,
      canvasCtx: null,
      interval: null,
      duration: null,
      options: OPTIONS_DEFAULT,
      extensions: {},
      model: null,
      progress: 0
    };

    this._extend = this._extend.bind(this);
    this._setCanvasContext = this._setCanvasContext.bind(this);
    this._setContext = this._setContext.bind(this);
    this._setAnalyser = this._setAnalyser.bind(this);
    this._setSourceNode = this._setSourceNode.bind(this);
    this._setRequestAnimationFrame = this._setRequestAnimationFrame.bind(this);
    this._setCanvasStyles = this._setCanvasStyles.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onResolvePlayState = this._onResolvePlayState.bind(this);
    this._onAudioLoad = this._onAudioLoad.bind(this);
    this._onAudioPause = this._onAudioPause.bind(this);
    this._onAudioStop = this._onAudioStop.bind(this);
    this._onAudioPlay = this._onAudioPlay.bind(this);
    this._onResetTimer = this._onResetTimer.bind(this);
    this._onStartTimer = this._onStartTimer.bind(this);
    this._onRenderFrame = this._onRenderFrame.bind(this);
    this._onRender = this._onRender.bind(this);
    this._onRenderTimeDefault = this._onRenderTimeDefault.bind(this);
    this._onRenderTextDefault = this._onRenderTextDefault.bind(this);
    this._onRenderStyleDefault = this._onRenderStyleDefault.bind(this);
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
      this._onResetTimer().then(() => {
        this._onRender({
          renderText: this.state.extensions.renderText,
          renderTime: this.state.extensions.renderTime
        });
        this.state.options.autoplay && this._onResolvePlayState();
      });
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
    }
  }

  componentWillUnmount () {
    this.state.ctx.close();
  }

  _onDisplayError (error) {
    return window.console.table(error);
  }

  _extend () {
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

  _setCanvasContext () {
    const canvasCtx = this.canvas.getContext('2d');

    return new Promise((resolve, reject) => {
      this.setState({ canvasCtx }, () => {
        return resolve();
      });
    });
  }

  _setContext () {
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

  _setAnalyser () {
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

  _setFrequencyData () {
    const { analyser } = this.state;

    return new Promise((resolve, reject) => {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      this.setState({ frequencyData }, () => {
        return resolve();
      });
    });
  }

  _setSourceNode() {
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

  _setRequestAnimationFrame () {
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

  _setCanvasStyles () {
    const { canvasCtx } = this.state;
    const { barColor, shadowBlur, shadowColor, font } = this.state.options;

    let gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(1, barColor);

    const ctx = Object.assign(canvasCtx, {
      fillStyle: gradient,
      shadowBlur: shadowBlur,
      shadowColor: shadowColor,
      font: font.join(' '),
      textAlign: 'center'
    });

    return new Promise((resolve, reject) => {
      this.setState({
        gradient: gradient,
        canvasCtx: ctx,
      }, () => {
        return resolve();
      });
    });
  }

  _onChange (state) {
    const { onChange } = this.props;

    return onChange && onChange.call(this, { status: state });
  }

  _onResize() {
    if (this.canvas.width !== window.innerWidth / 2) {
      this.canvas.width = window.innerWidth / 2;
    }
    if (this.canvas.height !== window.innerHeight / 2) {
      this.canvas.height = window.innerHeight / 2;
    }
    this._setCanvasStyles().then(() => {
      this._onRender({
        renderText: this.state.extensions.renderText,
        renderTime: this.state.extensions.renderTime
      });
    }).catch((error) => {
      this._onDisplayError(error);
    });
  }

  _onResolvePlayState () {
    const { ctx } = this.state;

    if (!this.state.isPlaying) {
      return (ctx.state === 'suspended') ?
        this._onAudioPlay() :
        this._onAudioLoad();
    } else {
      return this._onAudioPause();
    }
  }

  _onAudioLoad () {
    const { canvasCtx, model } = this.state;

    canvasCtx.fillText('Loading...', this.canvas.width / 2 + 10, this.canvas.height / 2 - 25);
    this._onChange(STATES[3]);
    /* TODO: why is the boolean needed? */
    model === this.state.model && this._onAudioPlay();

    return this;
  }

  _onAudioPause () {
    const { ctx } = this.state;

    this.setState({ isPlaying: false }, () => {
      ctx.suspend().then(() => {
        this._onChange(STATES[2]);
      });
    });

    return this;
  }

  _onAudioStop () {
    const { canvasCtx, ctx } = this.state;

    return new Promise((resolve, reject) => {
      window.cancelAnimationFrame(this.state.animFrameId);
      clearInterval(this.state.interval);
      this.state.sourceNode.disconnect();
      canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this._onChange(STATES[0]);

      this._onResetTimer().then(() => {
        ctx.resume();
      }).then(() => {
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

  _onAudioPlay (buffer) {
    const { audio } = this;
    const { ctx } = this.state;

    this.setState({ isPlaying: true }, () => {
      this._onChange(STATES[1]);

      if (ctx.state === 'suspended') {
        ctx.resume();
        return this._onRenderFrame();
      }

      audio.play();
      this._onResetTimer().then(() => {
        this._onStartTimer()
        this._onRenderFrame();
      });
    });

    return this;
  }

  _onResetTimer () {
    return new Promise((resolve, reject) => {
      this.setState({
        duration: (new Date(0, 0)).getTime(),
        minutes: '00',
        seconds: '00'
      }, () => {
        return resolve();
      });
    });
  }

  _onStartTimer () {
    const interval = setInterval(() => {
      if (this.state.isPlaying) {
        let now = new Date(this.state.duration);
        let min = now.getHours();
        let sec = now.getMinutes() + 1;

        this.setState({
          minutes: (min < 10) ? `0${min}` : min,
          seconds: (sec < 10) ? `0${sec}` : sec,
          duration: now.setMinutes(sec)
        });
      }
    }, 1000);

    this.setState({ interval });
    return this;
  }

  _onRenderFrame () {
    const {
      analyser,
      frequencyData,
      requestAnimationFrame,
    } = this.state;

    if (this.state.isPlaying) {
      const animFrameId = requestAnimationFrame(this._onRenderFrame);

      this.setState({ animFrameId }, () => {
        analyser.getByteFrequencyData(frequencyData);
        this._onRender(this.state.extensions);
      });
    }

    return this;
  }

  _onRender (extensions) {
    const { canvasCtx } = this.state;

    canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    Object.keys(extensions).forEach((extension) => {
      return extensions[extension] &&
      extensions[extension].call(this, this);
    });
  }

  _onRenderTimeDefault () {
    const { audio, canvas } = this;
    const { canvasCtx } = this.state;

    //let time = `${this.state.minutes}:${this.state.seconds}`;
    let time = secondsToTime(audio.currentTime);
    if (audio.duration) {
      this.setState({ progress: audio.currentTime / audio.duration });
    }
    canvasCtx.fillText(time, canvas.width / 2 + 10, canvas.height / 2 + 40);
    return this;
  }

  _onRenderTextDefault () {
    const { canvasCtx, model } = this.state;
    const { font } = this.state.options;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const fontAdjustment = 6;
    const alignAdjustment = 8;

    canvasCtx.textBaseline = 'top';
    canvasCtx.fillText(`by ${model.artist}`, cx + alignAdjustment, cy);
    canvasCtx.font = `${parseInt(font[0], 10) + fontAdjustment}px ${font[1]}`;
    canvasCtx.textBaseline = 'bottom';
    canvasCtx.fillText(model.title, cx + alignAdjustment, cy);
    canvasCtx.font = font.join(' ');

    return this;
  }

  _onRenderStyleDefault () {
    const { frequencyData, canvasCtx } = this.state;
    const { barWidth, barHeight, barSpacing } = this.state.options;

    const radiusReduction = 70;
    const amplitudeReduction = 6;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = Math.min(cx, cy) - radiusReduction;
    const maxBarNum = Math.floor((radius * 2 * Math.PI) / (barWidth + barSpacing));
    const slicedPercent = Math.floor((maxBarNum * 25) / 100);
    const barNum = maxBarNum - slicedPercent;
    const freqJump = Math.floor(frequencyData.length / maxBarNum);

    for (let i = 0; i < barNum; i++) {
      const amplitude = frequencyData[i * freqJump];
      const theta = (i * 2 * Math.PI ) / maxBarNum;
      const delta = (3 * 45 - barWidth) * Math.PI / 180;
      const x = 0;
      const y = radius - (amplitude / 12 - barHeight);
      const w = barWidth;
      const h = amplitude / amplitudeReduction + barHeight;

      canvasCtx.save();
      canvasCtx.translate(cx + barSpacing, cy + barSpacing);
      canvasCtx.rotate(theta - delta);
      canvasCtx.fillRect(x, y, w, h);
      canvasCtx.restore();
    }

    return this;
  }

  render () {
    const { progress } = this.state;
    const { model, className, width, height } = this.props;
    const { altColor, textColor } = this.state.options;
    const classes = classNames('visualizer', className);

    const progressStyle = {
        backgroundColor: textColor,
        width: `${progress * 100}%`
    };

    const altStyle = {
        backgroundColor: altColor
    }

    return (
      <div className={classes} onClick={this._onResolvePlayState}>
        <audio
          ref={el => this.audio = el}
          className='visualizer__audio'
          src={model.src}>
        </audio>
        <div className="progressContainer" style={altStyle}>
          <div className="progress" style={progressStyle}></div>
        </div>
        <div className='visualizer__canvas-wrapper'>
          <canvas
            ref={el => this.canvas = el}
            className='visualizer__canvas'
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
  width: PropTypes.string,
  height: PropTypes.string,
};

export default Visualizer;
