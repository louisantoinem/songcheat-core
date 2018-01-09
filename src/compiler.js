import { Utils } from './utils'

export class CompilerException {
  constructor (message) {
    this.message = message
  }

  toString () {
    return 'Compiler error: ' + this.message
  }
}

class Compiler_ {
  constructor (DEBUG) {
    this.DEBUG = DEBUG
  }

  log () {
    if (this.DEBUG > 0) console.log.apply(console, arguments)
  }

  compile (songcheat) {
    // default values for optional properties
    songcheat.mode = songcheat.mode || 'rt'
    songcheat.lyricsMode = songcheat.lyricsMode || 's'
    songcheat.barsPerLine = songcheat.barsPerLine || 4
    songcheat.signature = songcheat.signature || {}
    songcheat.signature.key = songcheat.signature.key || 'C'
    songcheat.signature.time = songcheat.signature.time || { beatDuration: ':q', beatsPerBar: 4, symbol: '4/4' }
    songcheat.lyricsUnit = songcheat.lyricsUnit || songcheat.signature.time.beatDuration
    songcheat.chords = songcheat.chords || []
    songcheat.rhythms = songcheat.rhythms || []
    songcheat.parts = songcheat.parts || []

    // deduce bar duration from signature
    songcheat.barDuration = songcheat.signature.time.beatsPerBar * Utils.duration(songcheat.signature.time.beatDuration)

    // resolve all id references (rhythms and chords)
    this.resolveIds(songcheat)

    // default structure if not specified : one unit for each (non sub) part
    if (!songcheat.structure) {
      songcheat.structure = []
      for (let part of songcheat.parts) if (!part.sub) songcheat.structure.push({ 'part': part })
    }

    // give a name to each unit if not already set = name of part with automatic numbering
    let unitsByPart = {}
    let numberByPart = {}
    for (let unit of songcheat.structure) unitsByPart[unit.part.id] = typeof unitsByPart[unit.part.id] === 'undefined' ? 1 : unitsByPart[unit.part.id] + 1
    for (let unit of songcheat.structure) {
      numberByPart[unit.part.id] = typeof numberByPart[unit.part.id] === 'undefined' ? 1 : numberByPart[unit.part.id] + 1
      if (!unit.name) unit.name = unit.part.name + (unitsByPart[unit.part.id] > 1 ? ' ' + numberByPart[unit.part.id] : '')
    }

    // give a color to each part if not already set
    let colors = ['red', '#06D6A0', 'blue', 'purple', 'orange', 'magenta']
    let partIndex = 0
    for (let part of songcheat.parts) { if (!part.color && !part.sub) part.color = colors[partIndex++ % colors.length] }

    // validate and compile each rhythm
    for (let rhythm of songcheat.rhythms) this.compileRhythm(rhythm, songcheat.signature.time.beatDuration)

    // compile each phrase
    for (let part of songcheat.parts) this.compilePart(part, songcheat.barDuration)

    // fluid API
    return songcheat
  }

  compilePart (part, barDuration) {
    // compute a "chordChanges" property in each phrase
    let phraseIndex = 0
    for (let phrase of part.phrases) {
      phrase.chordChanges = []
      let lastChord = null
      for (let bar of phrase.bars) lastChord = this.addChordChanges(bar, phrase.chordChanges, barDuration, false, lastChord)

      this.log('Phrase wise chord durations for phrase ' + part.name + '.' + (phraseIndex + 1))
      for (let c of phrase.chordChanges) this.log('\t[' + c.chord.name + '] = ' + c.duration + ' units')

      // compute a "chordChanges" property in each bar
      let barIndex = 0
      for (let bar of phrase.bars) {
        bar.chordChanges = { 'bar': [], 'rhythm': [] }
        for (let chordChangesMode of ['rhythm', 'bar']) this.addChordChanges(bar, bar.chordChanges[chordChangesMode], barDuration, chordChangesMode === 'bar')

        this.log('\tRythm wise chord durations for bar ' + part.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1))
        for (let c of bar.chordChanges['rhythm']) this.log('\t\t[' + c.chord.name + '] = ' + c.duration + ' units')
        this.log('\tBar wise chord durations for bar ' + part.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1))
        for (let c of bar.chordChanges['bar']) this.log('\t\t[' + c.chord.name + '] = ' + c.duration + ' units')

        barIndex++
      }

