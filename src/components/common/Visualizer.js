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
  font: ['12px', 'Helvetica']
};

class Visualizer extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      playing: false,
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
      minutes: '00',
      seconds: '00',
      options: OPTIONS_DEFAULT,
      extensions: {},
      model: null,
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
    window.addEventListener('resize', this._onResize, true);
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

  /**
  * @description
  * Display visualizer error.
  *
  * @param {Object} error
  * @return {Function}
  * @private
  */
  _onDisplayError (error) {
    return window.console.table(error);
  }

  /**
  * @description
  * Extend constructor options.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Set canvas context.
  *
  * @return {Object}
  * @private
  */
  _setCanvasContext () {
    const canvasCtx = this.canvas.getContext('2d');

    return new Promise((resolve, reject) => {
      this.setState({ canvasCtx }, () => {
        return resolve();
      });
    });
  }

  /**
  * @description
  * Set audio context.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Set audio buffer analyser.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Set frequency data.
  *
  * @return {Object}
  * @private
  */
  _setFrequencyData () {
    const { analyser } = this.state;

    return new Promise((resolve, reject) => {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      this.setState({ frequencyData }, () => {
        return resolve();
      });
    });
  }

  /**
  * @description
  * Set media source buffer and connect processor and analyser.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Set request animation frame fn.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Set canvas gradient color.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * On playstate change.
  *
  * @param {String} state
  * @return {Function<Object>}
  * @private
  */
  _onChange (state) {
    const { onChange } = this.props;

    return onChange && onChange.call(this, { status: state });
  }

  /**
  * @description
  * On window resize
  *
  * @return {Void}
  * @private
  *
  */
  _onResize() {
    this.canvas.width = window.innerWidth / 2;
    this.canvas.height = window.innerHeight / 2;
    this._setCanvasStyles().then(() => {
      this._onRender({
        renderText: this.state.extensions.renderText,
        renderTime: this.state.extensions.renderTime
      });
    }).catch((error) => {
      this._onDisplayError(error);
    });
  }

  /**
  * @description
  * Resolve play state.
  *
  * @return {Function}
  * @private
  */
  _onResolvePlayState () {
    const { ctx } = this.state;

    if (!this.state.playing) {
      return (ctx.state === 'suspended') ?
        this._onAudioPlay() :
        this._onAudioLoad();
    } else {
      return this._onAudioPause();
    }
  }

  /**
  * @description
  * Load audio file fn.
  *
  * @return {Object}
  * @private
  */
  _onAudioLoad () {
    const { canvasCtx, model } = this.state;

    canvasCtx.fillText('Loading...', this.canvas.width / 2 + 10, this.canvas.height / 2 - 25);
    this._onChange(STATES[3]);
    /* TODO: why is the boolean needed? */
    model === this.state.model && this._onAudioPlay();

    return this;
  }

  /**
  * @description
  * Audio pause fn.
  *
  * @return {Object}
  * @private
  */
  _onAudioPause () {
    const { ctx } = this.state;

    this.setState({ playing: false }, () => {
      ctx.suspend().then(() => {
        this._onChange(STATES[2]);
      });
    });

    return this;
  }

  /**
  * @description
  * Audio stop fn.
  *
  * @return {Object}
  * @private
  */
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
          playing: false,
          animFrameId: null
        }, () => {
          return resolve();
        });
      });
    });
  }

  /**
  * @description
  * Audio play fn.
  *
  * @return {Object}
  * @private
  */
  _onAudioPlay (buffer) {
    const { audio } = this;
    const { ctx } = this.state;

    this.setState({ playing: true }, () => {
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

  /**
  * @description
  * Reset audio timer fn.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Start audio timer fn.
  *
  * @return {Object}
  * @private
  */
  _onStartTimer () {
    const interval = setInterval(() => {
      if (this.state.playing) {
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

  /**
  * @description
  * Render canvas frame.
  *
  * @return {Object}
  * @private
  */
  _onRenderFrame () {
    const {
      analyser,
      frequencyData,
      requestAnimationFrame,
    } = this.state;

    if (this.state.playing) {
      const animFrameId = requestAnimationFrame(this._onRenderFrame);

      this.setState({ animFrameId }, () => {
        analyser.getByteFrequencyData(frequencyData);
        this._onRender(this.state.extensions);
      });
    }

    return this;
  }

  /**
  * @description
  * On render frame fn.
  * Invoke each of the render extensions.
  *
  * @param {Object} extensions
  * @return {Function}
  * @private
  */
  _onRender (extensions) {
    const { canvasCtx } = this.state;

    canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    Object.keys(extensions).forEach((extension) => {
      return extensions[extension] &&
      extensions[extension].call(this, this);
    });
  }

  /**
  * @description
  * Render audio time fn.
  * Default time rendering fn.
  *
  * @return {Object}
  * @private
  */
  _onRenderTimeDefault () {
    const { canvasCtx } = this.state;

    let time = `${this.state.minutes}:${this.state.seconds}`;
    canvasCtx.fillText(time, this.canvas.width / 2 + 10, this.canvas.height / 2 + 40);
    return this;
  }

  /**
  * @description
  * Render audio artist and title fn.
  * Default text rendering fn.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @description
  * Render lounge style type.
  * Default rendering style.
  *
  * @return {Object}
  * @private
  */
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

  /**
  * @return {Object}
  * @public
  */
  render () {
    const { model, className, width, height } = this.props;
    const classes = classNames('visualizer', className);

    return (
      <div className={classes} onClick={this._onResolvePlayState}>
        <audio
          ref={el => this.audio = el}
          className='visualizer__audio'
          src={model.src}>
        </audio>
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
