import { Utils } from './utils'

export class ParserException {
  constructor (line, message) {
    this.message = message
    this.line = line
  }

  toString () {
    return 'Parser error at line ' + this.line + ': ' + this.message
  }
}

class Parser_ {
  constructor () {
    this.songcheat = {}
  }

  parse (text) {
    // reset
    this.songcheat = {}

    // split text into tokens
    let tokens = this.tokenize(text)
    if (tokens.length === 0) return this.songcheat

    let tokenIndex = 0
    while (tokenIndex < tokens.length) {
      let token = tokens[tokenIndex]
      let keyword = this.isKeyword(token)

      // we must be on a keyword, otherwise it means that first token in text is not a keyword as expected
      if (!keyword) throw new ParserException(token.line, 'expected keyword, found "' + token.value + '"')

      // get all tokens until next keyword or end
      let params = []
      for (++tokenIndex; tokenIndex < tokens.length; ++tokenIndex) {
        if (this.isKeyword(tokens[tokenIndex])) break
        params.push(tokens[tokenIndex])
      }

      // use specific handler if any or default one
      let handler = this['handle' + Utils.firstUpper(keyword)] || this.handleDefault
      if (typeof handler === 'function') handler.call(this, token.line, keyword, params)
      else throw new ParserException(token.line, 'non function handler found for keyword ' + keyword)
    }

    return this.songcheat
  }

  getPrecedingKeyword (text, line) {
    // reset
    this.songcheat = {}

    let lastResult = null

    // split text into tokens
    let tokens = this.tokenize(text)
    if (tokens.length === 0) return true

    let tokenIndex = 0
    while (tokenIndex < tokens.length) {
      let token = tokens[tokenIndex]
      let keyword = this.isKeyword(token)

      if (token.line > line) return lastResult

      // we must be on a keyword, otherwise it means that first token in text is not a keyword as expected
      if (!keyword) throw new ParserException(token.line, 'expected keyword, found "' + token.value + '"')

      // get all tokens until next keyword or end
      let params = []
      for (++tokenIndex; tokenIndex < tokens.length; ++tokenIndex) {
        if (this.isKeyword(tokens[tokenIndex])) break
        params.push(tokens[tokenIndex])
      }

      // use specific handler if any or default one
      let handler = this['handle' + Utils.firstUpper(keyword)] || this.handleDefault
      if (typeof handler === 'function') handler.call(this, token.line, keyword, params)
      else throw new ParserException(token.line, 'non function handler found for keyword ' + keyword)

      lastResult = { line: token.line, keyword: keyword, params: params, chordIndex: null, rhythmIndex: null, partIndex: null, unitIndex: null }

      if (keyword === 'chord') lastResult.chordIndex = this.songcheat.chords.length - 1
      else if (keyword === 'rhythm') lastResult.rhythmIndex = this.songcheat.rhythms.length - 1
      else if (keyword === 'part' || keyword === 'sub') lastResult.partIndex = this.songcheat.parts.length - 1
      else if (keyword === 'structure') {
        // special case since there is no distinct UNIT keyword for each unit, but a single STRUCTURE keyword for all units
        let paramIndex = 0
        for (let param of params) {
          if (param.line > line) break
          lastResult.unitIndex = Math.floor(paramIndex / 2)
          paramIndex++
        }
      }
    }

    return lastResult
  }

  isKeyword (token) {
    let keyword = Utils.camelCase(token.value)
    return ['artist', 'title', 'year', 'difficulty', 'video', 'tutorial', 'source', 'comment', 'tuning', 'capo', 'key', 'time', 'tempo', 'shuffle', 'chord', 'rhythm', 'sub', 'part', 'lyricsUnit' /* will disappear soon */, 'structure'].indexOf(keyword) >= 0 ? keyword : false
  }