      phraseIndex++
    }

    // compute duration of part
    part.duration = 0
    for (let phrase of part.phrases) { for (let bar of phrase.bars) part.duration += bar.rhythm.duration }

    return part
  }

  getRhythmUnit (songcheat, rhythm) {
    // create dummy part and unit on a chord with all open strings
    let chord = { name: 'AIR', tablature: '000000', inline: true }
    let part = this.compilePart({ phrases: [{ bars: [{ rhythm: rhythm, chords: [chord] }] }] }, songcheat.barDuration)
    let unit = { name: rhythm.inline ? 'Inline rhythm' : 'Rhythm ' + rhythm.name, part: part }
    return unit
  }

  resolveIds (songcheat) {
    let unitIndex = 0
    if (songcheat.structure) {
      for (let unit of songcheat.structure) {
        if (!unit.part) throw new CompilerException('Part not defined for unit ' + (unitIndex + 1))

        // resolve part id
        let part = this.resolveId(songcheat.parts, unit.part)
        if (!part) throw new CompilerException('Part ' + unit.part + ' not found')
        unit.part = part

        unitIndex++
      }
    }

    if (songcheat.parts) {
      for (let part of songcheat.parts) {
        if (!part.phrases) throw new CompilerException('Phrases not defined for part "' + part.name + '"')
        if (!(part.phrases instanceof Array)) throw new CompilerException('Phrases defined for part "' + part.name + '" must be an Array, found: ' + (typeof songcheat.parts.phrases))

        let phraseIndex = 0
        for (let phrase of part.phrases) {
          let barIndex = 0
          for (let bar of phrase.bars) {
            if (!bar.rhythm) throw new CompilerException('Rhythm not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
            if (!bar.chords) throw new CompilerException('Chords not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
            if (!(bar.chords instanceof Array)) throw new CompilerException('Chords defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' must be an Array, found: ' + (typeof bar.chords))

            // resolve rhythm id
            let rhythm = this.resolveId(songcheat.rhythms, bar.rhythm)
            if (!rhythm) throw new CompilerException('Rhythm ' + bar.rhythm + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1))
            bar.rhythm = rhythm

            // resolved array of chord ids
            let chords = []
            for (let chordId of bar.chords) {
              // resolve chord id
              let chord = this.resolveId(songcheat.chords, chordId)
              if (!chord) throw new CompilerException('Chord ' + chordId + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1))
              chords.push(chord)
            }

            bar.chords = chords
            barIndex++
          }

          phraseIndex++
        }
      }
    }
  }

  resolveId (collection, id) {
    if (collection) { for (let i of collection) { if (i.id === id) return i } }
    return null
  }

  readFlags (token, flagsString) {
    let flags = { stroke: null, accent: false, pm: false, fingering: null }
    for (let flag of flagsString.split(/(dd?|uu?|>|PM|[pima]+)/)) {
      if (flag.trim()) {
        if (flag.match(/^(dd?|uu?)$/g)) {
          // stroke mode
          if (flags.fingering) throw new CompilerException('Fingering (' + flags.fingering + ') and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.pm) throw new CompilerException('Palm muting (PM) and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.stroke) throw new CompilerException('More than one stroke mode (d, u, dd, uu) defined for the chord placeholder: ' + token)
          flags.stroke = flag
        } else if (flag.match(/^[pima]+$/)) {
          // PIMA fingering
          if (flags.stroke) throw new CompilerException('Stroke (' + flags.stroke + ') and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.pm) throw new CompilerException('Palm muting (PM) and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.fingering) throw new CompilerException('More than one fingering (pima) defined for the chord placeholder: ' + token)
          flags.fingering = flag
        } else if (flag.match(/^PM$/)) {
          // palm muting
          if (flags.stroke) throw new CompilerException('Stroke (' + flags.stroke + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.fingering) throw new CompilerException('Fingering (' + flags.fingering + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
          if (flags.pm) throw new CompilerException('More than one palm muting (PM) defined for the chord placeholder: ' + token)
          flags.pm = true
        } else if (flag.match(/^>$/)) {
          // accent
          if (flags.accent) throw new CompilerException('More than one accent (>) defined for the same placeholder: ' + token)
          flags.accent = true
        } else throw new CompilerException('Invalid flag "' + flag + '" defined for chord placeholder "' + token + '"')
      }
    }
    return flags
  }

  compileRhythm (rhythm, initialNoteDuration) {
    this.log('Compiling rhythm ' + rhythm.id + ' with score "' + rhythm.score + '"')

    // default note duration, until changed
    let noteDuration = initialNoteDuration

    // take not of each placeholder's index, so we can later fetch the associated chord
    rhythm.placeholdercount = 0

    // for locating syntax errors in message
    let position = 1
    let lastToken = null

    // compile the score string into an array of objects
    rhythm.compiledScore = []
    for (let token of rhythm.score.split(/((?::(?:w|h|q|8|16|32)d?)|\(#\)|[Tsbhpt]?\s*\([^(]*\)(?:dd?|uu?|>|PM|[pima]+)*|[Tsbhpt]?\s*{[^{]*}(?:dd?|uu?|>|PM|[pima]+)*)/)) {
      if ((token = token.trim())) {
        let match = null
        if ((match = token.match(/^(:(?:w|h|q|8|16|32)d?)$/))) {
          // duration: change note duration to use next
          noteDuration = Utils.duration(match[1])
        } else if ((match = token.match(/^\(#\)$/))) {
          // rest
          rhythm.compiledScore.push({ rest: true, duration: noteDuration, tied: false, strings: false, flags: {}, placeholderIndex: rhythm.placeholdercount++ })
        } else if ((match = token.match(/^([Tsbhpt]?)\s*\(([^(]*)\)((?:dd?|uu?|>|PM|[pima]+)*)$/))) {
          // chord placeholder
          let tied = match[1].match(/[Tsbhpt]/) ? match[1] : false

          // strings = between parentheses
          let strings = match[2]
          if (strings === '') strings = '*' // an empty string is a shortcut for "*"
          if (strings === 'x') strings = '*x' // a x alone is a shortcut for "*x"
          if (!strings.match(/^(?:(\*x?)|((?:(?:B|B'|1|2|3|4|5|6)x?)+))$/)) throw new CompilerException('Invalid syntax found in chord placeholder: ' + strings)

          // flags = after parentheses
          let flags = this.readFlags(token, match[3])

          // add a note
          rhythm.compiledScore.push({ rest: false, duration: noteDuration, tied: tied, strings: strings, flags: flags, placeholderIndex: rhythm.placeholdercount++ })
        } else if ((match = token.match(/^([Tsbhpt]?)\s*{([^{]*)}((?:dd?|uu?|>|PM|[pima]+)*)$/))) {
          // inline tablature column (= placeholder x chord)
          let tied = match[1].match(/[Tsbhpt]/) ? match[1] : false

          // final tablature column = between curly brackets
          let tablature = match[2]
          if (tablature.length !== 6) throw new CompilerException('Inline tablature must be exactly 6 characters long (one for each guitar string)')
          if (!tablature.match(/^[-x0-9A-Z]{6}$/)) throw new CompilerException('Inline tablature must contain only digits and capital letters (representing a fret number) or "x" (mute) or "-" (not played), but found ' + tablature)

          // create a dummy chord from this tablature containing all played strings (muted or fretted)
          let chordTablature = tablature.replace(/x/g, '0').replace(/-/g, 'x')
          let chord = { name: chordTablature, tablature: chordTablature, inline: true }

          // create dummy associated strings containing the number of all played strings (with additional "x" if muted)
          let strings = ''
          let stringNum = 6
          for (let c of tablature) {
            if (c !== '-') strings += stringNum + (c === 'x' ? 'x' : '')
            stringNum--
          }
          // if entered chord is "------", include all strings so that Utils.chordStrings will return 6 muted notes
          // UPDATE: no rather throw an error
          // if (strings === '') strings = '*'
          if (strings === '') throw new CompilerException('Found empty inline tablature {' + tablature + '}, use a rest (#) instead')

          // flags = after parentheses
          let flags = this.readFlags(token, match[3])

          // add a note
          rhythm.compiledScore.push({ rest: false, duration: noteDuration, tied: tied, strings: strings, flags: flags, chord: chord })
        } else throw new CompilerException('Invalid token "' + token + '" in rhythm score definition at position ' + position + (lastToken ? ' (after "' + lastToken + '")' : ''))

        lastToken = token
      }

      position += token.length
    }

    // compute total rhythm duration
    rhythm.duration = 0
    for (let o of rhythm.compiledScore) rhythm.duration += o.duration
  }

  addChordChanges (bar, chordChanges, barDuration, resetAtBars, lastChord) {
    // ensure number of chords match number of placeholders in rhythm score, by repeating last chord
    if (bar.chords.length < 1) throw new CompilerException('chords must contain at least 1 entry, but ' + bar.chords.length + ' were found')
    while (bar.chords.length < bar.rhythm.placeholdercount) bar.chords.push(bar.chords[bar.chords.length - 1])

    let offset = 0
    for (let note of bar.rhythm.compiledScore) {
      // get chord corresponding to the placeholder position
      let chord = note.chord || bar.chords[note.placeholderIndex]
      if (!chord) throw new CompilerException('No chord found for placeholder ' + (note.placeholderIndex + 1))

      // same chord as before and not a new bar: increment duration with this new note
      if (lastChord === chord && offset % barDuration !== 0) chordChanges[chordChanges.length - 1].duration += note.duration

      // chord changed: new duration starts with one note of the new chord
      // unless requested to reset chords at bars, chord change will be hidden if still the same as before
      else chordChanges.push({ chord: chord, duration: note.duration, hidden: lastChord === chord && !resetAtBars })

      lastChord = chord
      offset += note.duration
    }

    return lastChord
  }
}

/**
 * Public API
 */

export class Compiler {
  constructor (DEBUG) {
    this.compiler_ = new Compiler_(DEBUG)
  }

  compile (songcheat) {
    console.log(Utils.title('COMPILE SONGCHEAT'))
    return this.compiler_.compile(JSON.parse(JSON.stringify(songcheat)))
  }

  getRhythmUnit (songcheat, rhythm) {
    return this.compiler_.getRhythmUnit(songcheat, rhythm)
  }
}
