import { Utils } from './utils'

export class ChordPixException {
  constructor (message) {
    this.message = message
  }

  toString () {
    return 'Chordpix error: ' + this.message
  }
}

export class ChordPix {
  static parse (url) {
    try {
      // validate and explode url at slashes
      if (!url.match(/https?:\/\/chordpix.com\/i\/[0-9]+\/6\/[0-9]+\/[0-9]+\/[x0-6]{6}\/[T0-4]{6}\/(-|[0-9]+)\/.+\..+/)) throw new ChordPixException('Invalid ChordPix image URL')
      let parts = url.split(/\//)

      // get chord name replacing ♯ with # and ♭ with b so that chord names can be easily typed in songcheat text file
      let name = parts[11].split('.')[0].replace(/♯/g, '#').replace(/♭/g, 'b')

      // get starting fret
      let startingFret = parseInt(parts[7], 10)

      // get absolute barred fret (single char) ("-" kept as is)
      let barredFret = parts[10] === '-' ? parts[10] : Utils.rel2abs(parseInt(parts[10], 10), startingFret)

      // build an absolute tablature (single char x6) ("x" kept as is)
      let tablature = ''
      for (let char of parts[8]) tablature += char === 'x' ? char : Utils.rel2abs(parseInt(char, 10), startingFret)

      return {
        name: name,
        tablature: tablature,
        fingering: parts[9] + '/' + barredFret,
        comment: ''
      }
    } catch (e) {
      throw new ChordPixException('[URL ' + url + '] ' + e.message)
    }
  }

  static url (chord, chordWidth) {
    try {
      // convert 6 chars into 6 integers (null for x)
      let frets = []
      for (let char of chord.tablature) frets.push(char === 'x' ? null : Utils.char2fret(char))

      // get max and min fret (excluding null and 0), use 1 if chord has no frets at all
      let minFret = frets.filter(x => x).length > 0 ? Math.min(...frets.filter(x => x)) : 1
      let maxFret = frets.filter(x => x).length > 0 ? Math.max(...frets.filter(x => x)) : 1

      // get number of frets to display on diagram (with minimum of 4)
      let nbFrets = Math.max(4, maxFret + 1 - minFret)

      // get first fret displayed in the diagram: start at 1 if possible otherwise start at minFret
      let startingFret = maxFret + 1 - nbFrets <= 1 ? 1 : minFret

      // get relative barred fret ("-" kept as is)
      let fingering = chord.fingering.split('/')
      if (fingering[1] && fingering[1] !== '-') fingering[1] = Utils.abs2rel(fingering[1], startingFret)

      // build a relative tablature ("0" and "x" kept as is)
      let relTablature = ''
      for (let char of chord.tablature) relTablature += char === 'x' || char === '0' ? char : Utils.abs2rel(char, startingFret)

      // use nice ♯ and ♭ in diagram (replace only last occurence)
      let name = chord.name.replace(/#([^#]*)$/, '♯$1').replace(/b([^b]*)$/, '♭$1')

      // build final url
      return 'http://chordpix.com/i/' + (chordWidth || 450) + '/6/' + nbFrets + '/' + startingFret + '/' + relTablature + '/' + fingering.join('/') + '/' + name + '.png'
    } catch (e) {
      throw new ChordPixException('[Chord ' + chord.name + '] ' + e.message)
    }
  }
}
