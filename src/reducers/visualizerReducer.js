import initialState from "./initialState";
import types from "../actions/actionTypes";

export default function visualizerReducer(state = initialState.visualizer, action) {
  switch (action.type) {
    case types.LOAD_TRACKS_SUCCESS:
      return Object.assign({}, state, {
        tracks: action.tracks
      });

    case types.ADD_TRACKS_SUCCESS:
      return Object.assign({}, state, {
        tracks: [
          ...state.tracks,
          Object.assign({}, action.tracks)
        ]
      });

    case types.TOGGLE_PLAYBACK_SUCCESS:
      return Object.assign({}, state, {
        playing: !state.playing
      });

    default:
      return state;
  }
}
