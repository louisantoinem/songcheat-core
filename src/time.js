import { Duration } from './duration'

export class Time {
  constructor (beat, beatsPerBar, symbol) {
    if (!(beat instanceof Duration)) throw new Error(`new Time: beat must be a Duration (got ${typeof beat})`)
    if (!Number.isInteger(beatsPerBar)) throw new Error(`new Time: beatsPerBar must be an integer number (got ${typeof beatsPerBar} ${beatsPerBar})`)
    this.beat = beat
    this.beatsPerBar = beatsPerBar
    this.bar = beat.times(this.beatsPerBar)
    this.symbol = symbol
  }

  //
  // Read-only API
  //

  // Return true if the beat is ternary (compound time)
  compound () {
    return this.beat.ternary()
  }

  // Return string representation
  toString () {
    return `${this.symbol} (${this.beatsPerBar} beats of ${this.beat} making a bar of ${this.bar})`
  }
}
