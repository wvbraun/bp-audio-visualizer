import types from './actionTypes';
import VisualizerApi from '../api/mockVisualizerApi';

export function addTracksFail(message) {
  return { type: types.ADD_TRACKS_FAIL, message };
}

export function addTracksSuccess(tracks) {
  return { type: types.ADD_TRACKS_SUCCESS, tracks };
}

export function loadTracksFail(message) {
  return { type: types.LOAD_TRACKS_FAIL, message };
}

export function loadTracksSuccess(tracks) {
  return { type: types.LOAD_TRACKS_SUCCESS, tracks };
}

export function togglePlaybackFail(message) {
  return { type: types.TOGGLE_PLAYBACK_FAIL, message };
}

export function togglePlaybackSuccess() {
  return { type: types.TOGGLE_PLAYBACK_SUCCESS };
}

export function togglePlayback() {
  return (dispatch) => {
    dispatch(togglePlaybackSuccess());
  };
}

export function loadTracks() {
  return (dispatch) => {
    return VisualizerApi.getAllTracks()
      .then((tracks) => {
        dispatch(loadTracksSuccess(tracks));
      })
      .catch((error) => {
        throw(error);
      });
  };
}

export function addTracks(tracks) {
  return (dispatch) => {
    return VisualizerApi.addTracks(tracks)
      .then((addedTracks) => {
        dispatch(addTracksSuccess(addedTracks));
      })
      .catch((error) => {
        throw(error);
      });
  };
}
