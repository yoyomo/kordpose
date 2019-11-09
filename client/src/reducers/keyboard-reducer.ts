import { State } from "../state";
import { ReductionWithEffect } from "../core/reducers";
import { Action } from "../core/root-reducer";
import { ChordType, KEYS } from "./recompute-chord-grid";
import { MAXIMUM_OCTAVE, MINIMUM_OCTAVE } from "./chord-tools-reducer";
import { Effect } from "../core/services/services";
import { playSoundEffect } from "../core/services/sound-service";
import {acceptExternalInput, cancelExternalInput} from "../core/services/external-input-service";

export const ChordMapperKeys = KEYS.concat(KEYS).concat(KEYS).concat(KEYS[0]);

export type ToggleChordMapperKeyAction = {
  type: "toggle-chord-mapper-key"
  keyIndex: number
}

export const toggleKeyboardKey = (keyIndex: number): ToggleChordMapperKeyAction => {
  return {
    type: "toggle-chord-mapper-key",
    keyIndex
  };
};

export type SelectChordAction = {
  type: "select-chord"
  chord: ChordType
}

export const selectChord = (chord: ChordType): SelectChordAction => {
  return {
    type: "select-chord",
    chord
  };
};

export type KeyBoardMapType = 'keys' | 'chords' | 'none';

export type ChangeKeyboardMapAction = {
  type: "change-keyboard-map"
  keyboardMap: KeyBoardMapType
}

export const changeKeyboardMap = (keyboardMap: KeyBoardMapType): ChangeKeyboardMapAction => {
  return {
    type: "change-keyboard-map",
    keyboardMap
  };
};

export type ChordMapperActions =
  | ToggleChordMapperKeyAction
  | SelectChordAction
  | ChangeKeyboardMapAction
  ;

export const mapChordToKeys = (state: State): State => {
  if (state.selectedGridChord) {

    let tmpChordNotes = state.selectedGridChord.notes.slice();
    let chordNotes = tmpChordNotes.slice();
    for (let i = 0; i < chordNotes.length; i++) {
      let pitch = chordNotes[i];
      let newPitch = (pitch - state.octave * KEYS.length) % (ChordMapperKeys.length);

      tmpChordNotes[i] = newPitch;
      if (tmpChordNotes[0] < 0) {
        newPitch += KEYS.length;
      }
      chordNotes[i] = newPitch;
    }
    state.chordMapperKeys = ChordMapperKeys.map((key, i) => {
      return chordNotes.includes(i);
    });
  }

  return state;
};

export const scalePitchClass = (pitchClass: number[]): number[] => {
  let scaledPitchClass = pitchClass.slice();
  for (let p = 1; p < scaledPitchClass.length; p++) {
    while (scaledPitchClass[p - 1] >= scaledPitchClass[p]) {
      scaledPitchClass[p] += KEYS.length;
    }
  }
  return scaledPitchClass;
};

export const nextVariation = (pitchClass: number[]): number[] => {
  return scalePitchClass(pitchClass.slice(1).concat(pitchClass[0]));
};

export const chordMapperKeysToKeys = (chordMapperKeys: boolean[]): number[] => {
  return chordMapperKeys.map((on, mapKeyIndex) => {
    return on ? (mapKeyIndex) % KEYS.length : -1;
  }).filter(k => k >= 0)
};

export const keysToPitchClass = (keyIndexes: number[]): number[] => {
  return keyIndexes.map(keyIndex => keyIndex - keyIndexes[0]);
};

export const mapKeysToChord = (state: State): State => {
  state = { ...state };
  state.suggestedGridChords = [];
  state.suggestedKeyIndexes = [];

  let keyIndexes = chordMapperKeysToKeys(state.chordMapperKeys);
  let pitchClass = keysToPitchClass(scalePitchClass((keyIndexes)));

  for (let chordRuleIndex = 0; chordRuleIndex < state.chordRules.length; chordRuleIndex++) {

    let chord = state.chordRules[chordRuleIndex];

    if (pitchClass.length !== chord.pitchClass.length) continue;

    let chordPitchClass = chord.pitchClass;
    chordPitchClass = scalePitchClass(chordPitchClass);

    for (let variation = 0; variation < chordPitchClass.length; variation++) {
      if (variation > 0) chordPitchClass = keysToPitchClass(nextVariation(chordPitchClass));

      if (JSON.stringify(pitchClass) !== JSON.stringify(chordPitchClass)) continue;

      let baseKeyIndex = keyIndexes[(keyIndexes.length - variation) % keyIndexes.length];
      let baseKey = KEYS[baseKeyIndex];
      state.suggestedKeyIndexes.push(baseKeyIndex);

      state.suggestedGridChords = state.suggestedGridChords.slice();
      for (let octave = MINIMUM_OCTAVE; octave <= MAXIMUM_OCTAVE; octave++) {
        let chordNotes = scalePitchClass(pitchClass.map(pitch => pitch + keyIndexes[0] + octave * KEYS.length));
        state.suggestedGridChords.push({
          ...chord,
          notes: chordNotes,
          baseKey: baseKey, variation: variation, chordRuleIndex: chordRuleIndex, octave: octave
        });
      }

    }
  }

  return state;
};


export const reduceChordMapper = (state: State, action: Action): ReductionWithEffect<State> => {
  let effects: Effect[] = [];
  switch (action.type) {
    case "toggle-chord-mapper-key": {
      state = { ...state };
      state.chordMapperKeys = state.chordMapperKeys.slice();
      state.chordMapperKeys[action.keyIndex] = !state.chordMapperKeys[action.keyIndex];

      state = mapKeysToChord(state);

      let noteIndex = action.keyIndex + (state.octave * KEYS.length);
      effects = effects.concat(playSoundEffect(noteIndex, state.notes, state.audioContext, state.waveType, state.soundOn))

      break;
    }

    case "select-chord": {
      state = { ...state };
      state.selectedGridChord = action.chord;

      state = mapChordToKeys(state);
      state = mapKeysToChord(state);

      break;
    }

    case "change-keyboard-map": {
      state = {...state};
      state.inputs = {...state.inputs};
      state.inputs.mapKeyboardTo = action.keyboardMap;

      if(action.keyboardMap === "none"){
        effects = effects.concat(cancelExternalInput());
      } else {
        effects = effects.concat(acceptExternalInput(action.keyboardMap));
      }
      break;
    }

  }

  return { state, effects };
};