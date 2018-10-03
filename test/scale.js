let { Utils, Mode, Scale } = require('..')

function T (s) {
  console.log(Utils.title(s))
}

function L (o) {
  for (let k in o) console.log(`[${k}] ${o[k]}`)
}

T('Mode')
let modeC = new Mode([2, 2, 1, 2, 2, 2, 1], ['', 'm', 'm', '', '', 'm', '°']) // Mode Ionien, Mode de Do, "Gamme" Majeure
let modeA = new Mode([2, 1, 2, 2, 1, 2, 2], ['m', '°', '', 'm', 'm', '', '']) // Mode Eolien, Mode de La, "Gamme" Mineure naturelle
let modeMinorH = new Mode([2, 1, 2, 2, 1, 3, 1]) // "Gamme" Mineure harmonique

L({
  modeC,
  modeA
})

let keynotes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C#', 'G#', 'D#', 'A#', 'Gb']

T('Major scales')
let o = {}
for (let keynote of keynotes) o['Major scale in ' + keynote] = new Scale(modeC, keynote)
L(o)

T('Natural minor scales')
o = {}
for (let keynote of keynotes) o['Natural minor scale in ' + keynote] = new Scale(modeA, keynote)
L(o)

T('Harmonic minor scales')
o = {}
for (let keynote of keynotes) o['Harmonic minor scale in ' + keynote] = new Scale(modeMinorH, keynote)
L(o)

T('Chord progressions')
let scale = new Scale(modeC, 'G')
L({'I-IV-vi-V': scale.chords([1, 4, 6, 5])})
L({'I-V-vi-IV': scale.chords([1, 5, 6, 4])})

T('The End!')
