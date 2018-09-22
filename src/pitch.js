import { Utils } from './utils'

let NOTES = { 'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2 }
let A4 = 440

export class Pitch {
  constructor (code) {
    this.code = code

    // Parse code
    this.note = null
    this.alter = null
    this.octave = null

    if (code.length === 3) {
      if (typeof NOTES[code[0]] !== 'undefined') this.note = code[0]
      this.alter = code[1]
      this.octave = parseInt(code[2])
    } else if (code.length === 2) {
      if (typeof NOTES[code[0]] !== 'undefined') this.note = code[0]
      this.octave = parseInt(code[1])
    }

    if (this.note === null) throw new Error('Invalid pitch code "' + code + '"')

    // Compute frequency
    let halfTonesFromA = NOTES[this.note] + (this.alter === 'b' ? -1 : (this.alter === '#' ? 1 : 0))
    this.frequency = A4 * Math.pow(Math.pow(2, 1 / 12), halfTonesFromA) * Math.pow(2, this.octave - 4)
    this.frequency = Utils.round(this.frequency, 1)
  }

  //
  // Read-only API
  //

  // If other is also a Pitch, return true iff same frequency.
  equals (other) {
    return other && this.frequency === other.frequency
  }

  // Return string representation (code)
  toString (detailed) {
    return detailed ? `${this.code} (${this.frequency} Hz)` : `${this.code}`
  }

  // Return vextab representation
  vextab () {
    return `${this.note}${this.alter || ''}/${this.octave + 1}`
  }

  //
  // Immutable API. These methods return a new Pitch object
  //

  // Transpose by given number of half tones (which can be negative).
  transpose (halfTones) {
    let pitch = new Pitch(this.code)

    let target = NOTES[pitch.note] + parseInt(halfTones)

    while (target < -9) {
      pitch.octave--
      target += 12
    }

    while (target > 2) {
      pitch.octave++
      target -= 12
    }

    for (let N in NOTES) {
      if (NOTES[N] === target) pitch.note = N
    }

    return new Pitch(pitch.note[0] + (pitch.note[1] === '#' ? '#' : '') + pitch.octave)
  }
}
