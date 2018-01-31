import { Time } from './time'
import { Note } from './note'
import { Interval } from './interval'

export class Score {
  constructor (time) {
    if (!(time instanceof Time)) throw new Error(`new Score: time must be a Time (got ${typeof time})`)
    this.time = time
    this.notes = []
    this.length = this.start()
  }

  start () {
    return new Interval(this.time)
  }

  addNote (note) {
    if (!(note instanceof Note)) throw new Error(`Score.addNote: note must be of type Note (got ${typeof note})`)

    // add and update length
    this.notes.push(note)
    this.length = this.length.add(note.duration)
  }

  replaceNote (index, note) {
    if (!(note instanceof Note)) throw new Error(`Score.replaceNote: note must be of type Note (got ${typeof note})`)
    if (!this.notes[index]) throw new Error(`Score.replaceNote: no note found at index (got ${index})`)

    // replace and update length
    let notePrev = this.notes[index]
    this.notes[index] = note
    this.length = this.length.sub(notePrev.duration).add(note.duration)
  }

  append (score) {
    if (!(score instanceof Score)) throw new Error(`Score.append: score must be of type Score (got ${typeof score})`)
    for (let note of score.notes) this.addNote(note)
  }

  // Return offset of first note starting after given offset (take and return Interval)
  alignOnNextNote (offset) {
    if (!(offset instanceof Interval)) throw new Error(`Score.alignOnNextNote: offset must be of type Interval (got ${typeof offset})`)
    let noteOffset = this.start()

    // return first note whose offset is beyond given offset
    for (let note of this.notes) {
      if (noteOffset.compare(offset) > 0) return noteOffset
      noteOffset = noteOffset.add(note.duration)
    }

    // not found
    throw new Error('No more note after ' + offset)
  }

  toString () {
    return `[${this.notes.join('] [')}]`
  }
}
