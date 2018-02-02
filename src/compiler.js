import { Utils, Duration, Time, Rhythm, Score, Chord, GroupParser, GroupList } from './main'

let MIN_LYRICS_BARLEN = 20 // minimum length of a bar lyrics (before reducing) - not really needed but produces a clearer view when maxConsecutiveSpaces set to 0 (and thus when displaying parts with partdisplay=full) since bars with no or little text will have the same length (unless there are really many chord changes...)

export class CompilerException extends Error {
  constructor (message) {
    super('Compiler error: ' + message)
  }
  toString () {
    return this.message
  }
}

class Compiler_ {
  logTitle (str) {
    console.log('\n' + Utils.title(str).trim())
  }

  compile (songcheat) {
    songcheat.chords = songcheat.chords || []
    songcheat.rhythms = songcheat.rhythms || []
    songcheat.parts = songcheat.parts || []

    // default values for optional properties
    songcheat.mode = songcheat.mode || 'nt'

    // default values for signature fields
    songcheat.signature = songcheat.signature || {}
    songcheat.signature.key = songcheat.signature.key || 'C'
    songcheat.signature.tempo = songcheat.signature.tempo || 100
    songcheat.signature.shuffle = songcheat.signature.shuffle || ''
    songcheat.signature.time = songcheat.signature.time || { beat: ':q', beatsPerBar: 4, symbol: '4/4' }

    // make time signature a Time object
    songcheat.signature.time = new Time(new Duration(songcheat.signature.time.beat), parseInt(songcheat.signature.time.beatsPerBar, 10), songcheat.signature.time.symbol)

    //
    // Chords: create Chord objects
    //

    let chords = []
    for (let chord of songcheat.chords) chords.push(new Chord(chord.name, chord.tablature, chord.fingering, chord.comment))
    songcheat.chords = chords

    //
    // Rhythms: create Rhythm objects (i.e. parse each rhythm score)
    //

    let rhythms = []
    for (let rhythm of songcheat.rhythms) {
      try {
        rhythms.push(new Rhythm(rhythm.name, songcheat.signature.time, rhythm.score))
      } catch (e) { throw new CompilerException(e.message) }
    }
    songcheat.rhythms = rhythms

    //
    // Parts
    //

    // give a color to each part if not already set
    let colors = ['red', '#06D6A0', 'blue', 'purple', 'orange', 'magenta']
    let partIndex = 0
    for (let part of songcheat.parts) { if (!part.color) part.color = colors[partIndex++ % colors.length] }

    // compile each part
    for (let part of songcheat.parts) this.compilePart(songcheat, part)

    //
    // Structure Units
    //

    // default structure if not specified : one unit for each part
    if (!songcheat.structure) {
      songcheat.structure = []
      for (let part of songcheat.parts) songcheat.structure.push({ 'part': part.name })
    }

    // give id and name to each unit if not already set = name of part with automatic numbering
    let unitIndex = 0
    let numberByPart = {}
    let unitsByPart = {}
    for (let unit of songcheat.structure) unitsByPart[unit.part] = typeof unitsByPart[unit.part] === 'undefined' ? 1 : unitsByPart[unit.part] + 1
    for (let unit of songcheat.structure) {
      unit.id = unitIndex + 1
      numberByPart[unit.part] = typeof numberByPart[unit.part] === 'undefined' ? 1 : numberByPart[unit.part] + 1
      if (!unit.name) unit.name = unit.part + (unitsByPart[unit.part] > 1 ? ' ' + numberByPart[unit.part] : '')
      unitIndex++
    }

    // compile each unit
    for (let unit of songcheat.structure) this.compileUnit(songcheat, unit)

    // fluid API
    return songcheat
  }

  compileUnit (songcheat, unit) {
    this.logTitle(`Compiling unit ${unit.name}`)

    if (!unit.part) throw new CompilerException('Part not defined for unit ' + unit.name)

    // resolve part name if not done yet (not needed for dummy unit compiled by getPartUnit)
    if (typeof unit.part !== 'object') {
      let part = this._resolve(songcheat.parts, unit.part)
      if (!part) throw new CompilerException('Part ' + unit.part + ' not found')
      unit.part = part
    }

    // parse lyrics wrt. part score
    let groupParser = new GroupParser(unit.part.score, songcheat.lyricsUnit ? new Duration(songcheat.lyricsUnit) : null)
    unit.lyricsGroups = groupParser.parse(unit.lyrics)
    unit.lyricsWarnings = groupParser.warnings

    // on each lyrics group
    unit.pmax = 0
    for (let group of unit.lyricsGroups.groups) {
      // get the number of visible graphemes in group text
      // - newlines are not counted
      // - tabs will be converted to spaces and may thus count as 1
      // - use spread operator to correctly count astral unicode symbols
      let len = [...group.text.replace(/\n/g, '')].length

      // get length (in chars) that will be used to compute density
      // - add 1 so the group having max density is not collated with next group
      // - Math.max to ensure that bar will always have the required minimal width
      let plen = Math.max(len + 1, Math.ceil(MIN_LYRICS_BARLEN * group.length.units / unit.part.score.time.bar.units))

      // set computed data
      group.data = {
        len: len,
        plen: plen,
        p: plen / group.length.units, // density of group based on the obtained length
        chordChanges: unit.part.chordGroups.groupsStartingIn(group), // chord changes starting in this lyrics group
        bar: group.end().bar(), // true if groups ends on a bar
        toString: function () {
          return `L:${Utils.padOn(group.data.len, 3)} L'=${Utils.padOn(group.data.plen, 3)} ρ:${Utils.padOn(group.data.p.toFixed(2), 6)} Chords: ${Utils.padOn(group.data.chordChanges.groups.length, 3)}${group.data.bar ? ' |' : ''}`
        }
      }

      // maximum density across all groups
      unit.pmax = Math.max(unit.pmax, group.data.p)
    }

    // debug info
    console.log(`Groups of unit [${unit.name}] (ρ max = ${unit.pmax.toFixed(2)}): ${unit.lyricsGroups}`)

    return unit
  }

