import { Utils } from './utils'

let MIN_LYRICS_BARLEN = 20 // minimum length of a bar lyrics (before reducing) - not really needed but produces a clearer view when maxConsecutiveSpaces set to 0 (and thus when displaying parts with partdisplay=full) since bars with no or little text will have the same length (unless there are really many chord changes...)
let LYRICS_SUM_DURATIONS = false // if true "::" is equivalent to ":h:" (assuming lyrics unit is :q)
let KEEP_EMPTY_LINES = false

export class LyricsException {
  constructor (message) {
    this.message = message
  }

  toString () {
    return 'Lyrics error: ' + this.message
  }
}

class Lyrics_ {
  constructor (DEBUG) {
    // DEBUG 1 forces showing . * | characters in unit text (even if showDots is passed false) as well as _ for groups that were automatically created when crossing a bar
    this.DEBUG = DEBUG
  }

  log () {
    if (this.DEBUG > 0) console.log.apply(console, arguments)
  }

  parseLyrics (unit, defaultCursorStep, barDuration) {
    let warnings = []
    let offset = 0

    // remove DOS newlines
    unit.lyrics = (unit.lyrics || '').replace(/\r/g, '')

    // split lyrics into word groups, split occurs at cursor forward instructions (colons, durations and bars)
    unit.groups = []
    for (let part of unit.lyrics.split(/((?::(?:w|h|q|8|16|32)d?)?:|\|)/)) { // nb: split with capture groups only works in decent browsers, e.g. IE10+
      let match = null
      // move cursor forward by given or default step duration
      if ((match = part.match(/(:(?:w|h|q|8|16|32)d?)?:/))) offset = this.registerGroup(unit, offset, match[1] ? Utils.duration(match[1]) : defaultCursorStep, barDuration)

      // move cursor to begin of next bar
      else if (part.match(/\|/)) offset = this.registerGroup(unit, offset, barDuration - (offset % barDuration), barDuration)

      // (non empty) word group (waiting for its duration)
      else if (part.length > 0) unit.groups.push({ text: part, offset: offset, duration: 0 })
    }

    // simulate a final bar if last group still open (no duration), i.e. if lyrics do not end on a : or |
    if (unit.groups.length && unit.groups[unit.groups.length - 1].duration === 0) offset = this.registerGroup(unit, offset, barDuration - (offset % barDuration), barDuration)

    // get missing duration and complete with empty groups if needed (offset now contains the total duration of all groups)
    let missingDuration = unit.part.duration - offset
    this.log('[' + unit.name + '] Missing duration = ' + missingDuration + ' units (' + unit.part.duration + ' - ' + offset + ') = ' + (missingDuration / barDuration) + ' bars missing')
    if (missingDuration < 0) warnings.push('Lyrics contain ' + Math.floor(-missingDuration / barDuration) + ' bar(s)' + (-missingDuration % barDuration ? ' and ' + Utils.durationcodes(-missingDuration % barDuration) : '') + ' in excess')
    offset = this.registerGroup(unit, offset, missingDuration, barDuration)

    for (let group of unit.groups) {
      // compute length of group (in chars), adding 1 so the group having max density is not collated with next group
      let groupLength = this.getGroupLength(group) + 1

      // ensure the bar will always have the required minimal width
      group.plen = Math.max(groupLength, Math.ceil(MIN_LYRICS_BARLEN * group.duration / barDuration))

      // compute density of group based on the obtained length
      group.p = group.plen / group.duration

      // set bar true if group ends on a bar
      group.bar = (group.offset + group.duration) % barDuration === 0

      // initialize chord changes
      group.chordChanges = { 'bar': [], 'rhythm': [], 'phrase': [] }
    }

    // compute maximum density across all groups
    unit.pmax = 0
    for (let group of unit.groups) unit.pmax = Math.max(unit.pmax, group.p)

    // iterate on each phrase wise chord change and find the associated group
    offset = 0
    for (let phrase of unit.part.phrases) {
      for (let chordDuration of phrase.chordChanges) {
        // find closest group starting at or before chord offset
        let group = null
        for (let g of unit.groups) { if (g.offset <= offset) group = g }
        if (!group) throw new LyricsException('No closest group found for chord ' + chordDuration.chord.name + ' with offset ' + offset + ' units')

        // register chord change in group
        group.chordChanges['phrase'].push({ offset: offset, text: Utils.getChordDisplay(chordDuration) })

        offset += chordDuration.duration
      }
    }

    // iterate on each bar wise chord change and find the associated group
    offset = { 'rhythm': 0, 'bar': 0 }
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let chordChangesMode of ['rhythm', 'bar']) {
          for (let chordDuration of bar.chordChanges[chordChangesMode]) {
            // find closest group starting at or before chord offset
            let group = null
            for (let g of unit.groups) { if (g.offset <= offset[chordChangesMode]) group = g }
            if (!group) throw new LyricsException('No closest group found for chord ' + chordDuration.chord.name + ' with offset ' + offset[chordChangesMode] + ' units')

            // register chord change in group
            group.chordChanges[chordChangesMode].push({ offset: offset[chordChangesMode], text: Utils.getChordDisplay(chordDuration) })

            offset[chordChangesMode] += chordDuration.duration
          }
        }
      }
    }

    // debug info
    var debugText = 'Groups of unit [' + unit.name + ']:\n'
    var barIndex = 0
    let zeroDuration = false
    for (let group of unit.groups) {
      debugText += '\tBar ' + (barIndex + 1) + '\t[' + group.text.replace(/\n/g, '\\N') + ']:' + group.duration + ' (' + group.offset + ' - ' + (group.offset + group.duration) + ') L=' + this.getGroupLength(group) + " L'=" + group.plen + ' ρ=' + group.p.toFixed(2) + ' #Chord changes %bar= ' + group.chordChanges['bar'].length + ' %phrase= ' + group.chordChanges['phrase'].length
      if (group.duration === 0) zeroDuration = true
      if (group.bar) {
        barIndex++
        debugText += ' | '
      }
      debugText += '\n'
    }
    debugText += 'ρ max = ' + unit.pmax.toFixed(2)
    this.log(debugText)

    if (zeroDuration) throw new LyricsException('Detected group with 0 duration')

    return warnings
  }

  getUnitText (unit, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
    var unitText = ''

    // concatenate lyrics groups, giving them a number of positions proprtional to their duration
    var barIndex = 0
    var groupIndex = 0
    for (let group of unit.groups) {
      // where and on how many positions will this group be displayed
      group.position = [...unitText.replace(/\n/g, '')].length
      group.length = Math.ceil(group.duration * unit.pmax)

      // an hyphen means a word has been cut in two, no need for a space before next group
      // but if the final character should be a bar, then always count this extra character
      let needFinalSpace = group.bar || !group.text.match(/-$/)

      // if maxConsecutiveSpaces is set, set a maximum for the number of allowed positions if needed
      let maxLength = null
      if (maxConsecutiveSpaces > 0) maxLength = this.getGroupLength(group) + maxConsecutiveSpaces - (needFinalSpace ? 0 : 1)
      if (maxLength) group.length = Math.min(group.length, maxLength)

      // but if group has associated chords, we must have enough space for them (and this has priority over maxConsecutiveSpaces)
      let minLength = group.bar ? 1 : 0 // 1 for the final bar sign if any
      if (group.chordChanges[chordChangesMode]) { for (let i = 0; i < group.chordChanges[chordChangesMode].length; i++) minLength += group.chordChanges[chordChangesMode][i].text.length }
      minLength = Math.max(this.getGroupLength(group) + (needFinalSpace ? 1 : 0), minLength)
      group.length = Math.max(group.length, minLength)

      // filler string used to reach that length (nb: filler will always have a length of at least 1)
      let filler = Utils.spaces(group.length - this.getGroupLength(group), showDots || this.DEBUG ? '.' : ' ')

      // replace last character of filler by a | if this is the end of a bar
      filler = filler.replace(/(.)$/, group.bar ? (split > 0 && ((barIndex + 1) % split === 0) ? '|\n' : '|') : (this.DEBUG ? '*' : '$1'))

      // append filler to text, remove new lines if splitting at bars
      var groupText = (split > 0 ? group.text.replace(/\n/g, '') : group.text) + filler

      this.log('[' + unit.name + '] Display group ' + (groupIndex + 1) + ' "' + groupText.replace(/\n/g, '\\N') + '" on ' + group.length + ' chars (CEIL ' + (group.duration * unit.pmax).toFixed(2) + ' MIN ' + minLength + ' MAX ' + (maxLength || 'n/a') + ')')
      unitText += groupText

      groupIndex++
      if (group.bar) barIndex++
    }

    // we weren't asked to add chords
    if (!chordChangesMode) return unitText

    // build chord inserts, based on bar or phrase wise changes, each with the text and position where to insert
    let chordInserts = []
    for (let group of unit.groups) {
      let lengthStillToPlaceOnThisGroup = 0
      let lengthYetPlacedOnThisGroup = 0

      // compute length of all chord inserts
      for (let chordChange of group.chordChanges[chordChangesMode]) lengthStillToPlaceOnThisGroup += chordChange.text.length

      for (let chordChange of group.chordChanges[chordChangesMode]) {
        // position of the chord will be the position of the group + length corresponding to offset delta
        let positionDelta = Math.ceil(((chordChange.offset - group.offset) / group.duration) * group.length)
        let positionDelta_ = positionDelta

        // ensure that chord name will not cross end of group it belongs to (last char of group must not be overwritten either if it is a bar)
        while (positionDelta + lengthStillToPlaceOnThisGroup > group.length - (group.bar ? 1 : 0)) { positionDelta-- }

        // ensure that chords already there still have enough room
        while (positionDelta - lengthYetPlacedOnThisGroup < 0) { positionDelta++ }

        this.log('Closest group "' + group.text.replace(/\n/g, '\\n') + '" with offset ' + group.offset + ' and position ' + group.position + ' found for ' + chordChange.text.trim() + ' with offset ' + chordChange.offset + ' units\n\tposition delta from group start = ' + positionDelta + ' chars (initially ' + positionDelta_ + ' chars)')
        chordInserts.push({ text: chordChange.text, offset: chordChange.offset, position: group.position + positionDelta })

        lengthYetPlacedOnThisGroup = positionDelta + chordChange.text.length
        lengthStillToPlaceOnThisGroup -= chordChange.text.length
      }
    }

    for (let chordInsert of chordInserts) this.log('[' + unit.name + '] Should insert ' + chordInsert.text + ' @ ' + chordInsert.offset + ' units / ' + chordInsert.position + ' chars')

    // insert these chord inserts
    let position = 0
    let skip = 0
    let unitText_ = unitText
    let chordText = ''
    unitText = ''
    for (let char of unitText_) {
      if (char === '\n') {
        unitText += '\n'
        chordText += '\n'
        skip = 0
      } else {
        for (let chordInsert of chordInserts) {
          if (!chordInsert.inserted) {
            if (chordInsert.position <= position) {
              this.log('[' + unit.name + '] Inserting ' + chordInsert.text + ' @ ' + position + ' chars')
              chordText += chordInsert.text
              chordInsert.inserted = true
              skip = chordInsert.text.length
            }
          }
        }

        position++

        // add char to unit text, and corresponding space to chord text
        // only bar symbols are added in chord text instead of unit text (if showing dots, then bars are displayed in both texts)
        if (skip === 0) { chordText += char === '|' ? char : ' ' } else { skip-- }
        unitText += char === '|' && !(showDots || this.DEBUG) ? ' ' : char
      }
    }

    // and interlace the two strings
    return Utils.interlace(chordText, unitText, null, KEEP_EMPTY_LINES)
  }

  registerGroup (unit, offset, step, barDuration) {
    if (!barDuration) throw new LyricsException('Invalid bar duration passed to registerGroup')

    while (step > 0) {
      // duration added to preceding group may never be more than what's left until end of bar
      let addDuration = Math.min(step, barDuration - (offset % barDuration))

      // create a new group if none or if preceding already got its duration
      if (!unit.groups.length || (!LYRICS_SUM_DURATIONS && unit.groups[unit.groups.length - 1].duration > 0)) unit.groups.push({ text: '', offset: offset, duration: 0 })

      // add this duration to preceding group (create it if needed)
      unit.groups[unit.groups.length - 1].duration += addDuration
      offset += addDuration
      step -= addDuration

      // step is going to cross end of bar: directly create a first empty group
      if (step > 0) unit.groups.push({ text: this.DEBUG > 1 ? '_' : '', offset: offset, duration: 0 })
    }

    return offset
  }

  getGroupLength (group) {
    // return the number of visible graphemes in group text
    // - newlines are not counted
    // - tabs will be converted to spaces and may thus count as 1
    // - use spread operator to correctly count astral unicode symbols
    return [...group.text.replace(/\n/g, '')].length
  }
}

/**
 * Public API
 */

export class Lyrics {
  constructor (songcheat, DEBUG) {
    this.lyrics_ = new Lyrics_(DEBUG)
    this.songcheat = songcheat
  }

  parseLyrics (unit) {
    console.log(Utils.title('PARSE UNIT LYRICS ' + unit.name))
    return this.lyrics_.parseLyrics(unit, Utils.duration(this.songcheat.lyricsUnit), this.songcheat.barDuration)
  }

  getUnitText (unit, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
    console.log(Utils.title(`GET UNIT TEXT ${unit.name} (maxsp ${maxConsecutiveSpaces} split ${split} mode ${chordChangesMode} dots ${showDots})`))
    return this.lyrics_.getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots)
  }

  getPartText (part, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
    // dummy unit with no lyrics
    let unit = { name: part.name, part: part }

    console.log(Utils.title('PARSE PART LYRICS ' + unit.name))
    this.lyrics_.parseLyrics(unit, Utils.duration(this.songcheat.lyricsUnit), this.songcheat.barDuration)

    console.log(Utils.title(`GET PART TEXT ${unit.name} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, chordChangesMode = ${chordChangesMode}, showDots = ${showDots})`))
    return this.lyrics_.getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots)
  }
}
