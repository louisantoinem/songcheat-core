import { Pitch } from './pitch'

let PRESETS = {
  'standard': 'E2,A2,D3,G3,B3,E4',
  'dropd': 'D2,A2,D3,G3,B3,E4',
  'guitalele': 'A2,D3,G3,C4,E4,A4',
  'eb': 'Eb2,Ab2,Db3,Gb3,Bb3,Eb4'
}

export class Tuning {
  constructor (str_) {
    let str = str_
    let transpose = 0

    // Detect +n at the end (transpose +)
    let parts = str.split('+')
    if (parts.length === 2) {
      str = parts[0]
      transpose = parseInt(parts[1])
    }

    // Detect -n at the end (transpose -)
    parts = str.split('-')
    if (parts.length === 2) {
      str = parts[0]
      transpose = -1 * parseInt(parts[1])
    }

    // Preset name was used
    if (PRESETS[str]) return this.make_(str_, PRESETS[str], transpose)

    return this.make_(null, str, transpose)
  }

  make_ (name, pitches, transpose) {
    this.name = name
    this.pitches = []

    // Parse tuning: comma-searated pitches for each string (6 to 1)
    pitches = pitches.split(',')
    if (pitches.length !== 6) throw new Error('Invalid tuning "' + pitches + '"')
    for (let pitch of pitches) this.pitches.push(new Pitch(pitch.trim()).transpose(transpose))
  }

  //
  // Read-only API
  //

  // Returns Pitch for given string
  pitch (string) {
    return this.pitches[6 - string]
  }

  // If other is also a Tuning, return true iff same pitch for all strings.
  equals (other) {
    return other && other instanceof Tuning && this.toString() === other.toString()
  }

  // Return string representation
  toString () {
    let pitches = this.pitches.map(pitch => pitch.toString()).join(',')
    return this.name ? this.name + (this.name === 'standard' ? '' : ' (' + pitches + ')') : pitches
  }

  // Return vextab representation
  vextab () {
    return this.pitches.map(pitch => pitch.vextab()).reverse().join(',')
  }

  //
  // Immutable API. These methods return a new Tuning object
  //

  // Add given number of half tones.
  transpose (halfTones) {
    let tuning = new Tuning('standard')

    // Transpose each string
    tuning.pitches = []
    for (let pitch of this.pitches) tuning.pitches.push(pitch.transpose(halfTones))

    return tuning
  }
}
