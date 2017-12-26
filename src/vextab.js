import { Utils } from './utils'

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
  static Chord2VexTab (chord, strings, transpose) {
    var vextabchord = []
    for (let o of Utils.chordStrings(chord, strings)) {
      vextabchord.push((o.mute ? 'X' : transpose + o.fret) + '/' + o.string)
    }
    return '(' + vextabchord.join('.') + ')'
  }

  static Note2VexTab (note, strokes, accents) {
    let vextab = ''

    // rest with given duration
    if (note.rest) vextab += Utils.durationcode(note.duration) + '#5#'

    else {
      // note duration, slashed if no chord given
      vextab += note.chord ? Utils.durationcode(note.duration) : Utils.durationcode(note.duration).replace(/(:(?:w|h|q|8|16|32))(d?)/g, '$1S$2')

      // if tied note
      if (note.tied) vextab += 'T'

      // chord or dummy note (for slash notation)
      vextab += !note.chord ? '(4/3)' : VexTab.Chord2VexTab(note.chord, note.strings, 0) // do not transpose with capo: chords are tabbed exactly as their diagrm says (author chooses to use capo'd chords or not)

      // stroke flag d or u (dd and uu are not built-in in vextab and are handled later through text2VexTab)
      if (strokes && note.flags.stroke && note.flags.stroke.length === 1) vextab += note.flags.stroke

      // accent (put on top)
      if (accents && note.flags.accent) vextab += '$.a>/' + accents + '.$'
    }

    return vextab
  }

  static Notes2Stave (songcheat, offset, notes, strokes, accents, subtitle, hs, notation, tablature) {
    let vextab = ''
    let barDuration = songcheat.barDuration

    console.log('Drawing ' + (notation ? 'notation ' : '') + (tablature ? 'tablature ' : '') + 'stave with ' + notes.length + ' notes')

    // start new stave with signature
    vextab += '\ntabstave notation=' + (notation ? 'true' : 'false') + ' tablature=' + (tablature ? 'true' : 'false') + '\n'
    vextab += 'tuning=' + songcheat.tuning + ' key=' + songcheat.signature.key + ' time=' + songcheat.signature.time.symbol + '\n'

    // add subtitle if first bar
    if (subtitle && offset === 0) vextab += 'text .' + hs + ',.font=Arial-10-bold,[' + subtitle + ']\n'

    vextab += 'notes '

    // initial bar line if needed (double if first bar)
    if (offset % barDuration === 0) vextab += (offset === 0 ? '=||' : '|')

    // add each note, followed by a bar or phrase sign if needed
    for (let note of notes) {
      vextab += VexTab.Note2VexTab(note, strokes, accents)
      offset += note.duration
      if (note.lastInPhrase && offset % barDuration !== 0) console.warn('Phrase matches no bar (' + Utils.durationcodes(barDuration - offset % barDuration) + ' away)')
      if (offset % barDuration === 0) vextab += note.lastInPhrase ? '=||' : '|'
    }

    return vextab + '\n'
  }

  static Text2VexTab (textGroups, barDuration, offset, staveDuration, h, font) {
    let text = ''

    // for groups that start within our range
    for (let group of textGroups) {
      if (group.offset >= offset + staveDuration) break
      if (group.offset >= offset) {
        let line = 'text ++,.' + h + ',.font=' + font

        // initial bar line if needed
        if (offset % barDuration === 0) line += ',|'

        // add empty text groups to fill the gap between start of stave and start of group
        let gap = group.offset - offset
        while (gap > 0) {
          // gap duration may never be more than what's left until end of bar
          let d = Math.min(gap, barDuration - (offset % barDuration))
          for (let code of Utils.durationcodes(d)) line += ',' + code + ', '
          if ((offset + d) % barDuration === 0) line += ',|'

          // continue with remaining gap
          gap -= d
        }

        // add actual text group on all available duration until end of stave (or more precisely the largest duration code which is <= available duration)
        let available = offset + staveDuration - group.offset
        for (let code of Utils.durationcodes(available)) { line += ',' + code + ',' + (group.text.replace(/\n/g, '') || ' '); break }

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

  static Unit2VexTab (songcheat, unit, unitIndex) {
    let stems = songcheat.mode.indexOf('s') >= 0
    let showLyrics = songcheat.lyricsMode === 's'
    let barDuration = songcheat.barDuration

    let vextab = 'options tempo=' + songcheat.signature.tempo + ' player=false tab-stems=' + (stems ? 'true' : 'false') + ' tab-stem-direction=up\n'
    unitIndex = unitIndex || 0

    let staveDuration = 0
    let notes = []
    let notesSlashed = []

    console.log('VexTabbing unit ' + (unitIndex + 1) + ' "' + unit.name + '"')

    // space before first unit and between units
    vextab += 'options space=' + (unitIndex > 0 && songcheat.showUnitIndex === null ? 50 : 20) + '\n'

    // get lyrics word groups
    let lyricsGroups = []
    if (unit.groups) for (let group of unit.groups) lyricsGroups.push({ offset: group.offset, text: group.text + (DEBUG ? '/' + group.duration : '') })

    // get rhythm wise chord changes (same as ascii lyrics)
    let offset = 0
    let chordGroups = []
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let chordChange of bar.chordChanges['rhythm']) {
          chordGroups.push({ offset: offset, text: chordChange.chord.name + (DEBUG ? '/' + chordChange.duration : '') })
          offset += chordChange.duration
        }
      }
    }

    // get PIMA and dd/uu word groups
    offset = 0
    let fingeringGroups = []
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let note of bar.rhythm.compiledScore) {
          if (note.flags.fingering) fingeringGroups.push({ offset: offset, text: note.flags.fingering.toLowerCase() })
          else if (note.flags.stroke && note.flags.stroke.length === 2) fingeringGroups.push({ offset: offset, text: note.flags.stroke === 'dd' ? '⤋' : '⤊' })
          offset += note.duration
        }
      }
    }

    // get PM word groups
    offset = 0
    let pmGroups = []
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let note of bar.rhythm.compiledScore) {
          if (note.flags.pm) pmGroups.push({ offset: offset, text: 'PM' })
          offset += note.duration
        }
      }
    }

    // for each phrase in unit
    offset = 0
    let phraseIndex = 0
    for (let phrase of unit.part.phrases) {
      console.log('\tphrase ' + (phraseIndex + 1))
      let lastPhraseInPart = phraseIndex === unit.part.phrases.length - 1

      // for each bar in phrase
      let barIndex = 0
      for (let bar of phrase.bars) {
        console.log('\t\tbar ' + (barIndex + 1))
        let lastBarInPhrase = barIndex === phrase.bars.length - 1

        // for each note in rhythm
        let noteIndex = 0
        for (let note of bar.rhythm.compiledScore) {
          // note with no chord set (slash)
          let phraseNote = JSON.parse(JSON.stringify(note))
          phraseNote.lastInPhrase = lastBarInPhrase && noteIndex === bar.rhythm.compiledScore.length - 1
          notesSlashed.push(phraseNote)

          // register note with corresponding chord
          let chordedPhraseNote = JSON.parse(JSON.stringify(phraseNote))
          chordedPhraseNote.chord = bar.chords[note.placeholderIndex]
          if (!chordedPhraseNote.chord) throw new VexTabException('No chord found for placeholder ' + (note.placeholderIndex + 1))
          notes.push(chordedPhraseNote)

          // draw staves when we have completed barsPerLine bars or if the part is done
          staveDuration += note.duration
          let partDone = lastPhraseInPart && phraseNote.lastInPhrase
          if (staveDuration >= songcheat.barsPerLine * barDuration || partDone) {
            console.log((partDone ? 'EOP' : 'EOL') + ' @ ' + staveDuration + ' units: drawing ' + notes.length + ' notes stave' + (songcheat.mode.length > 1 ? 's' : ''))

            // notation: shows unit.name, chords, accents, stems (slashes) and lyrics
            // if tablature is not displayed, it also shows strokes/fingering
            // it never shows PM and frets
            if (songcheat.mode.indexOf('r') >= 0) {
              let strokes = songcheat.mode.indexOf('t') < 0
              vextab += VexTab.Notes2Stave(songcheat, offset, notesSlashed, strokes, 'top', unit.name, -1, true, false)
              if (strokes && fingeringGroups.length > 0) vextab += VexTab.Text2VexTab(fingeringGroups, barDuration, offset, staveDuration, 11, 'Arial-9-normal') // PIMA on same line as strokes
              if (showLyrics && lyricsGroups.length > 0) vextab += VexTab.Text2VexTab(lyricsGroups, barDuration, offset, staveDuration, strokes ? 13 : 11, 'Times-11-italic')
              if (chordGroups.length > 0) vextab += VexTab.Text2VexTab(chordGroups, barDuration, offset, staveDuration, 2, 'Arial-10-normal')
              vextab += 'options space=' + (strokes ? 40 : 20) + '\n'
            }

            // tablature: shows PM, frets and strokes/fingering
            // if notation is not displayed, it also shows unit.name, chords, lyrics and stems (if mode "ts")
            // it never shows accents
            if (songcheat.mode.indexOf('t') >= 0) {
              if (stems) vextab += 'options space=' + 30 + '\n'
              vextab += VexTab.Notes2Stave(songcheat, offset, notes, true, false, songcheat.mode.indexOf('r') < 0 ? unit.name : false, stems ? -3 : -1, false, true)
              if (fingeringGroups.length > 0) vextab += VexTab.Text2VexTab(fingeringGroups, barDuration, offset, staveDuration, 10, 'Arial-9-normal') // PIMA on same line as strokes
              if (pmGroups.length > 0) vextab += VexTab.Text2VexTab(pmGroups, barDuration, offset, staveDuration, 10, 'Arial-9-normal') // PM on same line as strokes
              if (songcheat.mode.indexOf('r') < 0 && showLyrics && lyricsGroups.length > 0) vextab += VexTab.Text2VexTab(lyricsGroups, barDuration, offset, staveDuration, 12, 'Times-11-italic')
              if (songcheat.mode.indexOf('r') < 0 && chordGroups.length > 0) vextab += VexTab.Text2VexTab(chordGroups, barDuration, offset, staveDuration, stems ? -1 : 1, 'Arial-10-normal')
              vextab += 'options space=' + (songcheat.mode.indexOf('r') ? 30 : 10) + '\n'
            }

            // space after staves
            vextab += 'options space=' + 10 + '\n'

            // increment offset
            offset += staveDuration

            // clear workspace
            notes = []
            notesSlashed = []
            staveDuration = 0
          }

          // next note in rhythm
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
