import { VexTab as SongcheatVexTab } from '../src/vextab'
import { Compiler } from '../src/compiler'
import samples from 'songcheat-samples'

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery

// https://github.com/rollup/rollup/issues/1803/
// import { VexTab, Artist, Vex } from 'vextab'
let VexTab = window.VexTab
let Artist = window.Artist
let Vex = window.Vex

Artist.NOLOGO = true

// get a random sample songcheat and compile it
let sample = samples[Math.floor(Math.random() * samples.length)]
let compiler = new Compiler(sample, 0)
let songcheat = compiler.scc
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`)

// parse lyrics and show warnings if any
for (let unit of songcheat.structure) {
  let warnings = compiler.parseLyrics(unit)
  if (warnings.length > 0) $('body').append($('<p>').html('Parse warnings for unit ' + unit.name + ':\n - ' + warnings.join('\n- ')).css('color', 'red'))
}

// parse and render rhythms with vextab
for (let rhythm of songcheat.rhythms) {
  let $divRhythm = $('<div>')
  $('canvas').before($divRhythm)

  try {
    console.info('Converting rhythm to vextab score...')
    let score = 'options tempo=' + songcheat.signature.tempo + ' player=false tab-stems=false tab-stem-direction=up\n'
    score += SongcheatVexTab.Notes2Stave(songcheat, 0, rhythm.compiledScore, true, 'top', 'Rhythm ' + (rhythm.name || rhythm.id), 1, true, false) + ' options space=20'
    console.info('Parsing score...')
    let artist = new Artist(10, 10, 600, { scale: 1.0 })
    let vextab = new VexTab(artist)
    vextab.parse(score)
    console.info('Rendering score...')
    artist.render(new Vex.Flow.Renderer($divRhythm[0], Vex.Flow.Renderer.Backends.SVG))
    console.info('Score done!')
  } catch (e) {
    $divRhythm.html(e.message).css('color', 'red')
    console.error(e)
  }
}

// parse and render full song score with vextab
try {
  console.info('Converting songcheat to vextab score...')
  let score = SongcheatVexTab.Songcheat2VexTab(songcheat)
  console.info('Parsing score...')
  let artist = new Artist(10, 10, 1200, {scale: 1.0})
  let vextab = new VexTab(artist)
  vextab.parse(score)
  console.info('Rendering score...')
  artist.render(new Vex.Flow.Renderer($('canvas')[0], Vex.Flow.Renderer.Backends.CANVAS))
  console.info('Score done!')
} catch (e) {
  $('body').append($('<p>').html(e.message).css('color', 'red'))
  console.error(e)
}
