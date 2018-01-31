import { Utils } from './utils'

let NEXT_ID = 1

export class ChordException extends Error {
  constructor (message) {
    super('Chord error: ' + message)
  }
  toString () {
    return this.message
  }
}

export class Chord {
  constructor (name, tablature, fingering, comment, inline) {
    try {
      // check name is valid
      if (!name) throw new Error('name must be defined')
      if (typeof name !== 'string') throw new Error('name must be a string')
      if (!name.trim()) throw new Error('name cannot contain only spaces')

      // check tablature is valid
      if (!tablature) throw new Error('tablature must be defined')
      if (typeof tablature !== 'string') throw new Error('tablature must be a string')
      if (tablature.length !== 6) throw new Error('tablature must be exactly 6 characters long (one for each guitar string)')
      if (!tablature.match(/^[x0-9A-Z]{6}$/)) throw new Error('tablature must contain only digits and capital letters (representing a fret number), or "x" (for mute)')

      // check fingering is valid
      if (!fingering) fingering = '000000'
      if (typeof fingering !== 'string') throw new Error('fingering must be a string')
      if (fingering.length === 6) fingering += '/-'
      if (fingering.length !== 8) throw new Error('fingering must be exactly 6 or 8 characters long (....../.)')
      if (!fingering.match(/^[PT01234]{6}.*$/)) throw new Error('the first 6 characters of fingering can only be P,T,1,2,3,4 or 0 (each character represents a finger)')
      if (!fingering.match(/^[PT01234]{6}\/[-0-9A-Z]$/)) throw new Error('the last 2 characters of fingering must be a "/" followed by a digit or capital letter (representing the number of the barred fret) or "-" if there is no barred fret')

      // check comment is valid
      if (!comment) comment = ''
      if (typeof comment !== 'string') throw new Error('comment must be a string')
    } catch (e) {
      throw new ChordException(`"${name}" : ${e.message}`)
    }

    this.id = NEXT_ID++
    this.name = name
    this.tablature = tablature
    this.fingering = fingering
    this.comment = comment || ''
    this.inline = !!inline // if inline, will be hidden in Chords panel and not displayed as a chord change
  }

  //
  // Read-only API
  //

  // Return string representation
  toString (verbose) {
    let s = `${Utils.padOn(this.name, 8)}TAB=${Utils.padOn(this.tablature, 6)}  FNG=${Utils.padOn(this.fingering, 8)}${verbose && this.comment ? ' REM=' + this.comment : ''}${this.inline ? ' INLINE' : ''}`
    return `CHORD{ ${s.trim()} }`
  }

  //
  // Static utils (used by Note and ChordPix)
  //

  // Convert a fret number (up to 35) to a single char (digit or capital letter)
  // Fret 10 is notated as A, 11 as B, ... and 35 as Z
  static fret2char (fret) {
    if (isNaN(fret) || fret < 0 || fret > 35) throw new ChordException('Cannot convert fret number ' + fret + ' to a single char (expected a value between 0 and 35)')
    return fret < 10 ? '' + fret : String.fromCharCode('A'.charCodeAt(0) + fret - 10)
  }

  // Convert a single char (digit or capital letter) to a fret number
  // A means fret 10, 11 fret B, ... and Z fret 35
  static char2fret (char) {
    if (typeof char !== 'string') throw new ChordException('Invalid fret char ' + char + ' expected a string')
    if (!char.match(/^[0-9A-Z]$/)) throw new ChordException('Invalid fret char ' + char + ' (expected a value between [0-9] or [A-Z])')
    return char >= 'A' ? 10 + char.charCodeAt(0) - 'A'.charCodeAt(0) : parseInt(char, 10)
  }
}
