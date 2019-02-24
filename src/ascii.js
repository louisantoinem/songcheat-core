import { Utils } from './utils'
import { Compiler } from './compiler'

let KEEP_EMPTY_LINES = false

export class AsciiException {
  constructor (message) {
    this.message = message
  }

  toString () {
    return 'Ascii error: ' + this.message
  }
}

class Ascii_ {
  constructor (DEBUG) {
    // DEBUG 1 forces showing . * | characters in unit text (even if showDots is passed false) as well as _ for groups that were automatically created when crossing a bar
    this.DEBUG = DEBUG
  }

  log () {
    if (this.DEBUG > 0) console.log.apply(console, arguments)
  }

  getUnitsText (units, maxConsecutiveSpaces, split, showDots, chordsWrapper) {
    let unitText = ''
    let groupIndex = 0
    let chordInserts = []
    let splitPositions = []
    let unitIndex = 0
    let splitAtNextNewLine = false

    chordsWrapper = chordsWrapper || (s => { return s })

    for (let unit of units) {
      let barIndex = 0

      if (unitIndex > 0) {
        let group = unit.lyricsGroups.groups[0]
        if (split === 0 && group.leftArrow) splitAtNextNewLine = true
        else if (split === 0 && group.rightArrow) {
          // set split position at last newline of previous unit
          let splitPosition = [...unitText.replace(/\n?([^\n]*)$/, '').replace(/\n/g, '')].length
          // if there is no newline in previous unit, split position would be smaller than the last registered split position, which is not valid
          // in this case, register split position to be the same as the previous one, meaning that the whole previous unit will be sucked into this one
          if (splitPositions.length == 0 || splitPositions[splitPositions.length - 1] < splitPosition) splitPositions.push(splitPosition)
          else splitPositions.push(splitPositions[splitPositions.length - 1])
        } else splitPositions.push([...unitText.replace(/\n/g, '')].length)
      }
      unitIndex++

      // concatenate lyrics groups, giving them a number of positions proportional to their duration
      for (let group of unit.lyricsGroups.groups) {
        // an hyphen means a word has been cut in two, no need for a space before next group
        // but if the final character should be a bar, then always count this extra character
        let needFinalSpace = group.data.bar || !group.text.match(/-$/)

        // where and on how many positions will this group be displayed
        let position = [...unitText.replace(/\n/g, '')].length
        let strlen = Math.ceil(group.length.units * unit.pmax)

        // used if maxConsecutiveSpaces is set (and displayed in debug message)
        let maxLength = null
        let fitLength = group.data.len + (needFinalSpace ? 1 : 0)

        // get length needed for chord changes
        let chordsLength = 0
        for (let chordChange of group.data.chordChanges.groups) {
          // add 1 if start of first (non empty) chord group does not match start of text group
          if (chordsLength === 0 && chordChange.offset.compare(group.offset) !== 0) chordsLength = 1

          chordsLength += chordChange.text.length
        }

        // add 1 for the final bar sign if any
        chordsLength += group.data.bar ? 1 : 0

        // if maxConsecutiveSpaces is set
        if (maxConsecutiveSpaces > 0) {
          // set a maximum for the number of allowed positions
          let additionalSpaces = maxConsecutiveSpaces - 1
          strlen = Math.min(strlen, maxLength = fitLength + additionalSpaces)

          // but if group has associated chords, we must have enough space for them (and this has priority over maxConsecutiveSpaces)
          strlen = Math.max(strlen, Math.max(fitLength, chordsLength))
        }

        // filler string used to reach that length (nb: filler will always have a length of at least 1)
        let filler = Utils.spaces(strlen - group.data.len, showDots || this.DEBUG ? '.' : ' ')

        // replace last character of filler by a | if this is the end of a bar
        filler = filler.replace(/(.)$/, group.data.bar ? (split > 0 && (barIndex + 1) % split === 0 ? '|\n' : '|') : (this.DEBUG ? '*' : '$1'))

        // append filler to text, replace consecutive new lines by one space (or remove if newlines are at start of line) if splitting at bars
        var groupText = (split > 0 ? group.text.replace(/^\n+/g, '').replace(/\n+/g, ' ') : group.text) + filler

        this.log('Display group ' + (groupIndex + 1) + ' "' + groupText.replace(/\n/g, '\\') + '" on ' + strlen + ' chars (FullLength=ceil(' + (group.length.units * unit.pmax).toFixed(2) + ') MaxLength=' + (maxLength || 'n/a') + ' FitLength=' + fitLength + ' ChordsLength=' + chordsLength + ')')
        unitText += groupText

        if (splitAtNextNewLine && group.text.match(/\n/)) {
          splitPositions.push([...unitText.replace(/\n([^\n]*)$/, '').replace(/\n/g, '')].length)
          splitAtNextNewLine = false
        }

        // build chord inserts each with the text and position where to insert
        let lengthStillToPlaceOnThisGroup = 0
        let lengthYetPlacedOnThisGroup = 0

        // compute length of all chord inserts
        for (let chordChange of group.data.chordChanges.groups) lengthStillToPlaceOnThisGroup += chordChange.text.length

        for (let chordChange of group.data.chordChanges.groups) {
          // position of the chord will be the position of the group + length corresponding to offset delta
          let positionDelta = Math.ceil((chordChange.offset.sub(group.offset).units / group.length.units) * strlen)
          let positionDelta_ = positionDelta

          // ensure that chord name will not cross end of group it belongs to (last char of group must not be overwritten either if it is a bar)
          while (positionDelta + lengthStillToPlaceOnThisGroup > strlen - (group.data.bar ? 1 : 0)) { positionDelta-- }

          // ensure that chords already there still have enough room
          while (positionDelta - lengthYetPlacedOnThisGroup < 0) { positionDelta++ }

          // if start of chord group does not match start of text group, delta must be at least 1
          if (chordChange.offset.compare(group.offset) !== 0) positionDelta = positionDelta === 0 ? 1 : positionDelta

          let chordInsert = { unit: unit, text: chordChange.text, offset: chordChange.offset, position: position + positionDelta }
          this.log('Should insert ' + chordInsert.text + ' @ ' + chordInsert.offset + ' / ' + chordInsert.position + ' chars (position delta from group start = ' + positionDelta + ' chars, initially ' + positionDelta_ + ' chars)')
          chordInserts.push(chordInsert)

          lengthYetPlacedOnThisGroup = positionDelta + chordChange.text.length
          lengthStillToPlaceOnThisGroup -= chordChange.text.length
        }

        groupIndex++
        if (group.data.bar) barIndex++
      }
    }

    // insert these chord inserts
    let position = 0
    let nextSplitIndex = 0
    let skip = 0
    let unitText_ = unitText
    let chordText = ''
    let curUnit = null
    let texts = []
    unitText = ''

    for (let char of unitText_) {
      if (splitPositions.length > nextSplitIndex && position === splitPositions[nextSplitIndex]) {
        // use a while in case we have several identical split positions in a row
        // this can happen when a ">" caused the whole previous unit to be sucked in
        while (splitPositions.length > nextSplitIndex && position === splitPositions[nextSplitIndex]) {
          // interlace the two strings to get the current text
          texts.push(Utils.interlace(chordText, unitText, null, KEEP_EMPTY_LINES))
          // start next text
          unitText = ''
          chordText = ''
          nextSplitIndex++
        }
      } else if (char === '\n') {
        unitText += '\n'
        chordText += '\n'
      }

      if (char === '\n') skip = 0
      else {
        for (let chordInsert of chordInserts) {
          if (!chordInsert.inserted) {
            if (chordInsert.position <= position) {
              this.log('Inserting ' + chordInsert.text + ' @ ' + position + ' chars')
              chordText += chordsWrapper(chordInsert.text, chordInsert.unit)
              chordInsert.inserted = true
              skip = chordInsert.text.length
              curUnit = chordInsert.unit
            }
          }
        }

        position++

        // add char to unit text, and corresponding space to chord text
        // only bar symbols are added in chord text instead of unit text (if showing dots, then bars are displayed in both texts)
        if (skip === 0) { chordText += char === '|' ? chordsWrapper(char, curUnit) : ' ' } else { skip-- }
        unitText += char === '|' && !(showDots || this.DEBUG) ? ' ' : char
      }
    }

    // interlace the two remaining strings to get the last text
    texts.push(Utils.interlace(chordText, unitText, null, KEEP_EMPTY_LINES))

    return texts
  }
}

