import { Compiler } from './compiler'
import { Interval } from './interval'

let DEBUG = 0

export class VexTabException {
  constructor (message) {
    this.message = message
  }

  toString () {
    return 'VexTab error: ' + this.message
  }
}

export class VexTab {

  static Units2VexTab (songcheat, units, barsPerLine, separateUnits, showLyrics, showStrokes) {
    // all units concatenated
    if (units.length > 1 && !separateUnits) {
      console.log('VexTabbing ' + units.length + ' units')
      return VexTab._Units2VexTab(songcheat.mode, songcheat, units, barsPerLine, showLyrics, showStrokes) + '\n'
    }

    // each unit starting with a new stave
    let vextab = ''
    for (let unit of units) {
      console.log('VexTabbing unit "' + unit.name + '"')
      vextab += VexTab._Units2VexTab(songcheat.mode, songcheat, [unit], barsPerLine, showLyrics, showStrokes) + '\n'
    }
    return vextab
  }

  static Rhythm2VexTab (songcheat, rhythm) {
    // run Unit2VexTab on dummy rhythm unit
    let compiler = new Compiler()
    return VexTab._Units2VexTab('r', songcheat, [compiler.getRhythmUnit(songcheat, rhythm)], 0, false, true)
  }

  // Private stuff

  // build VexTab chord notation
  static Chord2VexTab (note, transpose) {
    var vextabchord = []
    for (let o of note.playedStrings()) {
      vextabchord.push((o.mute ? 'X' : transpose + o.fret) + '/' + o.string)
    }
    return '(' + vextabchord.join('.') + ')'
  }

  static Note2VexTab (note, strokes, accents) {
    let vextab = ''

    // rest with given duration
    if (note.rest) vextab += note.duration.code + '#5#'

    else {
      // note duration, slashed if no chord given
      vextab += note.chord ? note.duration.code : note.duration.code.replace(/(:(?:w|h|q|8|16|32))(d?)/g, '$1S$2')

      // if tied note (Tsbhpt)
      if (note.tied) vextab += note.tied

      // chord or dummy note (for slash notation)
      vextab += !note.chord ? '(4/3)' : VexTab.Chord2VexTab(note, 0) // do not transpose with capo: chords are tabbed exactly as their diagrm says (author chooses to use capo'd chords or not)

      // stroke flag d or u (dd and uu are not built-in in vextab and are handled later through text2VexTab)
      if (strokes && note.flags.stroke && note.flags.stroke.length === 1) vextab += note.flags.stroke

      // accent (put on top or bottom)
      if (accents && note.flags.accent) vextab += '$.a>/' + accents + '.$'
    }

    if (note.lastOfTuplet) vextab += '^' + note.duration.tuplet + '^'

    return vextab
  }

  static Notes2Stave (songcheat, offset, notes, strokes, accents, notation, tablature, slashed) {
    let vextab = ''

    console.log('[Notes2Stave] Drawing ' + (notation ? 'notation ' : '') + (tablature ? 'tablature ' : '') + 'stave with ' + notes.length + ' notes')

    // start new stave with signature
    vextab += '\ntabstave notation=' + (notation ? 'true' : 'false') + ' tablature=' + (tablature ? 'true' : 'false') + ' time=' + songcheat.signature.time.symbol + '\n'
    if (!slashed) vextab += 'tuning=' + songcheat.tuning + ' key=' + songcheat.signature.key + '\n'
    vextab += 'notes '

    // initial bar line if needed (double if first bar)
    if (offset.bar()) vextab += (offset.zero() ? '=||' : '|')

    // add each note, followed by a bar or phrase sign if needed
    let noteIndex = 0
    for (let note of notes) {
      vextab += VexTab.Note2VexTab(note, strokes, accents)
      offset = offset.add(note.duration)
      if (note.lastInPhrase && !offset.bar()) console.warn('Phrase matches no bar (' + offset.extendToBar().sub(offset) + ' duration units away)')
      if (offset.bar() && noteIndex != notes.length - 1 /* if adding last | or || sign, tab and notation are not aligned anymore */) vextab += note.lastInPhrase ? '=||' : '|'
      noteIndex++
    }

    return vextab + '\n'
  }

