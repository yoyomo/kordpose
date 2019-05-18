import React from 'react';
import {CHORD_RULES} from "./constants/all-chords";

export interface ClassAndChildren {
  className?: string,
  children?: React.ReactNode
}

interface ChordElementProps extends ClassAndChildren {
  chord: ChordType
}

let audioContext: AudioContext;

class ChordElement extends React.Component<ChordElementProps & ClassAndChildren> {


  render() {
    return (
        <div className={"bg-light-red w-100px h-100px white dib tc v-mid pointer ma2 br3"}
             onClick={this.playChord}>
          <div className="">
            {this.props.chord.baseKey + this.props.chord.symbol}
          </div>
        </div>
    );
  }

  constructor(props: ChordElementProps) {
    super(props);
    audioContext = new AudioContext();
  }

  playChord = () => {

    this.props.chord.pitchClass.map(noteIndex => {
      if (noteIndex < 0 || noteIndex >= notes.length) {
        return null;
      }
      let noteValue = notes[noteIndex];

      let osc1 = audioContext.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = noteValue;

      let gain = audioContext.createGain();
      osc1.connect(gain);
      gain.connect(audioContext.destination);

      let now = audioContext.currentTime;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.start(now);
      osc1.stop(now + 0.5);
      return osc1;
    });
  }
}


const recalculateAllNotes = (baseFrequency = 440): number[] => {
  const NUMBER_OF_NOTES = 88;
  let notes = [];

  for (let n = 0; n < NUMBER_OF_NOTES; n++) {
    notes[n] = Math.pow(2, ((n + 1) - 49) / 12) * baseFrequency;
  }

  return notes;
};

export interface ChordType extends ChordRuleVariationType {
  baseKey: string,
}

export interface ChordRuleVariationType extends ChordRuleType {
  inversion: number,
}

export interface ChordRuleType {
  name: string,
  symbol: string,
  pitchClass: number[],
  quality: string,
}

let fs = require('fs');
const recalculateChordRules = (): ChordRuleVariationType[] => {
  let chordRules: ChordRuleVariationType[] = [];

  CHORD_RULES.map(chordRule => {
    let pitchClass = chordRule.pitchClass;

    for (let i = 0; i < pitchClass.length; i++) {
      while (i > 0 && pitchClass[i] < pitchClass[i - 1]) {
        pitchClass[i] += 12;
      }
    }

    for (let i = 0; i < chordRule.pitchClass.length; i++) {
      if (i > 0) {
        let firstPitch = pitchClass.shift();
        if (firstPitch) {
          pitchClass.push(firstPitch)
        }
      }
      chordRules.push({...chordRule, pitchClass: pitchClass, inversion: i});
    }
  });
  console.log(fs);

  fs.writeFile('data/chord-rules.ts', "export const CHORD_RULES_WITH_VARIATIONS = "+JSON.stringify(chordRules));

  return chordRules;
};

const recalculateAllChords = (): ChordType[] => {
  let chords: ChordType[] = [];

  let keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  for (let n = 0; n < notes.length; n++) {
    let baseKey = keys[n % keys.length];
    for (let c = 0; c < chordRules.length; c++) {
      let chordRule = chordRules[c];
      let pitchClass = chordRule.pitchClass;

      for (let i = 0; i < pitchClass.length; i++) {
        pitchClass[i] += n;
      }

      chords.push({
        ...chordRule,
        pitchClass: pitchClass,
        baseKey: baseKey,
      });
    }

  }

  fs.writeFile('data/chords.ts', "export const CHORDS = "+JSON.stringify(chords));

  return chords;
};

let notes = recalculateAllNotes();
// const chordRules = CHORD_RULES_WITH_VARIATIONS || recalculateChordRules();
const chordRules: ChordRuleVariationType[] = recalculateChordRules();
// const chords: ChordType[] = CHORDS || recalculateAllChords();
const chords: ChordType[] = recalculateAllChords();

const App: React.FC = () => {

  return (
      <div className={""}>
        {chords.map((chord, c) => {
          return <ChordElement chord={chord} key={"chord-" + c}/>
        })}
      </div>
  );
};

export default App;
