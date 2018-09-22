import { Tuning } from './tuning'

export class Fretboard {
  constructor (tuning, capo) {
    this.tuning = tuning || new Tuning('standard')
    this.capo = capo || 0
  }

  //
  // Read-only API
  //

  // Returns Pitch for given string and fret
  pitch (string, fret) {
    return this.tuning.pitch(string).transpose(this.capo + fret)
  }

  chordPitches (chord) {
    let pitches = []
    for (let i = 0; i < chord.tablature.length; i++) {
      // string will be between 6 and 1 since this.chord.tablature.length has been verified and is 6
      let string = 6 - i
      let fret = chord.tablature[i]
      if (fret !== 'x') pitches.push(this.pitch(string, parseInt(fret, 10)))
    }
    return pitches
  }

  // Return string representation
  toString () {
    return `${this.tuning} /C${this.capo}`
  }
}