  tokenize (text) {
    let tokens = []

    // https://stackoverflow.com/questions/4780728/regex-split-string-preserving-quotes?noredirect=1&lq=1
    let reSpaces = /(?<=^[^"]*(?:"[^"]*"[^"]*)*)[\s\t]+(?=(?:[^"]*"[^"]*")*[^"]*$)/
    let reNewline = /(?<=^[^"]*(?:"[^"]*"[^"]*)*)(\r?\n)(?=(?:[^"]*"[^"]*")*[^"]*$)/

    let lineNumber = 1

    // split at newlines unless enclosed in quotes
    for (let line of text.split(reNewline)) {
      // split also returns the newlines, ignore them
      if (line.match(/^\r?\n$/)) continue

      // trim line
      line = line.trim()

      // console.log("L" + lineNumber + ": ["+ line + "]");

      // if not a comment or empty line
      if (line && !line.match(/^#/)) {
        // split at spaces and tabs unless enclosed in quotes, then trim spaces and quotes
        let values = line.split(reSpaces).map(s => s.trim().replace(/^"|"$/g, ''))

        for (let vIndex = 0; vIndex < values.length; vIndex++) {
          let value = values[vIndex]

          // if token starts with a [ and does not end on ], concatenate next tokens until ] found
          if (value.match(/^\[/)) { while (vIndex < values.length - 1 && !value.match(/\]$/)) value += ' ' + values[++vIndex] }

          tokens.push({ 'value': value, 'line': lineNumber })
        }
      }

      // increment line number
      lineNumber += (1 + (line.match(/(?:\r?\n)/g) || []).length)
    }

    return tokens
  }

  handleDefault (line, keyword, params) {
    if (params.length !== 1) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 1 value, but found ' + params.length)
    this.songcheat[keyword] = ['year', 'capo', 'difficulty'].indexOf(keyword) >= 0 ? parseInt(params[0].value, 10) : params[0].value
  }

  handleSignature (line, keyword, params) {
    if (params.length !== 1) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 1 value, but found ' + params.length)
    this.songcheat['signature'] = this.songcheat['signature'] || {}
    this.songcheat['signature'][keyword] = keyword === 'tempo' ? parseFloat(params[0].value, 10) : params[0].value
  }

  handleKey (line, keyword, params) { return this.handleSignature(line, keyword, params) }
  handleTempo (line, keyword, params) { return this.handleSignature(line, keyword, params) }
  handleShuffle (line, keyword, params) { return this.handleSignature(line, keyword, params) }

  handleTime (line, keyword, params) {
    if (params.length !== 3) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 3 values, but found ' + params.length)
    this.songcheat['signature'] = this.songcheat['signature'] || []
    this.songcheat['signature']['time'] = { 'beatsPerBar': params[1].value, 'beatDuration': params[2].value, 'symbol': params[0].value }
  }

  handleChord (line, keyword, params) {
    if (params.length < 2 || params.length > 4) throw new ParserException(line, keyword.toUpperCase() + ' expected between 2 and 4 values (name, tablature[, fingering="000000/-", comment=""]), but found ' + params.length)

    let name = params[0].value
    let tablature = params[1].value
    let fingering = params.length >= 3 ? params[2].value : '000000/-'
    let comment = params.length >= 4 ? params[3].value : ''

    this.songcheat['chords'] = this.songcheat['chords'] || []
    let chord = { 'id': this.songcheat['chords'].length + 1, 'name': name, 'tablature': tablature, 'fingering': fingering, 'comment': comment }
    this.songcheat['chords'].push(chord)

    // return created chord (used when meeting an inline chord)
    return chord
  }

  handleRhythm (line, keyword, params) {
    if (params.length !== 2) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 2 values (id and score), but found ' + params.length)

    this.songcheat['rhythms'] = this.songcheat['rhythms'] || []
    let rhythm = { 'id': this.songcheat['rhythms'].length + 1, 'name': params[0].value, 'score': params[1].value }
    this.songcheat['rhythms'].push(rhythm)

    // return created rhythm (used when meeting an inline rhythm)
    return rhythm
  }

  readBar (param) {
    let bar = { 'rhythm': null, 'chords': [] }
    let str = param.value.substr(1, param.value.length - 2)
    let parts = str.split(/\*|,/)

    // find rhythm by its name (if several, use last one)
    let foundRhythmId = null
    if (this.songcheat['rhythms']) for (let rhythm of this.songcheat['rhythms']) {
      if (rhythm.name === parts[0]) {
        foundRhythmId = rhythm.id
        // break
      }
    }

    // if no rhythm found with this name but this is a potential score (at least one pair of parenthesis or curly brackets)
    if (foundRhythmId === null && (parts[0].match(/\(.*\)/) || parts[0].match(/\{.*\}/))) {
      // create inline rhythm with the name begin the score itself (so the rhythm is found next time if used several times)
      let rhythm = this.handleRhythm(param.line, 'rhythm', [{ value: parts[0], line: param.line }, { value: parts[0], line: param.line }])
      rhythm.inline = true // will be hidden in Rhythm panel
      foundRhythmId = rhythm.id
    }

    if (foundRhythmId !== null) bar.rhythm = foundRhythmId
    else throw new ParserException(param.line, parts[0] + ' is not the name of an existing rhythm')

    // find chords
    parts = parts.slice(1)
    for (let part of parts) {
      // chord repeater
      if (!part.trim()) {
        if (bar.chords.length === 0) throw new ParserException(param.line, 'found chord repeater but there is no chord yet in bar')
        bar.chords.push(JSON.parse(JSON.stringify(bar.chords[bar.chords.length - 1])))
        continue
      }

      // search for chord by its name (if several, use last one)
      let foundChordId = null
      if (this.songcheat['chords']) for (let chord of this.songcheat['chords']) {
        if (chord.name === part) {
          foundChordId = chord.id
          // break
        }
      }

      // if no chord found with this name but this is a valid chord tablature (with an optional barred fret /[-0-9A-Z])
      if (foundChordId === null && part.match(/^[x0-9A-Z]{6}(\/[-0-9A-Z])?$/)) {
        // create inline chord with the name being the tablature itself (so the chord is found next time if used several times), and no fingering nor comment
        let chord = this.handleChord(param.line, 'chord', [{ value: part, line: param.line }, { value: part.split('/')[0], line: param.line }, { value: '000000/' + (part.split('/')[1] || '-'), line: param.line }])
        chord.inline = true // will be hidden in Chords panel and not displayed as a chord change
        foundChordId = chord.id
      }

      if (foundChordId !== null) bar.chords.push(foundChordId)
      else throw new ParserException(param.line, part + ' is not the name of an existing chord and is not a valid chord tablature')
    }

    return bar
  }

  handleSub (line, keyword, params) {
    // a sub is a part like any other but with "sub" = true (will not be displayed in Parts panel)
    let part = this.handlePart(line, keyword, params)
    part.sub = true
  }

  handlePart (line, keyword, params) {
    if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (name and bar(s)), but found ' + params.length)
    this.songcheat['parts'] = this.songcheat['parts'] || []

    // extract part name from params
    let part = { 'id': this.songcheat['parts'].length + 1, 'name': params[0].value, 'phrases': [] }
    params = params.splice(1)
    this.songcheat['parts'].push(part)

    // iterate on remaining params to get bars and phrases
    let bars = []
    for (let pIndex = 0; pIndex < params.length; pIndex++) {
      let param = params[pIndex]

      // phrase separator
      if (param.value === '||') {
        part.phrases.push({ 'bars': bars })
        bars = []
        continue
      }

      // bar repeater
      if (param.value === '%') {
        if (bars.length === 0) throw new ParserException(param.line, 'found bar repeater ' + param.value + ' but there is no bar yet in phrase')
        bars.push(JSON.parse(JSON.stringify(bars[bars.length - 1])))
        continue
      }

      // bar between []
      if (param.value.match(/^\[[^[\]]+\]$/)) {
        bars.push(this.readBar(param))
        continue
      }

      // not a || phrase separator nor a [] bar: must be a part name
      // so search for part by its name (if several, use last one)
      let foundPart = null
      for (let p of this.songcheat['parts']) {
        if (p.name === param.value) {
          foundPart = p
          // break
        }
      }

      // insert found part at current position
      if (foundPart !== null) {
        let phraseIndex = 0
        for (let ph of foundPart.phrases) {
          if (phraseIndex > 0) {
            part.phrases.push({ 'bars': bars })
            bars = []
          }
          for (let b of ph.bars) bars.push(b)
          phraseIndex++
        }
      } else throw new ParserException(param.line, param.value + ' is not the name of an existing part')
    }

    // end of last phrase
    if (bars.length > 0) part.phrases.push({ 'bars': bars })

    return part
  }

  handleStructure (line, keyword, params) {
    if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (part name and lyrics), but found ' + params.length)
    if (params.length % 2 !== 0) throw new ParserException(line, keyword.toUpperCase() + ' expected an even number of parameters (N x part name and lyrics), but found ' + params.length)
    this.songcheat['structure'] = this.songcheat['structure'] || []

    for (let pIndex = 0; pIndex < params.length; pIndex += 2) {
      let param = params[pIndex]

      let found = false
      if (this.songcheat['parts']) {
        for (let part of this.songcheat['parts']) {
          if (part.name === param.value) {
            this.songcheat['structure'].push({ 'id': this.songcheat['structure'].length + 1, 'part': part.id, 'lyrics': params[pIndex + 1].value })
            found = true
            break
          }
        }
      }

      if (!found) throw new ParserException(param.line, param.value + '" is not the name of an existing part')
    }
  }
}

/**
 * Public API
 */

export class Parser {
  constructor () {
    this.parser_ = new Parser_()
  }

  parse (songcheat) {
    console.log('Parsing songcheat...')
    return this.parser_.parse(songcheat)
  }

  getPrecedingKeyword (songcheat, line) {
    return this.parser_.getPrecedingKeyword(songcheat, line)
  }
}
