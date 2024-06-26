import * as React from 'react'
import { ClassAndChildren } from "../core/reducers";
import { ChordType } from "../reducers/recompute-chord-grid";
import { SVGStar } from "./svgs";
import { SyntheticEvent } from "react";

export const Star = ({isStarred, ...domProps}) => (
  <div className={`absolute top-0 left-0 ${isStarred ? 'fill-gold' : 'stroke-gold fill-none'}`} {...domProps}>
    <SVGStar />
  </div>
)

interface ChordElementProps extends ClassAndChildren {
  chord: ChordType
  notes: number[]
  audioContext: AudioContext
  onSelect: () => void
  isSelected: boolean
  isSuggested: boolean
  onStar: () => void
  showStar: boolean
  isStarred: boolean
  isFlashing?: boolean
}

export class ChordElement extends React.Component<ChordElementProps> {
  clickHandled = false;

  render() {
    let highlightColor;

    if (this.props.isSelected) {
      highlightColor = 'shadow-2-skyblue';
    } else if (this.props.isSuggested) {
      highlightColor = 'shadow-2-red';
    }

    return (
      <div
        className={`${this.props.chord.variation === 0 ? "bg-gray light-gray" : "bg-light-gray dark-gray"}`+
          ` ${highlightColor}`+
          ` ${this.props.isFlashing ? 'flex flex-column w4 h4 justify-center items-center f2 di' : 'w3 h3 pt3'} dib tc v-mid pointer ma2  br3 relative shadow-4 no-select`}
        // style={{backgroundColor: this.getColor()}}
        onMouseDown={this.onClick}
        onMouseUp={this.onClickEnd}
        onTouchStart={this.onClick}
        onTouchEnd={this.onClickEnd}
      >
        <div className="">
          {this.props.chord.baseKey + this.props.chord.symbol}
        </div>
        {this.props.chord.variation > 0 &&
          <div>
            {this.props.chord.variation}
          </div>
        }
        {this.props.showStar && <Star isStarred={this.props.isStarred} onClick={this.props.onStar}/>}
        <div className="absolute bottom-0 right-5px o-70 f6">
          o{this.props.chord.octave}
        </div>
        {this.props.children}
      </div>
    );
  }

  onClickEnd = (e: SyntheticEvent<any>) => {
    this.clickHandled = false;
  };

  onClick = (e: SyntheticEvent<any>) => {
    if (this.clickHandled) {
      return;
    }

    if (e.type === "touchstart") {
      this.clickHandled = true;
    }

    this.props.onSelect();
  };

  normalize = (x: number, minX: number, maxX: number, minY: number, maxY: number) => {
    return ((x - minX) / (maxX - minX)) * (maxY - minY) + minY;
  };

  getColor = () => {
    let totalFrequency = 0;
    this.props.chord.pitchClass.map(pitch => {
      let noteFrequency = this.props.notes[pitch];
      if (totalFrequency === 0) {
        totalFrequency = noteFrequency
      } else {
        totalFrequency = 2 * Math.sin((totalFrequency + noteFrequency) / 2) * Math.cos((totalFrequency - noteFrequency) / 2);
      }
      return noteFrequency;
    });

    let normalizedFreq = this.normalize(totalFrequency, -1, 2, 0, 16777215);
    normalizedFreq = Math.floor(normalizedFreq);
    return `#${normalizedFreq.toString(16)}`;
  };

}
