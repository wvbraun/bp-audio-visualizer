import React from 'react';
import ReactDOM from 'react-dom';
import configureStore from "./store/configureStore";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from 'react-router-dom';
import { loadTracks } from "./actions/visualizerActions";
import App from './components/App';
import './styles/index.css';

const store = configureStore();
store.dispatch(loadTracks());

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root')
);
