export class Utils {
  /**
  * String helper functions
  */

  static title (str) {
    return '\n' + this.spaces(str.length + 8, '*') + '\n*** ' + str + ' ***\n' + this.spaces(str.length + 8, '*') + '\n'
  }

  static firstUpper (s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  static camelCase (s, firstUpper) {
    var camel = s.toLowerCase().replace(/(?:[-_])(.)/g, function (match, group1) { return group1.toUpperCase() })
    return firstUpper ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel
  }

  static spaces (length, char) {
    if (isNaN(length) || !isFinite(length) || length < 0) throw new Error('Length must a positive finite number')
    var s = ''
    for (var i = 0; i < length; i++) s += char || ' '
    return s
  }

  /**
   * Interlace two multi line strings: one line of each file in alternance
   * If the second file contains more line then the first one, these additional lines will be ignored
   **/

  static interlace (text1, text2, sepLine, keepEmptyLines) {
    var a1 = text1.split(/\r?\n/)
    var a2 = text2.split(/\r?\n/)
    var a = a1.map(function (v, i) {
      let lines = keepEmptyLines || (a2[i] && a2[i].trim()) ? [v, a2[i]] : [v]
      if (typeof sepLine === 'string') lines.push(sepLine)
      return lines.join('\n')
    })
    return a.join('\n')
  }

  /**
   * Encode given parameters as a GET query string
   **/

  static encodeQueryData (data) {
    let ret = []
    for (let d in data) { ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d])) }
    return ret.join('&')
  }

  /**
   * Convert a duration code to the smallest unit (64th)
   **/

  static duration (code) {
    if (code === ':32') return 2
    if (code === ':16') return 4
    if (code === ':8') return 8
    if (code === ':q') return 16
    if (code === ':h') return 32
    if (code === ':w') return 64

    if (code === ':32d') return 3
    if (code === ':16d') return 6
    if (code === ':8d') return 12
    if (code === ':qd') return 24
    if (code === ':hd') return 48
    if (code === ':wd') return 96

    throw new Error('Invalid duration code "' + code + '"')
  }

  /**
   * Convert back a number of units (64th) into a duration code
   **/

  static durationcode (units) {
    for (let code of ['w', 'h', 'q', '8', '16', '32']) {
      if (this.duration(':' + code) === units) return ':' + code
      if (this.duration(':' + code + 'd') === units) return ':' + code + 'd'
    }

    throw new Error('Could not find a code with a value of ' + units + ' units')
  }

  /**
   * Convert a number of units (64th) into one or several duration codes
   **/

  static durationcodes (units) {
    var codes = []

    var current = units
    var rest = 0

    while (current > 0) {
      try {
        codes.push(this.durationcode(current))
        current = rest
        rest = 0
      } catch (e) {
        current--
        rest++
      }
    }

    if (rest > 0) throw new Error('Could not find codes adding to a value of ' + units + ' units')

    return codes
  }

  /**
   * Convert a fret number (up to 35) to a single char (digit or capital letter)
   * Fret 10 is notated as A, 11 as B, ... and 35 as Z
   */

  static fret2char (fret) {
    if (isNaN(fret) || fret < 0 || fret > 35) throw new Error('Cannot convert fret number ' + fret + ' to a single char (expected a value between 0 and 35)')
    return fret < 10 ? '' + fret : String.fromCharCode('A'.charCodeAt(0) + fret - 10)
  }

  /**
   * Convert a single char (digit or capital letter) to a fret number
   * A means fret 10, 11 fret B, ... and Z fret 35
   */

  static char2fret (char) {
    if (typeof char !== 'string') throw new Error('Invalid fret char ' + char + ' expected a string')
    if (!char.match(/^[0-9A-Z]$/)) throw new Error('Invalid fret char ' + char + ' (expected a value between [0-9] or [A-Z])')
    return char >= 'A' ? 10 + char.charCodeAt(0) - 'A'.charCodeAt(0) : parseInt(char, 10)
  }

  /**
   * Convert an absolute fret number (single char) to a relative fret number (0 never changes)
   */

  static abs2rel (char, startingFret) {
    let fret = this.char2fret(char)
    if (isNaN(fret) || fret < 0) throw new Error('Invalid fret number ' + fret + ' (expected a positive or 0 integer value)')
    if (fret === 0) return 0
    if (isNaN(startingFret) || startingFret < 0) throw new Error('Invalid starting fret number ' + startingFret + ' (expected a positive or 0 integer value)')
    if (startingFret + 8 < fret || startingFret > fret) throw new Error('Fret ' + fret + ' cannot be made relative to starting fret ' + startingFret + ' within the allowed range of 1 to 9')
    return fret + 1 - startingFret
  }

  /**
   * Convert a relative fret number to an absolute fret number (single char) (0 never changes)
   */

  static rel2abs (relFret, startingFret) {
    return this.fret2char(relFret ? relFret + startingFret - 1 : relFret)
  }

  /**
   * Take a chord and a placeholder contents
   * Return an array containing one object { string, fret, mute } for each played string
   */

  static chordStrings (chord, strings) {
    if (!chord.tablature) throw new Error('Tablature not defined for chord ' + chord.name)
    if (!chord.fingering) throw new Error('Fingering not defined for chord ' + chord.name)

    var result = []
    for (var i = 0; i < chord.tablature.length; i++) {
      // string will be between 6 and 1 since chord.tablature.length has been verified and is 6
      var string = 6 - i

      // string never played in this chord
      if (chord.tablature[i] === 'x') continue

      // first time we meet a played string, it's the bass so replace B and B' with the string number
      strings = strings.replace(/B'/g, (string >= 5 ? string - 1 : string))
      strings = strings.replace(/B/g, string)

      // check if this string should be played with the right hand
      // * means "all strings", otherwise concatenated specific string numbers are specified (or B for bass or B' for alternate bass)
      // x after string means muted (ghost) note
      if (strings.match(/^\*/) || strings.indexOf(string) !== -1) {
        let fret = this.char2fret(chord.tablature[i])
        let xIndex = strings.match(/^\*/) ? 1 : strings.indexOf(string) + 1
        let mute = strings[xIndex] === 'x'
        result.push({
          string: string,
          fret: fret,
          mute: mute
        })
      }
    }

    return result
  }
}
