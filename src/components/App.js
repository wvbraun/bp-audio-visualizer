import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import VisualizerPage from './visualizer/VisualizerPage';
import '../styles/App.css';

class App extends Component {
  render() {
    return (
      <div>
        <Switch>
          <Route exact path='/' component={VisualizerPage} />
        </Switch>
      </div>
    );
  }
}

/*
App.propTypes = {
  children: PropTypes.object.isRequired
};
*/

export default App;
