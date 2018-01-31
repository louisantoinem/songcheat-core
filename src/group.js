import { Interval } from './interval'

export class Group {
  constructor (text, offset, length, data) {
    if (!offset || !(offset instanceof Interval)) throw new Error(`new Group: offset is mandatory and must be of type Interval (got ${typeof offset})`)
    if (length && !(length instanceof Interval)) throw new Error(`new Group: length must be of type Interval (got ${typeof length})`)
    this.offset = offset
    this.length = length || offset._make(0)
    this.text = text || ''
    this.data = data || null
  }

  end () {
    return this.offset.add(this.length)
  }

  setEnd (end) {
    if (!(end instanceof Interval)) throw new Error(`Group.setEnd: end must be of type Interval (got ${typeof end})`)
    if (end.compare(this.offset) < 0) throw new Error(`Group.setEnd: candidate end ${end} is before ${this}`)
    this.length = end.sub(this.offset)
    return this
  }

  toString () {
    return '"' + this.text + '" starting at ' + this.offset + ' with a length of ' + this.length
  }
}