  static Text2VexTab (textGroups, offset, staveLength, h, font) {
    let text = ''

    // for groups that start within our range
    for (let group of textGroups) {
      let groupText = group.text.replace(/\n/g, '')

      if (group.offset.compare(offset.add(staveLength)) >= 0) break
      if (group.offset.compare(offset) >= 0) {
        // an empty text group is not useful in VexTab (they are used for Ascii compact mode, cf. hidden chords)
        if (!groupText.trim()) continue

        // console.log(`[Text2VexTab] "${groupText}" - Placing group with offset ${group.offset} on a stave with offset ${offset}`)
        let line = 'text ++,.' + h + ',.font=' + font

        // initial bar line if needed
        if (offset.bar()) line += ',|'

        // add empty text groups, one bar at a time (adding bar signs), to fill the gap between start of stave and start of group
        let gapFillerOffset = offset
        while (!group.offset.sub(gapFillerOffset).zero()) {
          // next gap filler position is either end of bar or start of group (whichever comes first)
          let next = Interval.min(gapFillerOffset.extendToBar(), group.offset)

          // add codes to fill the distance between current and next gap filler position
          let gap = next.sub(gapFillerOffset)
          try {
            let codes = gap.codes()
            for (let code of codes) line += ',' + code + ', '
          } catch (e) {
            console.error(`[Text2VexTab] "${groupText}" - Error adding gap ${gap} from stave start : ${e.message}`)
            let { codes } = gap.codes(true)
            for (let code of codes) line += ',' + code + ', '
          }

          // add a bar sign if needed
          if (next.bar()) line += ',|'

          // continue from next position
          gapFillerOffset = next
        }

        // add actual text group on all available duration until end of stave (or more precisely the largest duration code which is <= available duration)
        let available = offset.add(staveLength).sub(group.offset)
        let { codes } = available.codes(true)
        for (let code of codes) {
          // console.log(`[Text2VexTab] "${groupText}" - Placing on ${code} which is the available width until end of stave`)
          line += ',' + code + ',' + groupText
          break
        }

        // remove trailing spaces and comma: vextab does not allow to finish on an empty word group
        text += line.replace(/[ ,]+$/, '') + '\n'
      }
    }

    return text
  }

