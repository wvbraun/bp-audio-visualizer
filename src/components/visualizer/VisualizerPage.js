import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import KeyHandler, { KEYDOWN } from 'react-key-handler';
import * as visualizerActions  from "../../actions/visualizerActions";
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

    this.togglePlayback = this.togglePlayback.bind(this);
    this.stopPropagation = this.stopPropagation.bind(this);
  }

  togglePlayback() {
    this.props.actions.togglePlayback();
  }

  stopPropagation(e) {
    e.stopPropagation();
  }

  render() {
    const { tracks } = this.props;
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

    return (
      <div className="App" onClick={this.togglePlayback}>
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

VisualizerPage.propTypes = {
  tracks: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired,
  playing: PropTypes.object,
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
