let { Utils, Mode, Scale } = require('..')

function T (s) {
  console.log(Utils.title(s))
}

function L (o) {
  for (let k in o) console.log(`[${k}] ${o[k]}`)
}

T('Mode')
let modeC = new Mode([2, 2, 1, 2, 2, 2, 1]) // Mode Ionien, Mode de Do, "Gamme" Majeure
let modeA = new Mode([2, 1, 2, 2, 1, 2, 2]) // Mode Eolien, Mode de La, "Gamme" Mineure naturelle
let modeMinorH = new Mode([2, 1, 2, 2, 1, 3, 1]) // "Gamme" Mineure harmonique

L({
  modeC,
  modeA
})

T('Scales')
let o = {}
for (let keynote of ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C#', 'G#', 'D#', 'A#', 'Gb']) {
  o['Major scale in ' + keynote] = new Scale(modeC, keynote)
  o['Natural minor scale in ' + keynote] = new Scale(modeA, keynote)
  o['Harmonic minor scale in ' + keynote] = new Scale(modeMinorH, keynote)
}
L(o)

T('The End!')
