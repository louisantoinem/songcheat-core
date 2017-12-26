import { ChordPix } from '../src/chordpix'
import samples from 'songcheat-samples'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// get a random sample songcheat
let songcheat = samples[Math.floor(Math.random() * samples.length)]
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`)

// display chord diagrams
for (let chord of songcheat.chords) {
  var url = ChordPix.url(chord, 200)
  console.info(url)
  $('body>div').append(
    $('<div>')
      .css({ 'display': 'inline-block', 'vertical-align': 'top' })
      .append($('<img>').attr('src', url))
  )
}
