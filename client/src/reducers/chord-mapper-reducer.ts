import {State} from "../state";
import {ReductionWithEffect} from "../core/reducers";
import {Action} from "../core/root-reducer";
import {ChordType, KeyLetter, KEYS} from "./recompute-chord-grid";
import {MAXIMUM_OCTAVE, MINIMUM_OCTAVE} from "./chord-tools-reducer";

export const FirstChordMapperKeyIndex = ((firstLetter: KeyLetter): number => {
  for(let k = 0; k < KEYS.length; k++){
    if (firstLetter === KEYS[k]){
      return k;
    }
  }
  return 0;
})('C');

//c,#,d,#,e,f,#,g,#, +  a,#,b,c,#,d,#,e,f,#,g,#,  +  a,#,b,c,#,d,#,e,f,#,g,#, + a,#,b
export const ChordMapperKeys = KEYS.slice(FirstChordMapperKeyIndex).concat(KEYS).concat(KEYS).concat(KEYS.slice(0, FirstChordMapperKeyIndex));

export interface ToggleChordMapperKey {
  type: "toggle-chord-mapper-key"
  keyIndex: number
}

export const toggleChordMapperKey = (keyIndex: number): ToggleChordMapperKey => {
  return {
    type: "toggle-chord-mapper-key",
    keyIndex
  };
};

export type ChordMapperActions =
  ToggleChordMapperKey
  ;

export const mapChordToKeys = (state: State): State => {
  if (state.selectedGridChord) {

    let tmpChordNotes = state.selectedGridChord.notes.slice();
    let chordNotes = tmpChordNotes.slice();
    for (let i = 0; i < chordNotes.length; i++) {
      let pitch = chordNotes[i];
      let newPitch = (pitch - state.octave * KEYS.length - FirstChordMapperKeyIndex) % (ChordMapperKeys.length);

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
    return on ? (mapKeyIndex + FirstChordMapperKeyIndex) % KEYS.length : -1;
  }).filter(k => k >= 0)
};

export const keysToPitchClass = (keyIndexes: number[]): number[] => {
  return keyIndexes.map(keyIndex => keyIndex - keyIndexes[0]);
};

export const mapKeysToChord = (state: State): State => {
  let keyIndexes = chordMapperKeysToKeys(state.chordMapperKeys);
  let pitchClass = keysToPitchClass(scalePitchClass((keyIndexes)));

  for (let chordRuleIndex = 0; chordRuleIndex < state.chordRules.length; chordRuleIndex++) {
    let chord = state.chordRules[chordRuleIndex];

    if (pitchClass.length !== chord.pitchClass.length) continue;

    let chordPitchClass = chord.pitchClass;
    chordPitchClass = scalePitchClass(chordPitchClass);

    let pitchClassFound = false;
    let variation;
    for (variation = 0; variation < chordPitchClass.length; variation++) {
      if (JSON.stringify(pitchClass) === JSON.stringify(chordPitchClass)) {
        pitchClassFound = true;
        break;
      }
      chordPitchClass = keysToPitchClass(nextVariation(chordPitchClass));
    }

    if(!pitchClassFound) continue;


    let baseKeyIndex = keyIndexes[variation];
    let baseKey = KEYS[baseKeyIndex];
    state.selectedKeyIndex = baseKeyIndex;

    state = {...state};
    if (variation > 0) {
      state.showingVariations = {...state.showingVariations};
      state.showingVariations[chordRuleIndex] = true;
    }

    state.suggestedGridChords = state.suggestedGridChords.slice();
    for(let octave = MINIMUM_OCTAVE; octave < MAXIMUM_OCTAVE; octave++){
      let chordNotes = scalePitchClass(pitchClass.map(pitch => pitch + keyIndexes[0] + octave * KEYS.length));
      state.suggestedGridChords.push({...chord,
        notes: chordNotes,
        baseKey: baseKey, variation: variation, chordRuleIndex: chordRuleIndex, octave: octave});
    }

    break;
  }

  return state;
};


export const reduceChordMapper = (state: State, action: Action): ReductionWithEffect<State> => {
  switch (action.type) {
    case "toggle-chord-mapper-key": {
      state = {...state};
      state.chordMapperKeys = state.chordMapperKeys.slice();
      state.chordMapperKeys[action.keyIndex] = !state.chordMapperKeys[action.keyIndex];
      state.suggestedGridChords = [];

      state = mapKeysToChord(state);

      break;
    }

  }

  return {state};
};