/**
 * Public API
 */

export class Ascii {
  constructor (songcheat, DEBUG) {
    this.ascii_ = new Ascii_(DEBUG)
    this.songcheat = songcheat
  }

  getUnitsText (units, maxConsecutiveSpaces, split, showDots, chordsWrapper) {
    console.log(Utils.title(`GET UNITS TEXT ${units.length} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, showDots = ${showDots})`))
    return this.ascii_.getUnitsText(units, maxConsecutiveSpaces, split, showDots, chordsWrapper)
  }

  getUnitText (unit, maxConsecutiveSpaces, split, showDots, chordsWrapper) {
    console.log(Utils.title(`GET UNIT TEXT ${unit.name} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, showDots = ${showDots})`))
    return this.ascii_.getUnitsText([unit], maxConsecutiveSpaces, split, showDots, chordsWrapper)[0]
  }

  getPartsText (parts, maxConsecutiveSpaces, split, showDots, chordsWrapper) {
    let units = []
    let compiler = new Compiler()
    for (let part of parts) units.push(compiler.getPartUnit(this.songcheat, part))
    console.log(Utils.title(`GET PART TEXT ${parts.length} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, showDots = ${showDots})`))
    return this.ascii_.getUnitsText(units, maxConsecutiveSpaces, split, showDots, chordsWrapper)
  }

  getPartText (part, maxConsecutiveSpaces, split, showDots, chordsWrapper) {
    console.log(Utils.title(`GET PART TEXT ${part.name} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, showDots = ${showDots})`))
    return this.ascii_.getUnitsText([new Compiler().getPartUnit(this.songcheat, part)], maxConsecutiveSpaces, split, showDots, chordsWrapper)[0]
  }
}
