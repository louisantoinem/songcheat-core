import { Chord } from './chord'
import { Duration } from './duration'
import { Time } from './time'
import { Note } from './note'
import { Score } from './score'

export class ScoreParser {
  constructor (time) {
    if (!(time instanceof Time)) throw new Error(`new ScoreParser: time must be a Time (got ${typeof time})`)
    this.time = time

    // base for determining tuplet ratio
    this.meterBase = this.time.compound() ? 3 : 2
  }

  parse (text) {
    let score = new Score(this.time)
    text = text || ''

    // reset note duration to one beat, until changed
    this.currentNoteDuration = this.time.beat

    // for locating syntax errors in message
    let position = 1
    let lastToken = null

    // compile the score string into an array of Note
    for (let token of text.split(/((?::(?:w|h|q|8|16|32)d?)|\^(?:\d)|\(#\)|[Tsbhpt]?\s*\([^(]*\)(?:dd?|uu?|>|PM|[pima]+)*|[Tsbhpt]?\s*{[^{]*}(?:dd?|uu?|>|PM|[pima]+)*)/)) {
      if ((token = token.trim())) {
        if (this._handleToken(score, token)) lastToken = token
        else throw new Error('Invalid token "' + token + '" in rhythm score definition at position ' + position + (lastToken ? ' (after "' + lastToken + '")' : ''))
      }
      position += token.length
    }

    return score
  }

  // Private stuff

  _handleToken (score, token) {
    let match = null

    // duration: change note duration to use next
    if ((match = token.match(/^(:(?:w|h|q|8|16|32)d?)$/))) {
      this.currentNoteDuration = new Duration(match[1])
      return true
    }

    // add a rest
    if ((match = token.match(/^\(#\)$/))) {
      score.addNote(new Note(this.currentNoteDuration, true, false, false, {}))
      return true
    }

    // tuplet
    if ((match = token.match(/^\^(\d)$/))) {
      // Wikipedia: "the number indicates a ratio to the next lower normal value in the prevailing meter.""
      let tuplet = parseInt(match[1], 10)
      let tupletDivider = this.meterBase
      // while (tupletDivider + this.meterBase < tuplet) tupletDivider += this.meterBase

      // replace last N notes after applying tuplet
      for (let offset = tuplet; offset > 0; offset--) {
        let note = score.notes[score.notes.length - offset]
        if (!note) throw new Error('Not enough notes for tuplet (' + tuplet + ' vs ' + score.notes.length + ')')
        score.replaceNote(score.notes.length - offset, note.setTuplet(tuplet, tupletDivider, offset === 1))
      }

      return true
    }

    // chord placeholder
    if ((match = token.match(/^([Tsbhpt]?)\s*\(([^(]*)\)((?:dd?|uu?|>|PM|[pima]+)*)$/))) {
      // tied = before parentheses
      let tied = match[1].match(/[Tsbhpt]/) ? match[1] : false

      // strings = between parentheses
      let strings = match[2]

      // flags = after parentheses
      let flags = this._readFlags(token, match[3])

      // add a note
      score.addNote(new Note(this.currentNoteDuration, false, tied, strings, flags))
      return true
    }

    // inline tablature column (= placeholder x chord)
    if ((match = token.match(/^([Tsbhpt]?)\s*{([^{]*)}((?:dd?|uu?|>|PM|[pima]+)*)$/))) {
      // tied = before parentheses
      let tied = match[1].match(/[Tsbhpt]/) ? match[1] : false

      // final tablature column = between curly brackets
      let tablature = match[2]
      if (tablature.length !== 6) throw new Error('Inline tablature must be exactly 6 characters long (one for each guitar string)')
      if (!tablature.match(/^[-x0-9A-Z]{6}$/)) throw new Error('Inline tablature must contain only digits and capital letters (representing a fret number) or "x" (mute) or "-" (not played), but found ' + tablature)

      // create a dummy chord from this tablature containing all played strings (muted or fretted)
      let chordTablature = tablature.replace(/x/g, '0').replace(/-/g, 'x')
      let chord = new Chord(chordTablature, chordTablature, '000000/0', '', true)

      // create dummy associated strings containing the number of all played strings (with additional "x" if muted)
      let strings = ''
      let stringNum = 6
      for (let c of tablature) {
        if (c !== '-') strings += stringNum + (c === 'x' ? 'x' : '')
        stringNum--
      }

      // throw an error if entered tablature is "------"
      if (strings === '') throw new Error('Found empty inline tablature {' + tablature + '}, use a rest (#) instead')

      // flags = after parentheses
      let flags = this._readFlags(token, match[3])

      // add a note
      score.addNote((new Note(this.currentNoteDuration, false, tied, strings, flags)).setChord(chord))
      return true
    }

    return false
  }

  _readFlags (token, flagsString) {
    let flags = { stroke: null, accent: false, pm: false, fingering: null }
    for (let flag of flagsString.split(/(dd?|uu?|>|PM|[pima]+)/)) {
      if (flag.trim()) {
        if (flag.match(/^(dd?|uu?)$/g)) {
          // stroke mode
          if (flags.fingering) throw new Error('Fingering (' + flags.fingering + ') and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.pm) throw new Error('Palm muting (PM) and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.stroke) throw new Error('More than one stroke mode (d, u, dd, uu) defined for the chord placeholder: ' + token)
          flags.stroke = flag
        } else if (flag.match(/^[pima]+$/)) {
          // PIMA fingering
          if (flags.stroke) throw new Error('Stroke (' + flags.stroke + ') and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.pm) throw new Error('Palm muting (PM) and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.fingering) throw new Error('More than one fingering (pima) defined for the chord placeholder: ' + token)
          flags.fingering = flag
        } else if (flag.match(/^PM$/)) {
          // palm muting
          if (flags.stroke) throw new Error('Stroke (' + flags.stroke + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.fingering) throw new Error('Fingering (' + flags.fingering + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.pm) throw new Error('More than one palm muting (PM) defined for the chord placeholder: ' + token)
          flags.pm = true
        } else if (flag.match(/^>$/)) {
          // accent
          if (flags.accent) throw new Error('More than one accent (>) defined for the same placeholder: ' + token)
          flags.accent = true
        } else throw new Error('Invalid flag "' + flag + '" defined for chord placeholder "' + token + '"')
      }
    }
    return flags
  }
}
