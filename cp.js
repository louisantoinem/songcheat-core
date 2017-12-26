let readline = require('readline')
let { ChordPix } = require('.')

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

let reader = {

  // out final list of chords
  chords: [],

  // internal variables
  state: 0, // current state
  id: 1, // next id

  prompt: function () {
    this.check()

    switch (this.state) {
      case 0:
        return console.log('Copy/Paste a ChordPix link')
      case 1:
        return console.log(`Enter name, or skip to keep default name "${this.chords[this.chords.length - 1].name}"`)
      case 2:
        return console.log('Enter an optional comment')
    }

    throw new Error('Invalid state ' + this.state)
  },

  handleLine: function (line) {
    line = line.trim()

    if (line === 'bye') return true

    this.check()

    switch (this.state) {
      case 0:
        this.handleUrl(line)
        break

      case 1:
        this.handleName(line)
        break

      case 2:
        this.handleComment(line)
        break

      default:
        throw new Error('Invalid state ' + this.state)
    }

    this.state = (this.state + 1) % 3
  },

  // private stuff

  check: function () {
    if (this.state > 0 && this.chords.length <= 0) throw new Error("We should but don't have a current chord to update ?!")
  },

  handleUrl: function (line) {
    this.chords.push(ChordPix.parse(line))
  },

  handleName: function (line) {
    if (line) this.chords[this.chords.length - 1].name = line.indexOf(' ') >= 0 ? `"${line}"` : line
  },

  handleComment: function (line) {
    if (line) this.chords[this.chords.length - 1].comment = line
  }
}

function loop () {
  console.log('\nWelcome! Follow instructions or type "bye" when you are done\n')
  reader.prompt()
  rl.prompt()

  rl.on('line', (line) => {
    try {
      if (reader.handleLine(line)) { // returns true if done
        console.log('\nHere are your chords:\n')
        for (let chord of reader.chords) console.log(`CHORD ${chord.name}\t${chord.tablature} ${chord.fingering}` + (chord.comment ? ` "${chord.comment}"` : ''))
        rl.close()
      } else {
        reader.prompt()
        rl.prompt()
      }
    } catch (e) {
      console.error(e.message)
      console.log('Try again!')
      rl.prompt()
    }
  })
}

loop()
