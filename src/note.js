import { Chord } from './chord'
import { Duration } from './duration'

export class Note {
  constructor (duration, rest, tied, strings, flags) {
    if (!(duration instanceof Duration)) throw new Error(`new Note: duration must be of type Duration (got ${typeof duration})`)
    if (tied && !tied.match(/^[Tsbhpt]$/)) throw new Error(`new Note: invalid value for tied (got ${typeof duration}, mut be one of [Tsbhpt])`)
    if (flags && typeof flags !== 'object') throw new Error(`new Note: flags must be an object (got ${typeof flags})`)

    strings = strings || '*' // default is "*" to play all string
    if (strings === 'x') strings = '*x' // a x alone is a shortcut for "*x"
    if (!strings.match(/^(?:(\*x?)|((?:(?:B|B'|1|2|3|4|5|6)x?)+))$/)) throw new Error('Invalid syntax for note strings : ' + strings)

    this.rest = !!rest
    this.duration = duration
    this.tied = tied || false
    this.strings = strings
    this.flags = flags || ''
    this.lastOfTuplet = false // for adding ^tuplet^ in vextab
    this.chord = null
  }

  //
  // Read-only API
  //

  // Return string representation
  toString () {
    let flags = ''
    for (let k in this.flags) if (this.flags[k] !== null && this.flags[k] !== false) flags += this.flags[k] === true ? k : this.flags[k]
    return `${this.rest ? '#' : ''}${this.duration}.${this.tied || ''}(${this.strings || ''})${flags}${this.chord ? '.' + this.chord.name : ''}`
  }

  // Apply strings pattern on chord
  // Return array containing one { string, fret, mute } object for each played string
  playedStrings (forceIncludeMutedStrings) {
    let strings = this.strings
    if (!this.chord) throw new Error('Note: called playedStrings on a note with no chord')

    // if specific strings have been given (i.e. not * or *x), we also consider the muted strings in chord
    let includeMutedStrings = forceIncludeMutedStrings || !strings.match(/^\*/)

    for (let i = 0; i < this.chord.tablature.length; i++) {
      // string will be between 6 and 1 since this.chord.tablature.length has been verified and is 6
      let string = 6 - i

      // first time we meet an included string, it's the bass so replace B and B' with the string number
      if (this.chord.tablature[i] !== 'x' || forceIncludeMutedStrings) {
        strings = strings.replace(/B'/g, (string === 6 ? 5 : (string === 5 ? 6 : string)))
        strings = strings.replace(/B/g, string)
      }
    }

    var result = []
    for (let i = 0; i < this.chord.tablature.length; i++) {
      // string will be between 6 and 1 since this.chord.tablature.length has been verified and is 6
      let string = 6 - i

      // string not played in this chord
      if (this.chord.tablature[i] === 'x' && !includeMutedStrings) continue

      // check if this string should be played with the right hand
      // * means "all strings", otherwise concatenated specific string numbers are specified (or B for bass or B' for alternate bass)
      // x after string means muted (ghost) note
      // if a specific (not muted) string number is given, don't mute even if chord says it should (use default fret instead: barred fret if any or 0)
      if (strings.match(/^\*/) || strings.indexOf(string) !== -1) {
        let fret = this.chord.tablature[i] === 'x' ? 0 : Chord.char2fret(this.chord.tablature[i])
        let xIndex = strings.match(/^\*/) ? 1 : strings.indexOf(string) + 1
        let mute = strings[xIndex] === 'x' || (this.chord.tablature[i] === 'x' && strings.indexOf(string) === -1)
        result.push({
          string: string,
          fret: this.chord.tablature[i] === 'x' ? this.chord.barredFret() : fret,
          mute: mute
        })
      }
    }

    // if chord has no string in common with given strings
    if (result.length === 0) {
      // if muted chord strings were already included, nothing to try left
      if (forceIncludeMutedStrings) throw new Error('Note.playedStrings giving up. This means that this.strings is empty which should never happen!')

      // force including muted chord strings in order not to get an error in vextab (empty chord not allowed)
      return this.playedStrings(true)
    }

    return result
  }

  //
  // Immutable API: methods below return a new Note instance
  //

  setTuplet (tuplet, tupletDivider, lastOfTuplet) {
    let note = this._copy()
    note.duration = new Duration(this.duration.code, tuplet, tupletDivider)
    note.lastOfTuplet = lastOfTuplet
    return note
  }

  setChord (chord) {
    if (chord && !(chord instanceof Chord)) throw new Error(`Note.setChord: chord must be of type Chord (got ${typeof chord})`)
    let note = this._copy()
    note.chord = chord || null
    return note
  }

  setStrings (strings) {
    let note = new Note(this.duration, this.rest, this.tied, strings, this.flags)
    note.tuplet = this.tuplet
    note.lastOfTuplet = this.lastOfTuplet
    note.chord = this.chord
    note.offset = this.offset
    return note
  }

  //
  // Private stuff
  //

  _copy () {
    let note = new Note(this.duration, this.rest, this.tied, this.strings, this.flags)
    note.tuplet = this.tuplet
    note.lastOfTuplet = this.lastOfTuplet
    note.chord = this.chord
    note.offset = this.offset
    return note
  }
}
