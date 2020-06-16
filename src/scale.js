import { Utils } from './utils'
import { Mode } from './mode'

let NOTES = {
  'C': 0,
  'D': 2,
  'E': 4,
  'F': 5,
  'G': 7,
  'A': 9,
  'B': 11
}

export class Scale {
  constructor (mode, keynote) {
    if (!(mode instanceof Mode)) throw new Error(`Invalid scale definition: mode must be a Mode`)
    if (typeof keynote !== 'string') throw new Error('Invalid scale definition: keynote must be a string')
    if (keynote.length > 2) throw new Error(`Invalid scale definition: invalid keynote ${keynote}`)
    if (!['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(keynote[0])) throw new Error(`Invalid scale definition: invalid keynote ${keynote}`)
    if (keynote.length === 2 && !['#', 'b'].includes(keynote[1])) throw new Error(`Invalid scale definition: invalid keynote ${keynote}`)

    this.mode = mode
    this.keynote = keynote

    this.notes = [keynote]
    for (let interval of mode.intervals) {
      let lastNote = this.notes[this.notes.length - 1]

      // next natural note
      let nextNote = String.fromCharCode(lastNote.charCodeAt(0) + 1)
      if (nextNote === 'H') nextNote = 'A'

      // get interval between last and next notes
      let start = NOTES[lastNote[0]]
      let end = NOTES[nextNote[0]]
      if (end < start) end += 12
      let semiTones = end - start

      for (let i = 1; i < lastNote.length; i++) {
        if (lastNote[i] === '#') semiTones -= 1
        else if (lastNote[i] === 'b') semiTones += 1
      }

      // alter to match interval
      while (semiTones < interval) {
        nextNote += '#'
        semiTones++
      }
      while (semiTones > interval) {
        nextNote += 'b'
        semiTones--
      }

      this.notes.push(nextNote)
    }
  }

  //
  // Read-only API
  //

  // Return chord for degree
  chord (degree) {
    if (!this.mode.chordQualities) throw new Error(`Associated mode was not created with the 'chordQualities' parameter`)
    return this.notes[degree - 1] + this.mode.chordQualities[degree - 1]
  }

  // Compute a chord progression
  chords (degrees) {
    let chords = []
    for (let degree of (degrees || Utils.range(this.mode.intervals.length))) chords.push(this.chord(degree))
    return chords
  }

  // If other is also a Scale, return true iff same mode and keynote.
  equals (other) {
    return other && this.mode.equals(other.mode) && this.keynote === other.keynote
  }

  // Return string representation
  toString () {
    return `${this.notes}`
  }
}
