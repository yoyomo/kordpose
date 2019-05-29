import {State} from "../state";
import {Action} from "../react-root";

export interface DecreaseOctaveAction {
  type: "decrease-octave"
}

export const decreaseOctave = (): DecreaseOctaveAction => {
  return {
    type: "decrease-octave",
  };
};

export interface IncreaseOctaveAction {
  type: "increase-octave"
}

export const increaseOctave = (): IncreaseOctaveAction => {
  return {
    type: "increase-octave",
  };
};

export const MAXIMUM_OCTAVE = 5;
export const MINIMUM_OCTAVE = 0;

export type ChordToolsActions =
  DecreaseOctaveAction
  | IncreaseOctaveAction;

export const reduceChordTools = (state: State, action: Action): State => {
  switch (action.type) {

    case "decrease-octave": {
      state = {...state};
      state.octave--;
      if (state.octave < MINIMUM_OCTAVE) {
        state.octave = MINIMUM_OCTAVE;
      }
      break;
    }

    case "increase-octave": {
      state = {...state};
      state.octave++;
      if (state.octave > MAXIMUM_OCTAVE) {
        state.octave = MAXIMUM_OCTAVE;
      }
      break;
    }
  }

  return state;
};