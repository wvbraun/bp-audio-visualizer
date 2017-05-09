import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
/* TODO: react-key-handler uses deprecated React.PropTypes */
import KeyHandler, { KEYDOWN } from 'react-key-handler';
import Visualizer from '../common/Visualizer';
import * as visualizerActions  from '../../actions/visualizerActions';
import logo from '../logo_red.svg';

/*
const keyHandlers = [
            [' ', togglePlayback],
            ['ArrowLeft', prevSong],
            ['ArrowRight', nextSong],
            ['k', togglePlayback],
            ['j', prevSong],
            ['l', nextSong],
            ['r', toggleRepeat],
            ['s', toggleShuffle],
            ['v', toggleUpdating]
        ].map(([key, handler], i) => (
            <KeyHandler key={i} keyEventName={KEYDOWN} keyValue={key} onKeyHandle={handler} />
        ));
*/

class VisualizerPage extends Component {
  constructor(props, context) {
    super(props, context);

    this.stopPropagation = this.stopPropagation.bind(this);
    this.onRenderStyle = this.onRenderStyle.bind(this);
    this.onRenderText = this.onRenderText.bind(this);
    this.onRenderTime = this.onRenderTime.bind(this);
    this.onTogglePlayback = this.onTogglePlayback.bind(this);
  }

  stopPropagation(e) {
    e.stopPropagation();
  }

  onRenderStyle(context) {

  }

  onRenderText(context) {

  }

  onRenderTime(context) {

  }

  onTogglePlayback() {
    this.props.actions.togglePlayback();
  }

  render() {
    const { tracks, isPlaying } = this.props;
    const options = {
      autoplay: false,
    };

    const width = '800px'; //(window.innerWidth / 2) + 'px'; // 800px
    const height = '400px'; //(window.innerHeight / 2) + 'px'; // 400px
    /*
    const extensions = {
      renderStyle: this.onRenderStyle,
      renderText: this.onRenderText,
      renderTime: this.onRenderTime,
    };
    */
    const keyHandlers = [
      [' ', this.onTogglePlayback],
    ].map(([key, handler], i) => (
      <KeyHandler
        key={i}
        keyEventName={KEYDOWN}
        keyValue={key}
        onKeyHandle={handler}
      />
    ));
// TODO: fix tracks && logic
// {keyHandlers}
    return (
      <div className="App">
        <img src={logo} className="App-logo" alt="logo" />
        {tracks[0] &&
          <Visualizer
            className="audio-visualizer"
            model={tracks[0]}
            options={options}
            width={width}
            height={height}
            onTogglePlayback={this.onTogglePlayback}
          />
        }
      </div>
    );
  }
}

VisualizerPage.propTypes = {
  tracks: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired,
  currentTrack: PropTypes.object,
};

function mapStateToProps(state, ownProps) {
  const { visualizer } = state;
  return {
    tracks: visualizer.tracks,
    currentTrack: visualizer.currentTrack,
    isPlaying: visualizer.isPlaying,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(visualizerActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizerPage);