  static _Units2VexTab (staveMode, songcheat, units, barsPerLine, showLyrics, showStrokes) {
    let stems = staveMode.indexOf('s') >= 0
    let stemsdown = staveMode.indexOf('sd') >= 0
    let stemsup = stems && !stemsdown
    let vextab = 'options tempo=' + songcheat.signature.tempo + ' player=false tab-stems=' + (stems ? 'true' : 'false') + ' tab-stem-direction=' + (stemsdown ? 'down' : 'up') + '\n'

    // get lyrics, chords, fingering/stroke and PM word groups
    let lyricsGroups = []
    let chordGroups = []
    let pmGroups = []
    let fingeringGroups = []
    let subtitlesGroups = []
    let unitOffset = new Interval(songcheat.signature.time)
    for (let unit of units) {
      subtitlesGroups.push({ offset: unitOffset, text: `[${unit.name}]` })
      for (let group of unit.lyricsGroups.groups) lyricsGroups.push({ offset: unitOffset.add(group.offset), text: group.text + (DEBUG ? '/' + group.length : '') })
      for (let group of unit.part.chordGroups.groups) chordGroups.push({ offset: unitOffset.add(group.offset), text: group.text + (DEBUG ? '/' + group.length : '') })
      let noteOffset = unitOffset
      for (let note of unit.part.score.notes) {
        if (note.flags.pm) pmGroups.push({ offset: noteOffset, text: 'PM' })
        if (note.flags.fingering) fingeringGroups.push({ offset: noteOffset, text: note.flags.fingering.toLowerCase() })
        else if (note.flags.stroke && note.flags.stroke.length === 2) fingeringGroups.push({ offset: noteOffset, text: note.flags.stroke === 'dd' ? '⤋' : '⤊' })
        noteOffset = noteOffset.add(note.duration)
      }
      unitOffset = unitOffset.add(unit.part.score.length)
    }

    let maxStaveLength = barsPerLine ? (new Interval(songcheat.signature.time, songcheat.signature.time.bar)).times(barsPerLine) : null
    let staveLength = new Interval(songcheat.signature.time)
    let notes = []
    let notesSlashed = []

    // for each phrase in each unit
    let offset = new Interval(songcheat.signature.time)
    let unitIndex = 0
    for (let unit of units) {
      let lastUnit = unitIndex === units.length - 1

      let phraseIndex = 0
      for (let phrase of unit.part.phrases) {
        let lastPhraseInPart = phraseIndex === unit.part.phrases.length - 1

        // for each bar in phrase
        let barIndex = 0
        for (let bar of phrase.bars) {
          console.log('[Units2VexTab] ' + unit.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1))
          let lastBarInPhrase = barIndex === phrase.bars.length - 1

          // for each note in bar
          let noteIndex = 0
          for (let note of bar.score.notes) {
            // register chorded and slashed note (i.e. without chord)
            let chordedNote = note._copy()
            let slashedNote = note.setChord(null)
            notes.push(chordedNote)
            notesSlashed.push(slashedNote)

            // add lastInPhrase prop in our copies
            let lastNoteInPhrase = lastBarInPhrase && noteIndex === bar.score.notes.length - 1
            chordedNote.lastInPhrase = slashedNote.lastInPhrase = lastNoteInPhrase

            // draw staves when we have completed barsPerLine bars or if the part is done
            staveLength = staveLength.add(note.duration)
            let isDone = lastUnit && lastPhraseInPart && lastNoteInPhrase
            if (isDone || (maxStaveLength !== null && staveLength.compare(maxStaveLength) >= 0)) {
              console.log('[Units2VexTab] ' + (isDone ? 'EOF' : 'EOL') + ': drawing ' + notes.length + ' notes ' + staveMode + ' stave' + (staveMode.length > 1 ? 's' : '') + ' with a length of ' + staveLength)

              let notation = staveMode.indexOf('n') >= 0
              let tablature = staveMode.indexOf('t') >= 0
              let rhythm = staveMode.indexOf('r') >= 0

              // rhythm notation: includes strokes and accents
              if (rhythm) {
                // stave with notes
                vextab += 'options space=20\n'
                vextab += VexTab.Notes2Stave(songcheat, offset, notesSlashed, showStrokes, 'top', true, false, true)

                // unit names and chords
                vextab += VexTab.Text2VexTab(subtitlesGroups, offset, staveLength, -1, 'Arial-10-bold')
                vextab += VexTab.Text2VexTab(chordGroups, offset, staveLength, 2, 'Arial-10-normal')

                // PIMA and PM are mutually exclusive with strokes so they are displayed on the same line and under same conditions as strokes
                if (showStrokes) {
                  let strokesH = 11
                  vextab += VexTab.Text2VexTab(fingeringGroups, offset, staveLength, strokesH, 'Arial-9-normal')
                  vextab += VexTab.Text2VexTab(pmGroups, offset, staveLength, strokesH, 'Arial-9-normal')
                }

                // show lyrics if requested
                if (showLyrics) {
                  let lyricsH = 11 + (showStrokes ? 2 : 0)
                  vextab += VexTab.Text2VexTab(lyricsGroups, offset, staveLength, lyricsH, 'Times-11-italic')
                }

                // space below stave
                vextab += 'options space=40\n'
              }

              // notation and/or tablature
              if (notation || tablature) {
                // set stave distance if both notation and tablature
                let staveDistance = stemsup ? 80 : 45
                if (notation && tablature) vextab += `options stave-distance=${staveDistance}\n`

                // stave with notes
                vextab += 'options space=20\n'
                if (notation) vextab += 'options space=20\n'
                vextab += VexTab.Notes2Stave(songcheat, offset, notes, showStrokes, false, notation, tablature)

                // unit names and chords
                let topH = notation || stemsup ? -1 : 2
                vextab += VexTab.Text2VexTab(subtitlesGroups, offset, staveLength, topH - 3, 'Arial-10-bold')
                vextab += VexTab.Text2VexTab(chordGroups, offset, staveLength, topH - 1, 'Arial-9-bold')

                // PIMA and PM are mutually exclusive with strokes so they are displayed on the same line and under same conditions as strokes
                if (showStrokes) {
                  let strokesH = notation ? (stemsdown ? 12 : 22) + (staveDistance / 10) : 10
                  vextab += VexTab.Text2VexTab(fingeringGroups, offset, staveLength, strokesH, 'Arial-9-normal')
                  vextab += VexTab.Text2VexTab(pmGroups, offset, staveLength, strokesH, 'Arial-9-normal')
                }

                // show lyrics if requested
                if (showLyrics) {
                  let lyricsH = notation ? (stemsup ? 8 : 10) + (staveDistance / 10) : (10 + (showStrokes ? 2 : 0) + (stemsdown ? 3 : 0))
                  vextab += VexTab.Text2VexTab(lyricsGroups, offset, staveLength, lyricsH, 'Times-11-italic')
                }

                // space below stave
                vextab += 'options space=40\n'
                if (notation) vextab += 'options space=30\n'
                if (!tablature || stemsdown) vextab += 'options space=30\n'
              }

              // increment offset
              offset = offset.add(staveLength)

              // clear workspace
              notes = []
              notesSlashed = []
              staveLength = new Interval(songcheat.signature.time)
            }

            // next note in bar
            noteIndex++
          }

          // next bar in phrase
          barIndex++
        }

        // next phrase in part
        phraseIndex++
      }

      // next unit
      unitIndex++
    }

    return vextab
  }
}
