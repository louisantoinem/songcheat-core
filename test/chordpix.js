let { ChordPix, ChordPixException } = require('..')
let stringify = require('json-stringify-pretty-compact')

let tests = [
  'http://invalid.url',
  'http://chordpix.com/i/450/6/4/1/x32010/032010/-/C.png',
  'http://chordpix.com/i/450/6/4/1/244422/123411/2/F♯sus4.png',
  'http://chordpix.com/i/450/6/5/7/x120x5/04200T/-/Test.png',
  'http://chordpix.com/i/450/6/4/1/x13231/013241/1/B♭maj7.png',
  'http://chordpix.com/i/450/6/5/1/x13231/013241/1/B♭maj7.png', // showing 5 frets while 4 are enough
  'http://chordpix.com/i/450/6/4/20/x13321/013421/1/Cm.png',
  'http://chordpix.com/i/450/6/6/3/x24342/044444/2/B♭maj7.png',
  'http://chordpix.com/i/450/6/4/12/x13321/013421/1/Bm.png'
]

for (let testUrl of tests) {
  try {
    console.log(`[TESTING "${testUrl}"]`)

    let chord = ChordPix.parse(testUrl)
    console.log('\tParsed: ' + stringify(chord, { maxLength: 120 }))

    let url = ChordPix.url(chord)
    console.log('\tRebuilt URL: ' + url + '\n\t' + (url === testUrl ? 'SAME' : 'DIFFERENT'))

    if (url !== testUrl) console.log('\tNB: This may be normal if original image was showing more frets than needed and/or if starting fret was not optimal.')

  } catch (e) {
    console.log("\tFAILED: " + e.toString())
    if (!(e instanceof ChordPixException)) console.error(e)
  }
}

console.log('Done!')