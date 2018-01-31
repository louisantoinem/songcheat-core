import { Utils } from './utils'
import { Interval } from './interval'
import { Group } from './group'

export class GroupList {
  constructor () {
    this.groups = []
  }

  add (group) {
    this.groups.push(group)
  }

  append (groupList, offset) {
    for (let group of groupList.groups) {
      this.add(new Group(group.text, offset.add(group.offset), group.length, group.data))
    }
  }

  // Return from our groups the ones that start in [ other.offset, other.end() [
  groupsStartingIn (other) {
    let list = new GroupList()
    for (let group of this.groups) {
      if (group.offset.compare(other.offset) >= 0 && group.offset.compare(other.end()) < 0) list.groups.push(group)
    }
    return list
  }

  groupAt (offset) {
    if (!(offset instanceof Interval)) throw new Error(`GroupList.groupAt: offset must be of type Interval (got ${typeof offset})`)
    let lastGroup = null

    // return group just before first one whose offset is beyond given offset (or return last if none is beyond)
    for (let group of this.groups) {
      if (group.offset.compare(offset) > 0) break
      lastGroup = group
    }

    // not found
    if (!lastGroup) throw new Error('GroupList.groupAt: no group found at ' + offset)
    return lastGroup
  }

  toString () {
    const W = 20
    let lines = [`(${this.groups.length} groups)`]
    lines.push(Utils.spaces(W * 7, '-'))
    lines.push(Utils.padOn('Text', 2 * W) + Utils.padOn('Starts at', W) + Utils.padOn('Length', W) + Utils.padOn('Ends at', W) + Utils.padOn('Data', 2 * W))
    lines.push(Utils.spaces(W * 7, '-'))
    for (let group of this.groups) lines.push(Utils.padOn('"' + group.text.replace(/\n/, '\\') + '"', 2 * W) + Utils.padOn(group.offset, W) + Utils.padOn(group.length, W) + Utils.padOn(group.end(), W) + Utils.padOn(`${group.data}`, 2 * W))
    lines.push(Utils.spaces(W * 7, '-'))
    return lines.join('\n')
  }
}
