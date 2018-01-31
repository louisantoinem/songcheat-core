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

      // accent (put on top)
      if (accents && note.flags.accent) vextab += '$.a>/' + accents + '.$'
    }

    if (note.lastOfTuplet) vextab += '^' + note.duration.tuplet + '^'

    return vextab
  }

  static Notes2Stave (songcheat, offset, notes, strokes, accents, subtitle, hs, notation, tablature) {
    let vextab = ''

    console.log('Drawing ' + (notation ? 'notation ' : '') + (tablature ? 'tablature ' : '') + 'stave with ' + notes.length + ' notes')

    // start new stave with signature
    vextab += '\ntabstave notation=' + (notation ? 'true' : 'false') + ' tablature=' + (tablature ? 'true' : 'false') + '\n'
    vextab += 'tuning=' + songcheat.tuning + ' key=' + songcheat.signature.key + ' time=' + songcheat.signature.time.symbol + '\n'

    // add subtitle if first bar
    if (subtitle && offset.zero()) vextab += 'text .' + hs + ',.font=Arial-10-bold,[' + subtitle + ']\n'

    vextab += 'notes '

    // initial bar line if needed (double if first bar)
    if (offset.bar()) vextab += (offset.zero() ? '=||' : '|')

    // add each note, followed by a bar or phrase sign if needed
    for (let note of notes) {
      vextab += VexTab.Note2VexTab(note, strokes, accents)
      offset = offset.add(note.duration)
      if (note.lastInPhrase && !offset.bar()) console.warn('Phrase matches no bar (' + offset.extendToBar().sub(offset) + ' duration units away)')
      if (offset.bar()) vextab += note.lastInPhrase ? '=||' : '|'
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
          // console.log(`[Text2VexTab] "${groupText}" - Adding gap ${gap} from stave start`)
          for (let code of gap.codes()) line += ',' + code + ', '

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

  static Songcheat2VexTab (songcheat) {
    let vextab = ''
    let unitIndex = 0
    for (let unit of songcheat.structure) {
      if (typeof songcheat.showUnitIndex === 'undefined' || songcheat.showUnitIndex === null || songcheat.showUnitIndex === unitIndex) {
        vextab += VexTab.Unit2VexTab(songcheat, unit, unitIndex) + '\n'
      }
      unitIndex++
    }
    return vextab
  }

  static Rhythm2VexTab (songcheat, rhythm) {
    // run Unit2VexTab on dummy rhythm unit
    let compiler = new Compiler()
    return VexTab.Unit2VexTab(songcheat, compiler.getRhythmUnit(songcheat, rhythm))
  }

  static Unit2VexTab (songcheat, unit, unitIndex) {
    let stems = songcheat.mode.indexOf('s') >= 0
    let stemsdown = songcheat.mode.indexOf('sd') >= 0
    let showLyrics = songcheat.lyricsMode === 's'

    let vextab = 'options tempo=' + songcheat.signature.tempo + ' player=false tab-stems=' + (stems ? 'true' : 'false') + ' tab-stem-direction=' + (stemsdown ? 'down' : 'up') + '\n'
    unitIndex = unitIndex || 0

    let maxStaveLength = (new Interval(songcheat.signature.time, songcheat.signature.time.bar)).times(songcheat.barsPerLine)
    let staveLength = new Interval(songcheat.signature.time)
    let notes = []
    let notesSlashed = []

    console.log('VexTabbing unit ' + (unitIndex + 1) + ' "' + unit.name + '"')

    // space before first unit and between units
    vextab += 'options space=' + (unitIndex > 0 && songcheat.showUnitIndex === null ? 50 : 20) + '\n'

    // get lyrics word groups
    let lyricsGroups = []
    for (let group of unit.lyricsGroups.groups) lyricsGroups.push({ offset: group.offset, text: group.text + (DEBUG ? '/' + group.length : '') })

    // get chord word groups
    let chordGroups = []
    for (let group of unit.part.chordGroups.groups) chordGroups.push({ offset: group.offset, text: group.text + (DEBUG ? '/' + group.length : '') })

    // get fingering/stroke and PM word groups
    let noteOffset = new Interval(songcheat.signature.time)
    let pmGroups = []
    let fingeringGroups = []
    for (let note of unit.part.score.notes) {
      if (note.flags.pm) pmGroups.push({ offset: noteOffset, text: 'PM' })
      if (note.flags.fingering) fingeringGroups.push({ offset: noteOffset, text: note.flags.fingering.toLowerCase() })
      else if (note.flags.stroke && note.flags.stroke.length === 2) fingeringGroups.push({ offset: noteOffset, text: note.flags.stroke === 'dd' ? '⤋' : '⤊' })
      noteOffset = noteOffset.add(note.duration)
    }

    // for each phrase in unit
    let offset = new Interval(songcheat.signature.time)
    let phraseIndex = 0
    for (let phrase of unit.part.phrases) {
      let lastPhraseInPart = phraseIndex === unit.part.phrases.length - 1

      // for each bar in phrase
      let barIndex = 0
      for (let bar of phrase.bars) {
        console.log('\t\tbar ' + (barIndex + 1))
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
          let lastInPhrase = lastBarInPhrase && noteIndex === bar.score.notes.length - 1
          chordedNote.lastInPhrase = slashedNote.lastInPhrase = lastInPhrase

          // draw staves when we have completed barsPerLine bars or if the part is done
          staveLength = staveLength.add(note.duration)
          let partDone = lastPhraseInPart && lastInPhrase
          if (staveLength.compare(maxStaveLength) >= 0 || partDone) {
            console.log((partDone ? '[EOP]' : '[EOL]') + ' Drawing ' + notes.length + ' notes stave' + (songcheat.mode.length > 1 ? 's' : '') + ' with a length of ' + staveLength)

            // notation: shows unit.name, chords, accents, stems (slashes) and lyrics
            // if tablature is not displayed, it also shows strokes/fingering
            // it never shows PM and frets
            if (songcheat.mode.indexOf('r') >= 0) {
              let strokes = songcheat.mode.indexOf('t') < 0
              vextab += VexTab.Notes2Stave(songcheat, offset, notesSlashed, strokes, 'top', unit.name, -1, true, false)
              if (strokes && fingeringGroups.length > 0) vextab += VexTab.Text2VexTab(fingeringGroups, offset, staveLength, 11, 'Arial-9-normal') // PIMA on same line as strokes
              if (showLyrics && lyricsGroups.length > 0) vextab += VexTab.Text2VexTab(lyricsGroups, offset, staveLength, strokes ? 13 : 11, 'Times-11-italic')
              if (chordGroups.length > 0) vextab += VexTab.Text2VexTab(chordGroups, offset, staveLength, 2, 'Arial-10-normal')
              vextab += 'options space=' + (strokes ? 40 : 20) + '\n'
            }

            // tablature: shows PM, frets and strokes/fingering
            // if notation is not displayed, it also shows unit.name, chords, lyrics and stems (if mode "ts")
            // it never shows accents
            if (songcheat.mode.indexOf('t') >= 0) {
              if (stems) vextab += 'options space=' + 30 + '\n'
              vextab += VexTab.Notes2Stave(songcheat, offset, notes, true, false, songcheat.mode.indexOf('r') < 0 ? unit.name : false, stems ? -3 : -1, false, true)
              if (fingeringGroups.length > 0) vextab += VexTab.Text2VexTab(fingeringGroups, offset, staveLength, 10, 'Arial-9-normal') // PIMA on same line as strokes
              if (pmGroups.length > 0) vextab += VexTab.Text2VexTab(pmGroups, offset, staveLength, 10, 'Arial-9-normal') // PM on same line as strokes
              if (songcheat.mode.indexOf('r') < 0 && showLyrics && lyricsGroups.length > 0) vextab += VexTab.Text2VexTab(lyricsGroups, offset, staveLength, 12, 'Times-11-italic')
              if (songcheat.mode.indexOf('r') < 0 && chordGroups.length > 0) vextab += VexTab.Text2VexTab(chordGroups, offset, staveLength, stems ? -1 : 1, 'Arial-10-normal')
              vextab += 'options space=' + (songcheat.mode.indexOf('r') ? 30 : 10) + '\n'
            }

            // space after staves
            vextab += 'options space=' + 10 + '\n'

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

    return vextab
  }
}
