import { Utils } from './utils'

export class Duration {
  constructor (code, tuplet, tupletDivider) {
    this.code = code
    this.tuplet = tuplet
    this.tupletDivider = tupletDivider
    this.units = Duration._units(this.code)
    if (tuplet) {
      // for a simple triplet in binary time: triplet = 3, tupletDivider = 2
      if (!Number.isInteger(tuplet) || tuplet < 2) throw new Error('Duration: tuplet must be an integer >= 2')
      if (!Number.isInteger(tupletDivider) || tupletDivider < 2) throw new Error('Duration: tupletDivider must be an integer >= 2')
      this.units /= tuplet / tupletDivider
    }
  }

  //
  // Read-only API
  //

  // If this represents a beat duration, return true if this is a ternary beat
  ternary () {
    return Utils.almostZero(this.units % 3)
  }

  // If other is also a Duration, return true iff same number of units.
  equals (other) {
    return other && this.units === other.units
  }

  // Return string representation: code and tuplet ratio of any
  toString () {
    let tupletRatio = this.tuplet ? '^' + this.tuplet + ':' + this.tupletDivider : ''
    return `${this.code}${tupletRatio}`
  }

  //
  // Immutable API. These methods return a new Duration object
  //

  // Multiply duration by given factor.
  // If the resulting duration cannot be expressed with a single code, an Error is thrown.
  times (factor) {
    for (let code of [':w', ':h', ':q', ':8', ':16', ':32']) {
      if (Utils.almostEqual(Duration._units(code + 'd'), this.units * factor)) return new Duration(code + 'd', this.tuplet, this.tupletDivider)
      if (Utils.almostEqual(Duration._units(code), this.units * factor)) return new Duration(code, this.tuplet, this.tupletDivider)
    }
    throw new Error('Duration.times: there exists no duration code corresponding to ' + (this.units * factor) + ' units')
  }

  static valid (code) {
    try { return Duration._units(code) } catch (e) { }
    return false
  }

  //
  // Private stuff
  //

  // Return nominal number of units (i.e. out of any tuplet) for given code
  static _units (code) {
    if (code === ':32') return 2
    if (code === ':16') return 4
    if (code === ':8') return 8
    if (code === ':q') return 16
    if (code === ':h') return 32
    if (code === ':w') return 64

    if (code === ':32d') return 3
    if (code === ':16d') return 6
    if (code === ':8d') return 12
    if (code === ':qd') return 24
    if (code === ':hd') return 48
    if (code === ':wd') return 96

    throw new Error('Invalid duration code "' + code + '"')
  }
}
