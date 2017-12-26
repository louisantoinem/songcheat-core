import { Utils } from './utils'
import waveTables from '@mohayonao/wave-tables'

export class Player {
  constructor (audioCtx, notes, config) {
    this.MODE_RHYTHM = 1 // play beeps only
    this.MODE_BASS = 2 // when there is a strummed chord, play only bass (no effect onindividual strings)
    this.MODE_CHORDS = 3 // play actual strummed chords

    config = config || {}
    config.signature = config.signature || {}
    config.signature.time = config.signature.time || {}

    // audio context
    this.audioCtx = audioCtx

    // notes to beep
    this.notes = notes

    // config: loop or not and callback at end if no loop
    this.loop = config.loop || false
    this.onDone = config.onDone || null
    this.onCountdown = config.onCountdown || function () {}

    // config: capo and signature (tempo, time, shuffle)
    this.capo = config.capo || 0
    this.tempo = config.signature.tempo || 100
    this.beatsPerBar = config.signature.time.beatsPerBar || 4
    this.beatDuration = config.signature.time.beatDuration || ':q'
    this.shuffle = config.signature.shuffle ? Utils.duration(config.signature.shuffle) : false

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
    this.setType(config.type || 'Piano')
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
    gainNode.gain.value = volume

    if (distortion) {
      let distoNode = audioCtx.createWaveShaper()
      distoNode.curve = this.makeDistortionCurve(parseInt(distortion, 10))
      distoNode.oversample = '4x'
      distoNode.connect(audioCtx.destination)
      gainNode.connect(distoNode)
    } else gainNode.connect(audioCtx.destination)

    let oscillator = audioCtx.createOscillator()
    oscillator.connect(gainNode)

    oscillator.frequency.value = frequency
    oscillator.onended = onended

    // type can be a periodic wave or a standard oscillator type
    if (waveTables[type]) oscillator.setPeriodicWave(audioCtx.createPeriodicWave(waveTables[type].real, waveTables[type].imag))
    else oscillator.type = type

    oscillator.start(time)
    oscillator.stop(time + duration)
  }

  chord2frequencies (chord, strings, transpose) {
    let freqs = []
    for (let o of Utils.chordStrings(chord, strings)) {
      if (!o.mute) freqs.push(this.tuning[o.string - 1] * Math.pow(Math.pow(2, 1 / 12), transpose + o.fret))
    }
    return freqs
  }

  ms_ (note) {
    // base duration of note
    let ms_ = note.duration * this.msPerUnit

    // change duration proportions for shuffled notes
    if (this.shuffle && note.duration === this.shuffle) {
      if (note.offset % (2 * this.shuffle) === 0) ms_ *= 1.3333
      else ms_ *= 0.6667
    }

    return ms_
  }

