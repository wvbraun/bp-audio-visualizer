import { combineReducers } from "redux";
import visualizer from "./visualizerReducer";

const rootReducer = combineReducers({
  visualizer: visualizer
});

export default rootReducer;
