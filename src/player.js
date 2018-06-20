import { Utils } from './utils'
import { Duration } from './duration'
import { Score } from './score'
import waveTables from '@mohayonao/wave-tables'

export class Player {
  constructor (audioCtx, score, config) {
    if (!(score instanceof Score)) throw new Error(`new Player: score must be of type Score (got ${typeof score})`)

    this.MODE_RHYTHM = 1 // play beeps only
    this.MODE_BASS = 2 // when there is a strummed chord, play only bass (no effect onindividual strings)
    this.MODE_CHORDS = 3 // play actual strummed chords

    config = config || {}
    config.signature = config.signature || {}

    // audio context
    this.audioCtx = audioCtx

    // time signature
    this.time = score.time

    // config: loop or not and callback at end if no loop
    this.loop = config.loop || false
    this.onDone = config.onDone || null
    this.onNote = config.onNote || function () {}
    this.onCountdown = config.onCountdown || function () {}

    // config: capo, tempo, shuffle
    this.capo = config.capo || 0
    this.tempo = config.signature.tempo || 100
    this.shuffle = Duration.valid(config.signature.shuffle) ? new Duration(config.signature.shuffle) : null

    // tuning, defaults to standard tuning
    this.tuning = config.tuning || [329.63, // E4
      246.94, // B3
      196.00, // G3
      146.83, // D3
      110.00, // A2
      82.41
    ] // E2

    // play control
    this.stopped = true
    this.paused = false

    // initialize to defaults
    this.speed(100)
    this.setDisto(0)
    this.setVolume(50)
    this.setMode(this.MODE_CHORDS)
    this.setType(config.type || 'GuitarFuzz')

    // add an offset property in each note, used to detect bars and beats but also for shuffling notes
    this.notes = []
    this.length = score.length
    let offset = score.start()
    for (let note of score.notes) {
      let _note = note._copy()
      _note.offset = offset
      offset = offset.add(note.duration)
      this.notes.push(_note)
    }
  }