  note_ (time) {
    let audioCtx = this.audioCtx
    var self = this

    // stop or pause requested
    if (this.stopped || this.paused) {
      this.donePlaying = true
      return true
    }

    // get note to play
    if (!this.notes) return false
    let note = this.notes[this.noteIndex]
    if (!note) return false

    let isBar = note.offset === 0
    let isBeat = note.offset % Utils.duration(this.beatDuration) === 0
    let isUp = note.flags.stroke === 'u' || note.flags.stroke === 'uu'
    let isDown = note.flags.stroke === 'd' || note.flags.stroke === 'dd'
    let isArpeggiated = note.flags.stroke && note.flags.stroke.length === 2

    // get number of ms that this note should last
    let ms = note.tied ? 0 : this.ms_(note)

    // consume next ties note(s) if any
    for (let nextNoteIndex = this.noteIndex + 1; nextNoteIndex < this.notes.length && this.notes[nextNoteIndex].tied; nextNoteIndex++) ms += this.ms_(this.notes[nextNoteIndex])

    // beep or chord volume
    let volume = 0.25 * (this.volume / 100.0) // base gain from 0 to 1.5 according to user volume slider
    if (note.flags.accent) volume *= 1.5 // increase gain by 50% if accent
    if (note.rest) volume = 0 // silence if rest

    // beep frequency
    let freqs = [440 * 1.5]
    if (isBar) freqs[0] *= 2 // octave
    else if (isBeat) freqs[0] *= 1.5 // quinte

    // get note chord, ignored in rhythm mode
    let chord = this.mode === this.MODE_RHYTHM ? null : note.chord

    // beep duration is 5 ms
    // actual notes are played for the whole duration if tied otherwise for 90%
    let beepduration = chord ? (note.tied ? ms : ms * 0.90) : Math.min(ms, 5)

    // for rhythm type is always square and no distortion, for actual notes use the user-defined settings
    let type = chord ? this.type : 'square'
    let distortion = chord ? this.distortion : null

    // played chord (for a rest, chord is set but strings is not)
    if (chord && note.strings) {
      // get frequencies for chord notes
      freqs = this.chord2frequencies(chord, this.mode === this.MODE_BASS ? note.strings.replace(/\*/g, 'B') : note.strings, this.capo)

      // reverse string order if up stroke
      if (isUp) freqs = freqs.reverse()

      // adjust volume according to number of simultaneous notes
      // volume = volume / (2.0 * Math.sqrt(freqs.length));
      // UPDATE: no, bass among chords is otherwise louder than it should
      // UPDATE: instead increase volume only if BASS ONLY mode
      if (this.mode === this.MODE_BASS) volume *= 3
    }

    // set next note to play
    this.noteIndex = (this.noteIndex + 1) % this.notes.length

    // info message, scheduled to display at the same time as oscillator will play our sound
    let what = note.rest ? 'REST' : (note.tied ? 'TIED' : (chord ? chord.name + '/' + freqs.length + ' ' + (isDown ? 'B' : '') + (isUp ? 'H' : '') : 'BEEP'))
    let message = (isBar ? '\n|\t' : '\t') + ('[' + what + ']').padEnd(10, ' ') + (note.offset + Utils.durationcode(note.duration)).padEnd(5, ' ') + ' ' + ms.toFixed(0) + ' ms [VOL ' + (volume * 100) + '] ' + (isBar ? ' [BAR]' : (isBeat ? ' [BEAT]' : '')) + (note.flags.accent ? ' [ACCENT]' : '')
    setTimeout(function () { console.info(message) }, Math.max(0, time - audioCtx.currentTime) * 1000)

    // jump to next note if tied
    if (note.tied) {
      self.note_(time)
      return
    }

    // play beep (1 note) or chord (N notes)
    let fIndex = 0
    let delay = 0
    for (let frequency of freqs) {
      // handle next node when last note has done playing
      this.sound(time + delay / 1000.0, (beepduration - delay) / 1000.0, frequency, volume, distortion, type, fIndex < freqs.length - 1 ? null : function () {
        // back on first note: stop and callback if not loop
        if (self.noteIndex === 0 && !self.loop) {
          self.stop()
          if (self.onDone) self.onDone()
        } else self.note_(time + ms / 1000.0)
      })

      // simulate the fact that strings hit first will sound first (but they'll all stop at the same time, hence substrating delay from beepduration above)
      // when a chord is arpeggiated, take 3/4 of available duration to hit strings the one after the other
      delay += (isArpeggiated ? (beepduration * 0.75) / freqs.length : (note.tied ? 0 : 10))

      // simulate the fact that first hit strings will sound louder
      volume *= 0.95

      fIndex++
    }
  }

  stop () {
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
      // compute for each note the offset wrt the bar it's contained in
      let offset = 0
      for (let note of this.notes) {
        note.offset = offset
        offset = (offset + note.duration) % (this.beatsPerBar * Utils.duration(this.beatDuration))
      }

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

  getTempo () {
    return (this.tempo * this.speedpct / 100.0).toFixed(0)
  }

  speed (pct) {
    if (pct < 0) throw new Error('Invalid tempo percentage: ' + pct)

    this.speedpct = pct

    // compute ms per duration unit based on given tempo and beat duration
    let msPerBeat = 60000 / (this.tempo * this.speedpct / 100.0) // ms/beat = ms/minute : beats/minute
    this.msPerUnit = msPerBeat / Utils.duration(this.beatDuration) // ms/unit = ms/beat : units/beat
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
