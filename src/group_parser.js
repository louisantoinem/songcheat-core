import { Duration } from './duration'
import { Interval } from './interval'
import { Score } from './score'
import { Group } from './group'
import { GroupList } from './group_list'

export class GroupParser {
  constructor (score, unit) {
    if (!(score instanceof Score)) throw new Error(`new GroupParser: score must be a Score (got ${typeof score})`)
    if (unit && !(unit instanceof Duration)) throw new Error(`new GroupParser: unit must be a Duration (got ${typeof unit})`)
    this.score = score
    this.unit = unit
  }

  parse (text) {
    this.groupList = new GroupList()
    this.group = new Group('', this.score.start())
    this.warnings = []
    this.infos = []

    // remove DOS newlines
    text = (text || '').replace(/\r/g, '')

    // split text into Groups
    // split occurs at each cursor forward instruction: comma for next note, colon for next beat, pipe for next bar, or duration code(s) between semicolons (e.g. :hd: or :h:8:)
    // (nb: split with capture groups only works in decent browsers, e.g. IE10+)

    let splitRe = /((?::(?:w|h|q|8|16|32)d?)+:|:|,|\|)/
    for (let part of text.split(splitRe)) {
      if (part.length === 0) continue

      // words: register group and open new one containing these characters
      if (!part.match(splitRe)) this._register(part)
      else {
        // cursor forward instruction: extend group
        try {
          if (part.match(/(?::(?:w|h|q|8|16|32)d?)+:/)) {
            for (let code of part.split(':')) {
              if (code) {
                this.group.setEnd(this._end().add(new Duration(':' + code)))

                // register group if we reached a bar
                if (this._end().bar()) this._register()
              }
            }
          } else if (part.match(/:/)) this.group.setEnd(this._end().extendToMultipleOf(this.unit || this.score.time.beat))
          else if (part.match(/\|/)) {
            // register group if it has already got a length
            if (!this.group.length.zero()) this._register()

            // extend to bar
            this.group.setEnd(this._end().extendToBar())
          } else if (part.match(/,/)) this.group.setEnd(this.score.alignOnNextNote(this._end()))
        } catch (e) {
          this.warnings.push(e.message)
        }

        // and register group if we reached a bar
        if (this._end().bar()) this._register()
      }
    }

    // register last group if needed
    if (!this._empty()) this._close()

    // compare score and current end
    if (this.score.length.compare(this._end()) === 0) {
      this.infos.push(`Text length matches actual score`)
    }

    // missing: info and complete with empty groups
    if (this.score.length.compare(this._end()) > 0) {
      let missing = this.score.length.sub(this._end())
      this.infos.push(`Text ends ${missing} before actual score which is ${this.score.length}`)
      while (this.score.length.compare(this._end()) > 0) {
        let end = this._end()
        this._close()
        if (this._end().compare(end) === 0) throw new Error('Programming error: score end did not move after calling close()')
      }
    }

    // excess: warning
    if (this.score.length.compare(this._end()) < 0) {
      let excess = this._end().sub(this.score.length)
      this.warnings.push(`Text is ${excess} beyond actual score which is ${this.score.length}`)
    }

    for (let warning of this.warnings) console.warn(`GroupParse.parse [WARNING] ${warning}`)
    for (let info of this.infos) console.log(`GroupParse.parse [INFO] ${info}`)

    return this.groupList
  }

  // Private stuff

  _end () {
    return this.group.end()
  }

  _empty () {
    return this.group.length.zero() && this.group.text.length === 0
  }

  // Register group if not zero length
  // Return new group with given text, starting where last group ended
  _register (nextText) {
    if (!this.group.length.zero()) this.groupList.add(this.group)
    this.group = new Group(nextText || '', this._end())
  }

  // Register group after extending length if zero length
  _close () {
    if (this.group.length.zero()) {
      // group starts after score end: extend to next bar
      if (this.group.offset.compare(this.score.length) >= 0) this.group.setEnd(this._end().extendToBar())

      // group starts before score end: extend to next bar OR score end (which ever comes first)
      else this.group.setEnd(Interval.min(this.score.length, this._end().extendToBar()))
    }

    this._register()
  }
}
