import { Chord } from './chord'

export class ChordGenException extends Error {
  constructor (message) {
    super('ChordGen error: ' + message)
  }
  toString () {
    return this.message
  }
}

export class ChordGen {
  static url (chord, chordWidth) {
    try {
      if (!(chord instanceof Chord)) throw new Error(`ChordGen.url: chord must be of type Chord (got ${typeof chord})`)

      // convert fingering: remove barred fret and change 0 into -
      let fingering = chord.fingering.split('/')
      fingering = fingering[0].replace(/0/g, '-').replace(/P/g, 'T')

      // get tablature of numerical fret positions ("0" and "x" kept as is)
      let positions = ''
      for (let char of chord.tablature) {
        if (char === 'x' || char === '0') positions += char
        else {
          let position = Chord.char2fret(char)
          if (position >= 10 && positions.length > 0) positions = '-' + position
          else positions += position
        }
      }

      // use nice ♯ and ♭ in diagram (replace only last occurence for the b)
      let name = chord.inline ? ' ' : (chord.name ? chord.name.replace(/#/g, '♯').replace(/b([^b]*)$/, '♭$1') : chord.tablature)

      // convert width to a size between 1 and 10
      let size = Math.max(10, Math.ceil((chordWidth || 450) / 50))

      // build final url
      return 'http://chordgenerator.net/' + name + '.png?p=' + positions + '&f=' + fingering + '&s=' + size
    } catch (e) {
      throw new ChordGenException('[Chord ' + (chord.name || JSON.stringify(chord)) + '] ' + e.message)
    }
  }
}
