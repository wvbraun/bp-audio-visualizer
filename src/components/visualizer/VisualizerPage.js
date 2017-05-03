import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
/* TODO: react-key-handler uses deprecated React.PropTypes */
// import KeyHandler, { KEYDOWN } from 'react-key-handler';
import AudioVisualizer from './AudioVisualizer';
import Visualizer from '../common/Visualizer';
import * as visualizerActions  from '../../actions/visualizerActions';
import logo from '../logo.svg';

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
  }

  stopPropagation(e) {
    e.stopPropagation();
  }

  onRenderStyle (context) {

  }

  onRenderText (context) {

  }

  onRenderTime (context) {

  }

  render() {
    const { tracks } = this.props;
    const options = {
      autoplay: false,
    };
    const extensions = {
      renderStyle: this.onRenderStyle,
      renderText: this.onRenderText,
      renderTime: this.onRenderTime,
    };
    /*
    const keyHandlers = [
      [' ', this.togglePlayback],
    ].map(([key, handler], i) => (
      <KeyHandler
        key={i}
        keyEventName={KEYDOWN}
        keyValue={key}
        onKeyHandle={handler}
      />
    ));
        {keyHandlers}
    */
// TODO: fix tracks && logic
    return (
      <div className="App">
        <img src={logo} className="App-logo" alt="logo" />
        {tracks[0] &&
          <Visualizer
            className="audio-visualizer"
            model={tracks[0]}
            options={options}
            width="800px"
            height="400px"
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
    currentTrack: visualizer.currentTrack
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(visualizerActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(VisualizerPage);
