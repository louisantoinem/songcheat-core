import { Utils } from './utils'

let ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export class Mode {
  // intervals is an array of integer; the sum of its values must be 12
  constructor (intervals, chords) {
    if (!(intervals instanceof Array)) throw new Error(`Invalid mode definition: intervals must be an array`)
    let sum = intervals.reduce((acc, val) => acc + val, 0)
    if (sum !== 12) throw new Error(`Invalid mode definition: sum of ${intervals} is not 12`)
    this.intervals = intervals

    if (chords) {
      if (!(chords instanceof Array)) throw new Error(`Invalid mode definition: chords must be an array`)
      if (chords.length !== intervals.length) throw new Error(`Invalid mode definition: number of chords != number of intervals`)
      for (let chord of chords) if (!['m', '', '°'].includes(chord)) throw new Error(`Invalid mode definition: invalid chord ${chord}`)
      this.chords = chords
    }
  }

  //
  // Read-only API
  //

  degrees (degrees) {
    if (!this.chords) throw new Error(`This mode was not created with the 'chords' parameter`)
    return (degrees || Utils.range(this.intervals.length)).map(degree => ROMAN[degree - 1] + this.chords[degree - 1])
  }

  // If other is also a Mode, return true iff same intervals.
  equals (other) {
    return other && Utils.arraysEqual(this.intervals, other.intervals)
  }

  // Return string representation
  toString () {
    return `${this.intervals}`
  }
}
