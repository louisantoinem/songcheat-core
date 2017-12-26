import { Compiler } from '../src/compiler'
import { Player } from '../src/player'
import samples from 'songcheat-samples'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// create audio context
let audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext)()

// get a random sample songcheat and compile it
let sample = samples[Math.floor(Math.random() * samples.length)]
let compiler = new Compiler(sample, 0)
let songcheat = compiler.scc
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`)

// get notes for whole song
let notes = []
for (let unit of songcheat.structure) {
  for (let phrase of unit.part.phrases) {
    for (let bar of phrase.bars) {
      for (let note of bar.rhythm.compiledScore) {
        let chordedNote = JSON.parse(JSON.stringify(note))
        chordedNote.chord = bar.chords[note.placeholderIndex % bar.chords.length]
        if (!chordedNote.chord) throw new Error('No chord found for placeholder ' + (note.placeholderIndex + 1))
        notes.push(chordedNote)
      }
    }
  }
}

// play
let player = new Player(audioCtx, notes, {
  loop: false,
  capo: parseInt(songcheat.capo, 10),
  signature: songcheat.signature,
  type: songcheat.wave
})

// control player
$('#pause').on('click', function () {
  player.pause()
  $('#pause').hide()
  $('#play').show()
})

$('#play').show().on('click', function () {
  player.play()
  $('#pause').show()
  $('#play').hide()
})
