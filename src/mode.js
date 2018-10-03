import { Utils } from './utils'

export class Mode {
  // intervals is an array of integer; the sum of its values must be 12
  constructor (intervals) {
    if (!(intervals instanceof Array)) throw new Error(`Invalid mode definition: intervals must be an array`)
    let sum = intervals.reduce((acc, val) => acc + val, 0)
    if (sum !== 12) throw new Error(`Invalid mode definition: sum of ${intervals} is not 12`)
    this.intervals = intervals
  }

  //
  // Read-only API
  //

  // If other is also a Mode, return true iff same intervals.
  equals (other) {
    return other && Utils.arraysEqual(this.intervals, other.intervals)
  }

  // Return string representation
  toString () {
    return `${this.intervals}`
  }
}
