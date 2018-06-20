import { Utils } from './utils'
import { Duration } from './duration'
import { Time } from './time'

export class Interval {
  constructor (time, duration) {
    if (!(time instanceof Time)) throw new Error(`new Interval: time must be a Time (got ${typeof time})`)
    if (duration && !(duration instanceof Duration)) throw new Error(`new Interval: duration must be a Duration (got ${typeof duration})`)
    this.time = time
    this.units = duration ? duration.units : 0
  }

  //
  // Read-only API
  //

  // Return true iff the interval is empty (zero length)
  zero () {
    return Utils.almostZero(this.units)
  }

  // Return true iff the interval is a whole multiple of the given Duration
  multipleOf (base) {
    if (!(base instanceof Duration)) throw new Error(`Interval.multipleOf must be called with a Duration (got ${typeof base})`)
    return Utils.almostZero(this.units % base.units) || Utils.almostEqual(this.units % base.units, base.units)
  }

  // Return rounded number of bars contained in this interval
  bars () {
    return Math.round(this.units / this.time.bar.units)
  }

  // Return rounded number of beats contained in this interval
  beats () {
    return Math.round(this.units / this.time.beat.units)
  }

  // Return true iff the interval is a whole number of bars
  bar () {
    return this.multipleOf(this.time.bar)
  }

  // Return true iff the interval is a whole number of beats
  beat () {
    return this.multipleOf(this.time.beat)
  }

  // Return 0 if both interval add up to an identical duration, 1 if this is longer than other and -1 of this is shorter than other
  compare (other) {
    if (Utils.almostEqual(this.units, other.units)) return 0
    return this.units < other.units ? -1 : 1
  }

  // Return the smallest of the two intervals (or the second one if they are equal)
  static min (i1, i2) {
    if (!(i1 instanceof Interval)) throw new Error(`Interval.min must be called with two Interval (got ${typeof i1})`)
    if (!(i2 instanceof Interval)) throw new Error(`Interval.min must be called with two Interval (got ${typeof i2})`)
    return i1.compare(i2) < 0 ? i1 : i2
  }

  // Return the largest of the two intervals (or the second one if they are equal)
  static max (i1, i2) {
    if (!(i1 instanceof Interval)) throw new Error(`Interval.max must be called with two Interval (got ${typeof i1})`)
    if (!(i2 instanceof Interval)) throw new Error(`Interval.max must be called with two Interval (got ${typeof i2})`)
    return i1.compare(i2) > 0 ? i1 : i2
  }

  // Convert the interval to one or several duration codes.
  // Return the combination of codes matching the largest value <= units.
  // If no combination matches exactly (and not silent), throws an Error.
  // If silent, never throws an error but return an object { codes, remaining }.
  // Codes representing the time's bar then beat are used in priority, until the remaiming part must be expressed with codes smaller than a beat.
  codes (silent) {
    var codes = []
    var remaining = this.units
    while (remaining > 0) {
      let code = this._code(remaining)
      if (!code) break
      codes.push(code)
      remaining -= Duration._units(code)
    }

    if (silent) return { codes, remaining }

    if (!Utils.almostZero(remaining)) throw new Error('No exact match found, stopped at ' + codes + ', remains ' + remaining.toFixed(2))
    return codes
  }

  // Return string representation: codes obtained with the `codes` method above.
  // If no combination matches exactly, the remaining units are displayed as such (e.g. '1.66u') and no error is displayed in the console.
  // Identical codes are displayed using a compact format (e.g. ':w*5' for 5 bars in 4/4 time)
  toString () {
    let { codes, remaining } = this.codes(true)

    // convert to compact display format (repeating codes are displayed as a.g. :w*3)
    let lastCode = null
    let codesUniq = []
    let codeStr = []
    for (let code of codes) {
      if (code === lastCode) codesUniq[codesUniq.length - 1][1]++
      else codesUniq.push([lastCode = code, 1])
    }
    for (let a of codesUniq) codeStr.push(a[0] + (a[1] > 1 ? '*' + a[1] : ''))
    if (codeStr.length === 0) codeStr.push(':0')

    return `[${codeStr}]${Utils.almostZero(remaining) ? '' : '+' + remaining.toFixed(2) + 'u'}`
  }

  //
  // Immutable API: these methods return a new Interval object
  //

  // Add given Duration or Interval value to interval
  add (durationOrInterval) {
    if (!(durationOrInterval instanceof Duration) && !(durationOrInterval instanceof Interval)) throw new Error(`Interval.add must be called with a Duration or Interval (got ${typeof durationOrInterval})`)
    return this._make(this.units + durationOrInterval.units)
  }

  // Subtract given Duration or Interval value from interval
  sub (durationOrInterval) {
    if (!(durationOrInterval instanceof Duration) && !(durationOrInterval instanceof Interval)) throw new Error(`Interval.add must be called with a Duration or Interval (got ${typeof durationOrInterval})`)
    if (this.compare(durationOrInterval instanceof Duration ? this._make(durationOrInterval.units) : durationOrInterval) < 0) throw new Error(`Interval.sub would result in a negative interval (${this} - ${durationOrInterval})`)
    return this._make(this.units - durationOrInterval.units)
  }

  // Multiply interval by given factor
  times (factor) {
    return this._make(this.units * factor)
  }

  // Extend interval to the next multiple of the given Duration
  extendToMultipleOf (base) {
    if (!(base instanceof Duration)) throw new Error(`Interval.extendToMultipleOf must be called with a Duration (got ${typeof base})`)

    // first check if we are not already on a multiple of given base (using epsilon comparison), in which case we just add base
    if (this.multipleOf(base)) return this.add(base)

    // return interval with units being the next multiple of base
    return this._make(Math.ceil(this.units / base.units) * base.units)
  }

  // Extend interval to the next bar
  extendToBar () {
    return this.extendToMultipleOf(this.time.bar)
  }

  // Extend interval to the next beat
  extendToBeat () {
    return this.extendToMultipleOf(this.time.beat)
  }

  //
  // Private stuff
  //

  // Create a new interval using the same time, with given number of units
  _make (units) {
    let inst = new Interval(this.time)
    inst.units = units
    return inst
  }

  // Return first duration code with value <= units (undefined if none found)
  // First consider code corresponding to a bar, then to a beat, then all codes ordered by descending duration
  _code (units) {
    for (let code of [this.time.bar.code, this.time.beat.code, ':wd', ':w', ':hd', ':h', ':qd', ':q', ':8d', ':8', ':16d', ':16', ':32d', ':32']) {
      if (Utils.almostEqual(Duration._units(code), units) || Duration._units(code) < units) return code
    }
  }
}
