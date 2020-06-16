import { Utils } from './utils'

let ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export class Mode {
  // intervals is an array of integer; the sum of its values must be 12
  constructor (intervals, chordQualities) {
    if (!(intervals instanceof Array)) throw new Error(`Invalid mode definition: intervals must be an array`)
    let sum = intervals.reduce((acc, val) => acc + val, 0)
    if (sum !== 12) throw new Error(`Invalid mode definition: sum of ${intervals} is not 12`)
    this.intervals = intervals

    if (chordQualities) {
      if (!(chordQualities instanceof Array)) throw new Error(`Invalid mode definition: chordQualities must be an array`)
      if (chordQualities.length !== intervals.length) throw new Error(`Invalid mode definition: number of chordQualities != number of intervals`)
      for (let chordQuality of chordQualities) if (!['m', '', '°'].includes(chordQuality)) throw new Error(`Invalid mode definition: invalid chordQuality ${chordQuality}`)
      this.chordQualities = chordQualities
    }
  }

  //
  // Read-only API
  //

  degrees (degrees) {
    if (!this.chordQualities) throw new Error(`This mode was not created with the 'chordQualities' parameter`)
    return (degrees || Utils.range(this.intervals.length)).map(degree => this.display(ROMAN[degree - 1], this.chordQualities[degree - 1]))
  }

  display (degree, chordQuality) {
    if (chordQuality === '') return degree
    if (chordQuality === 'm') return degree.toLowerCase()
    if (chordQuality === '°') return degree.toLowerCase() + chordQuality
    throw new Error(`Invalid mode definition: invalid chordQuality ${chordQuality}`)
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