  makeDistortionCurve (amount) {
    let k = typeof amount === 'number' ? amount : 50
    let nSamples = 44100
    let curve = new Float32Array(nSamples)
    let deg = Math.PI / 180
    for (let i = 0; i < nSamples; ++i) {
      let x = i * 2 / nSamples - 1
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x))
    }
    return curve
  }

  /**
   * duration of the tone in milliseconds
   * frequency of the tone in hertz
   * volume of the tone between 0 and 1
   * type of tone. Possible values are sine, square, sawtooth, triangle, and custom.
   * callback to use on end of tone
   */
  sound (time, duration, frequency, volume, distortion, type, onended) {
    let audioCtx = this.audioCtx
    let gainNode = audioCtx.createGain()
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime)

    if (distortion) {
      let distoNode = audioCtx.createWaveShaper()
      distoNode.curve = this.makeDistortionCurve(parseInt(distortion, 10))
      distoNode.oversample = '4x'
      distoNode.connect(audioCtx.destination)
      gainNode.connect(distoNode)
    } else gainNode.connect(audioCtx.destination)

    let oscillator = audioCtx.createOscillator()
    oscillator.connect(gainNode)

    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime)
    oscillator.onended = onended

    // type can be a periodic wave or a standard oscillator type
    if (waveTables[type]) oscillator.setPeriodicWave(audioCtx.createPeriodicWave(new Float32Array(waveTables[type].real), new Float32Array(waveTables[type].imag)))
    else oscillator.type = type

    oscillator.start(time)
    oscillator.stop(time + duration)
  }

  chord2frequencies (note, transpose) {
    let freqs = []
    let mutes = []
    for (let o of note.playedStrings()) {
      freqs.push(this.tuning[o.string - 1] * Math.pow(Math.pow(2, 1 / 12), transpose + o.fret))
      mutes.push(o.mute)
    }
    return { chordFreqs: freqs, chordMutes: mutes }
  }

  ms_ (note) {
    // base duration of note
    let ms_ = note.duration.units * this.msPerUnit

    let SHUFFLE = 33.33333333

    // change duration proportions for shuffled notes
    if (this.shuffle && note.duration.equals(this.shuffle)) {
      if (note.offset.multipleOf(this.shuffle.times(2))) ms_ *= (100.0 - SHUFFLE) / 50.0
      else ms_ *= SHUFFLE / 50.0
    }

    return ms_
  }

  note_ (time) {
    let audioCtx = this.audioCtx
    var self = this

    // stop or pause requested
    if (this.stopped || this.paused) {
      if (this.onDone) this.onDone()
      this.donePlaying = true
      return true
    }

    // get note to play
    if (!this.notes) return false
    let note = this.notes[this.noteIndex]
    let nextPlayedNote = this.notes[this.noteIndex + 1]
    if (!note) return false

    // some shortcut vars based on note properties
    let isBar = note.offset.bar()
    let isBeat = note.offset.beat()
    let isUp = note.flags.stroke === 'u' || note.flags.stroke === 'uu'
    let isDown = note.flags.stroke === 'd' || note.flags.stroke === 'dd'
    let isArpeggiated = note.flags.stroke && note.flags.stroke.length === 2
    let palmMuted = note.flags.pm

    // set next note to play
    this.noteIndex = (this.noteIndex + 1) % this.notes.length

    // jump to next note if skipped tied note
    if (note.skip) {
      // info message, scheduled to display at the given time
      let what = 'SKIP ' + (note.chord ? note.chord.name + (isDown ? ' D' : '') + (isUp ? ' U' : '') : 'BEEP')
      let message = (isBar ? '\n|\t' : '\t') + ('[' + what + ']').padEnd(15, ' ') + note.offset + ' ' + note.duration + (note.tied ? ' [TIED:' + note.tied + ']' : '') + (isBar ? ' [BAR]' : (isBeat ? ' [BEAT]' : '')) + (note.flags.accent ? ' [ACCENT]' : '')
      setTimeout(function () { console.info(message) }, Math.max(0, time - audioCtx.currentTime) * 1000)

      self.note_(time)
      return
    }

    // get number of ms that this note should last
    let ms = this.ms_(note)

    // consume next ties note(s) as long as they are the same
    let { chordFreqs, chordMutes } = note.chord && note.strings ? this.chord2frequencies(note, this.capo) : null
    let noteFreqs = chordFreqs
    let noteMutes = chordMutes
    for (let nextNoteIndex = this.noteIndex; nextNoteIndex < this.notes.length; nextNoteIndex++) {
      let nextNote = this.notes[nextNoteIndex]
      if (!nextNote.tied) break

      // get frequencies for chord notes
      let { chordFreqs, chordMutes } = nextNote.chord && nextNote.strings ? this.chord2frequencies(nextNote, this.capo) : null
      if (!Utils.arraysEqual(noteFreqs, chordFreqs)) break
      if (!Utils.arraysEqual(noteMutes, chordMutes)) break

      // if no chord (i.e. we are playing a pure rhythm), consider note is the same only if type T (i.e. not for types sbhpt)
      if (!nextNote.chord && nextNote.tied && nextNote.tied !== 'T') break

      nextNote.skip = true
      nextPlayedNote = this.notes[nextNoteIndex + 1]
      ms += this.ms_(nextNote)
    }

    // note chord ignored in rhythm mode
    if (this.mode === this.MODE_RHYTHM) note = note.setChord(null)

    // note strings forced to 'B' in bass mode
    if (this.mode === this.MODE_BASS) note = note.setStrings('B')

    // beep or chord volume
    let volume = 0.25 * (this.volume / 100.0) // base gain from 0 to 1.5 according to user volume slider
    if (note.flags.accent) volume *= 1.5 // increase gain by 50% if accent
    if (note.rest) volume = 0 // silence if rest

    // beep frequency
    let freqs = [440 * 1.5]
    let mutes = [true]
    if (isBar) freqs[0] *= 2 // octave
    else if (isBeat) freqs[0] *= 1.5 // quinte

    // beep duration is 5 ms
    // actual notes are played for the whole duration if next played (i.e. not skipped) note is tied otherwise for 90%
    let beepduration = Math.min(ms, 5)
    let noteduration = nextPlayedNote && nextPlayedNote.tied ? ms : ms * 0.90

    // for rhythm type is always square and no distortion, for actual notes use the user-defined settings
    let type = note.chord ? this.type : 'square'
    let distortion = note.chord ? this.distortion : null

    // played chord
    if (note.chord) {
      // get frequencies for chord notes
      let { chordFreqs, chordMutes } = this.chord2frequencies(note, this.capo)
      freqs = chordFreqs
      mutes = chordMutes

      // reverse string order if up stroke
      if (isUp) freqs = freqs.reverse()

      // adjust volume according to number of simultaneous notes
      // volume = volume / (2.0 * Math.sqrt(freqs.length));
      // UPDATE: no, bass among chords is otherwise louder than it should
      // UPDATE: instead increase volume only if BASS ONLY mode
      if (this.mode === this.MODE_BASS) volume *= 2
    }

    // info message, scheduled to display at the same time as oscillator will play our sound
    let what = note.rest ? 'REST' : (note.chord ? note.chord.name + '/' + freqs.length + (isDown ? ' D' : '') + (isUp ? ' U' : '') : 'BEEP')
    let message = (isBar ? '\n|\t' : '\t') + ('[' + what + ']').padEnd(15, ' ') + note.offset + ' ' + note.duration + ' ' + ms.toFixed(0) + ' ms [VOL ' + (volume * 100) + ']' + (note.tied ? ' [TIED:' + note.tied + ']' : '') + (isBar ? ' [BAR]' : (isBeat ? ' [BEAT]' : '')) + (note.flags.accent ? ' [ACCENT]' : '')
    setTimeout(() => {
      this.onNote(note, isBar, isBeat, isUp, isDown, isArpeggiated)
      console.info(message)
    }, Math.max(0, time - audioCtx.currentTime) * 1000)

    // play beep (1 note) or chord (N notes)
    let fIndex = 0
    let delay = 0
    for (let frequency of freqs) {
      let soundduration = mutes[fIndex] || palmMuted ? beepduration : noteduration - delay

      // handle next node when last note has done playing
      this.sound(time + delay / 1000.0, soundduration / 1000.0, frequency, mutes[fIndex] ? volume * 2 : volume, distortion, type, fIndex < freqs.length - 1 ? null : function () {
        // back on first note: stop and callback if not loop
        if (self.noteIndex === 0 && !self.loop) {
          self.stop()
          if (self.onDone) self.onDone()
        } else self.note_(time + ms / 1000.0)
      })

      // simulate the fact that strings hit first will sound first (but they'll all stop at the same time, hence substrating delay from noteduration above)
      // when a chord is arpeggiated, take 3/4 of available duration to hit strings the one after the other
      delay += (isArpeggiated ? (noteduration * 0.75) / freqs.length : (note.tied ? 0 : 10))

      // simulate the fact that first hit strings will sound louder
      volume *= 0.95

      fIndex++
    }
  }

  stop () {
    console.log('Player stopped at ' + new Date())
    this.stopped = true
    this.paused = false
    if (this.cd) {
      clearTimeout(this.cd)
      this.onCountdown()
    }
  }

  pause () {
    this.stopped = false
    this.paused = true
    if (this.cd) {
      clearTimeout(this.cd)
      this.onCountdown()
    }
  }

  play (countdown) {
    let audioCtx = this.audioCtx
    let self = this

    if (!this.paused) this.noteIndex = 0
    this.stopped = false
    this.paused = false

    this.onCountdown(countdown)
    if (countdown) this.cd = setTimeout(function () { self.play(countdown - 1) }, 1000)
    else {
      console.log('Player started or resumed at ' + new Date())
      this.note_(audioCtx.currentTime)
    }
  }

  rewind () {
    if (this.stopped) return

    if (this.paused) {
      this.noteIndex = 0
      return
    }

    let self = this
    this.donePlaying = false
    this.stop()
    let recfun = function () {
      if (self.donePlaying) self.play()
      else setTimeout(recfun, 100)
    }
    recfun()
  }

  minutes () {
    return Math.floor(((this.length.beats() * this.time.beat.units * this.msPerUnit) / 1000.0) / 60)
  }

  seconds () {
    return Math.round(((this.length.beats() * this.time.beat.units * this.msPerUnit) / 1000.0) % 60)
  }

  getTempo () {
    return (this.tempo * this.speedpct / 100.0).toFixed(0)
  }

  speed (pct) {
    if (pct < 0) throw new Error('Invalid tempo percentage: ' + pct)

    this.speedpct = pct

    // compute ms per duration unit based on given tempo and beat duration
    let msPerBeat = 60000 / (this.tempo * this.speedpct / 100.0) // ms/beat = ms/minute : beats/minute
    this.msPerUnit = msPerBeat / this.time.beat.units // ms/unit = ms/beat : units/beat
    console.info('Player gone to ' + msPerBeat + ' ms / beat')
  }

  speedup (step) {
    this.speed(Math.min(500, this.speedpct + step))
  }

  slowdown (step) {
    this.speed(Math.max(20, this.speedpct - step))
  }

  setMode (mode) {
    this.mode = parseInt(mode, 10)
    console.info('Player gone to mode ' + mode)
  }

  setType (type) {
    this.type = type
    console.info('Player gone to type ' + type)
  }

  setDisto (d) {
    this.distortion = parseInt(d, 10)
    console.info('Player gone to disto ' + d)
  }

  setVolume (v) {
    this.volume = parseInt(v, 10)
    console.info('Player gone to volume ' + v)
  }
}
