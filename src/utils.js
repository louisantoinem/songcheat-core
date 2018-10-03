export class Utils {
  // Benchmark: run function `f` once and report time elapsed shifted by `offset` milliseconds
  static BM (what, f, offset, warnThr) {
    console.log(what + ' ... ')
    let startTime = new Date().getTime()
    let ret = f()
    let elapsed = new Date().getTime() - startTime
    f = elapsed >= (typeof warnThr === 'undefined' ? 25 : warnThr) ? console.warn : console.log
    f(what + ' took ' + ((offset || 0) + elapsed) + 'ms')
    return ret
  }

  /**
   * Float helper functions
   */

  static almostEqual (actual, expected, epsilon = 1e-2) {
    return Math.abs(actual - expected) < epsilon
  }

  static almostZero (actual, epsilon = 1e-2) {
    return Utils.almostEqual(actual, 0, epsilon)
  }

  static round (actual, decimals) {
    return Math.round(actual * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  /**
   * Array helper functions
   */

  static arraysEqual (a, b) {
    if (a === b) return true
    if (a === null || b === null) return false
    if (a.length !== b.length) return false
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  /**
   * Shuffles array in place. ES6 version
   * @param {Array} a items An array containing the items.
   */
  static shuffle (a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /**
   * Math helper functions
   */

  static prevPowerOf2 (x) {
    return Math.pow(2, Math.floor(Math.log(x) / Math.log(2)))
  }
  static nextPowerOf2 (x) {
    return Math.pow(2, Math.ceil(Math.log(x) / Math.log(2)))
  }
  static closestPowerOf2 (x) {
    return Math.pow(2, Math.round(Math.log(x) / Math.log(2)))
  }

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

  static preview (s, length) {
    s = s.replace(/\n/g, '\\')
    if (s.length > length) return s.substr(0, length - 3) + '...'
    return s
  }

  static spaces (length, char) {
    if (isNaN(length) || !isFinite(length) || length < 0) throw new Error('Length must a positive finite number')
    var s = ''
    for (var i = 0; i < length; i++) s += char || ' '
    return s
  }

  static padOn (obj, length, char) {
    let str = `${obj}`
    return str + Utils.spaces(Math.max(0, length - str.length), char)
  }

  static replaceComposedChars (s) {
    // fix composed UTF8 characters (not handled correctly by ACE when typing a newline after one of those)
    // http://php.net/manual/fr/regexp.reference.unicode.php
    // http://www.fileformat.info/info/unicode/category/Mn/list.htm

    // grave
    s = s.replace(/a\u0300/g, 'à')
    s = s.replace(/e\u0300/g, 'è')
    s = s.replace(/u\u0300/g, 'ù')

    // acute
    s = s.replace(/e\u0301/g, 'é')

    // circumflex
    s = s.replace(/e\u0302/g, 'ê')
    s = s.replace(/i\u0302/g, 'î')
    s = s.replace(/o\u0302/g, 'ô')
    s = s.replace(/u\u0302/g, 'û')
    s = s.replace(/a\u0302/g, 'â')

    // tilde
    s = s.replace(/o\u0303/g, 'õ')
    s = s.replace(/a\u0303/g, 'ã')

    return s
  }

  static wordWrap (str, maxWidth) {
    let newLineStr = '\n'
    let res = ''
    // use spread operator to correctly count astral unicode symbols
    while ([...str].length > maxWidth) {
      let found = false
      // Inserts new line at first whitespace of the line
      for (let i = maxWidth - 1; i >= 0; i--) {
        if (str.charAt(i).match(/^\s$/)) {
          res = res + [str.slice(0, i), newLineStr].join('')
          str = str.slice(i + 1)
          found = true
          break
        }
      }
      // Inserts new line at maxWidth position, the word is too long to wrap
      if (!found) {
        res += [str.slice(0, maxWidth), newLineStr].join('')
        str = str.slice(maxWidth)
      }
    }

    return res + str
  }

  /**
   * Interlace two multi line strings: one line of each file in alternance
   * If the second file contains more line then the first one, these additional lines will be ignored
   **/

  static interlace (text1, text2, sepLine, keepEmptyLines, wrapper1, wrapper2) {
    wrapper1 = wrapper1 || (s => { return s })
    wrapper2 = wrapper2 || (s => { return s })
    var a1 = text1.split(/\r?\n/)
    var a2 = text2.split(/\r?\n/)
    var a = a1.map(function (v, i) {
      let lines = keepEmptyLines || (a2[i] && a2[i].trim()) ? [wrapper1(v), wrapper2(a2[i])] : [wrapper1(v)]
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
}
