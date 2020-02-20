import { Time } from './time'
import { Chord } from './chord'
import { Score } from './score'
import { ScoreParser } from './score_parser'
import { GroupParser } from './group_parser'

let NEXT_ID = 1

export class Rhythm {
  constructor (name, time, scoreText, inline) {
    if (!(time instanceof Time)) throw new Error(`new Rhythm: time must be a Time (got ${typeof time})`)
    this.id = NEXT_ID++
    this.name = name
    this.score = (new ScoreParser(time)).parse(scoreText)
    this.inline = inline
    console.log(`Compiled rhythm : ${this}`)

    this.chordGroupsCache = new Map()
    this.chordedScoreCache = new Map()
  }

  chordGroups (chordsText, chords) {
    if (!(chords instanceof Array)) throw new Error(`Rhythm.chordGroups: chords must be of type Array (got ${typeof chords})`)

    // look in cache
    if (this.chordGroupsCache.get(chordsText)) {
      console.log(`Got chord groups from cache`)
      return this.chordGroupsCache.get(chordsText)
    }

    // parse `chordsText` into a GroupList of chord groups (i.e. having a Chord object as `data`)
    let groupParser = new GroupParser(this.score)
    let chordGroups = groupParser.parse(chordsText)
    if (groupParser.warnings.length) throw new Error(groupParser.warnings[0])

    // find actual Chord object for each group then update parsed group.text and set group.data
    let chord = new Chord('AIR', '000000', null, null, true)
    for (let group of chordGroups.groups) {
      // retrieve chord by its name (adding inline chord - if any created - in `chords`)
      if (group.text.trim()) chord = this._getChord(chords, group.text)

      // "hide" inline chords and add a trailing white space:
      // - prevents chord names to be glued together
      // - prevents a next group from starting directly after last chord of previous group
      // - if text is empty (because chord group has been split at bar or because chord is inline),
      //   it also ensures that a white space in ascii lyrics will show that next change does not happen at the begin of the bar
      // nb: for an empty group, i.e. a simple chord repeater, don't add a trailing space
      if (group.text) group.text = (chord.inline ? '' : group.text.trim()) + ' '
      group.data = chord
    }

    console.log(`Got chord groups : ${chordGroups}`)
    this.chordGroupsCache.set(chordsText, chordGroups)
    return chordGroups
  }

  chordedScore (chordGroups) {
    // look in cache
    if (this.chordedScoreCache.get(chordGroups)) {
      console.log(`Got chorded score from cache`)
      return this.chordedScoreCache.get(chordGroups)
    }

    // create a new score and for each note in our score
    let chordedScore = new Score(this.score.time)
    let noteOffset = this.score.start()
    for (let note of this.score.notes) {
      // find the chord group at corresponding offset
      let chordGroup = chordGroups.groupAt(noteOffset)
      if (!chordGroup) throw new Error(`Rhythm.chordedScore: could not find chord group at offset ${noteOffset} in ${chordGroups})`)
      if (!chordGroup.data) throw new Error(`Rhythm.chordedScore: chord group with null data found at offset ${noteOffset} in ${chordGroups})`)

      // then add the chorded note in the new score
      chordedScore.addNote(note.setChord(note.chord || chordGroup.data))
      noteOffset = noteOffset.add(note.duration)
    }

    console.log(`Got chorded score : ${chordedScore}`)
    this.chordedScoreCache.set(chordGroups, chordedScore)
    return chordedScore
  }

  toString () {
    return `${this.inline ? '(inline)' : this.name} ${this.score}`
  }

  //
  // Private stuff
  //

  _getChord (chords, chordName) {
    chordName = chordName.trim()

    // search for chord by its name (if several, use last one)
    let chordNames = []
    let foundChord = null
    for (let chord of chords) {
      if (chord.name.trim() === chordName) foundChord = chord
      chordNames.push(chord.name)
    }

    if (foundChord) return foundChord

    // if no chord found with this name but this is a valid chord tablature (with an optional barred fret /[-0-9A-Z])
    if (chordName.match(/^[x0-9A-Z]{6}(\/[-0-9A-Z])?$/)) {
      // create inline chord with the name being the tablature itself (no fingering except barred fret and no comment)
      let chord = new Chord(chordName, chordName.split('/')[0], '000000/' + (chordName.split('/')[1] || '-'), '', true)

      // push inline into the received `chords` array, so that the chord is found by its name next time if used several times
      chords.push(chord)

      return chord
    }

    // not found by name and not a valid chord tablature
    throw new Error('"' + chordName + '" is not the name of an existing chord (' + (chordNames.length ? chordNames : 'no registered chords') + ') and is not a valid chord tablature')
  }
}
