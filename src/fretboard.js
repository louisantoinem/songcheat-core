import { Chord } from './chord'
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

      // string not played in this chord
      if (chord.tablature[i] === 'x') continue

      // get fret number
      let fret = Chord.char2fret(chord.tablature[i])

      // add pitch for this string and fret
      pitches.push(this.pitch(string, fret))
    }
    return pitches
  }

  // Return string representation
  toString () {
    return `${this.tuning} /C${this.capo}`
  }
}