  compilePart (songcheat, part) {
    // check that parsed part is valid
    if (!part.phrases) throw new CompilerException('Phrases not defined for part "' + part.name + '"')
    if (!(part.phrases instanceof Array)) throw new CompilerException('Phrases defined for part "' + part.name + '" must be an Array, found: ' + (typeof part.phrases))
    part.score = new Score(songcheat.signature.time)
    part.chordGroups = new GroupList()

    let phraseIndex = 0
    let barOffset = part.score.start()
    for (let phrase of part.phrases) {
      let barIndex = 0
      for (let bar of phrase.bars) {
        let messageHeader = `Bar ${part.name}.${phraseIndex + 1}.${barIndex + 1}`
        try {
          // check that parsed bar is valid
          if (!bar.rhythm) throw new CompilerException('Rhythm not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
          if (typeof bar.chords === 'undefined') throw new CompilerException('Chords not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
          this.logTitle(`${messageHeader} "${Utils.preview(bar.rhythm.toString(), 80)} * ${bar.chords || '(no chords)'}"`)

          // resolve rhythm name if not done yet (not needed for bar of dummy part compiled by getRhythmUnit)
          if (!(bar.rhythm instanceof Rhythm)) {
            let rhythm = this._resolve(songcheat.rhythms, bar.rhythm)

            // if no rhythm found with this name but this is a potential score (at least one pair of parenthesis or curly brackets)
            if (!rhythm && (bar.rhythm.match(/\(.*\)/) || bar.rhythm.match(/\{.*\}/))) {
              // create inline rhythm with the name begin the score itself (so the rhythm is found next time if used several times)
              songcheat.rhythms.push(rhythm = new Rhythm(bar.rhythm, songcheat.signature.time, bar.rhythm, true))
            }

            if (!rhythm) throw new CompilerException('Rhythm ' + bar.rhythm + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
            bar.rhythm = rhythm
          }

          // get chord groups for bar and concatenated (and offsetted) chord groups on whole part
          part.chordGroups.append(bar.chordGroups = bar.rhythm.chordGroups(bar.chords, songcheat.chords), barOffset)

          // get chorded score for bar and concatenated chorded score on whole part
          part.score.append(bar.score = bar.rhythm.chordedScore(bar.chordGroups))
        } catch (e) {
          throw new CompilerException(`${messageHeader} : ${e.message}`)
        }

        barOffset = barOffset.add(bar.score.length)
        barIndex++
      }

      phraseIndex++
    }

    return part
  }

  getPartUnit (songcheat, part) {
    if (part._unit) return part._unit

    // compile dummy unit without lyrics
    part._unit = this.compileUnit(songcheat, { name: part.name, part: part })

    return part._unit
  }

  getRhythmUnit (songcheat, rhythm) {
    if (rhythm._unit) return rhythm._unit
    let name = rhythm.inline ? 'Inline rhythm' : 'Rhythm ' + rhythm.name
    this.logTitle(`Creating dummy rhythm unit for ${name}`)

    // compile dummy part having one bar without chords and unit without lyrics
    rhythm._unit = this.compileUnit(songcheat, {
      name: name,
      part: this.compilePart(songcheat, {
        name: name,
        phrases: [{
          bars: [{ rhythm, chords: '' }]
        }]
      })
    })

    return rhythm._unit
  }

  _resolve (collection, name) {
    // find object by its name (if several, use last one)
    let found = null
    if (collection) { for (let o of collection) { if (o && o.name === name) found = o } }
    return found
  }
}

/**
 * Public API
 */

export class Compiler {
  constructor () {
    this.compiler_ = new Compiler_()
  }

  compile (songcheat) {
    this.compiler_.logTitle('Compiling SongCheat')
    return this.compiler_.compile(JSON.parse(JSON.stringify(songcheat)))
  }

  getRhythmUnit (songcheat, rhythm) {
    return this.compiler_.getRhythmUnit(songcheat, rhythm)
  }

  getPartUnit (songcheat, part) {
    return this.compiler_.getPartUnit(songcheat, part)
  }
}
