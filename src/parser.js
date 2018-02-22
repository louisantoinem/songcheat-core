import { Utils } from './utils'
import { Tokenizer } from './tokenizer'

export class ParserException extends Error {
  constructor (line, message) {
    super('Parser error at line ' + line + ': ' + message)
  }
  toString () {
    return this.message
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
    let tokens = Tokenizer.tokenize(text)
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

    // remove sub parts
    if (this.songcheat['parts']) {
      let parts = []
      for (let part of this.songcheat['parts']) if (!part.sub) parts.push(part)
      this.songcheat['parts'] = parts
    }

    return this.songcheat
  }

  isKeyword (token) {
    let keyword = Utils.camelCase(token.value)
    if (token.quoted) return false
    return ['artist', 'title', 'year', 'difficulty', 'video', 'tutorial', 'source', 'comment', 'mode', 'tuning', 'capo', 'key', 'time', 'tempo', 'shuffle', 'chord', 'rhythm', 'sub', 'part', 'lyricsUnit', 'structure'].indexOf(keyword) >= 0 ? keyword : false
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
    this.songcheat['signature']['time'] = { 'beatsPerBar': params[1].value, 'beat': params[2].value, 'symbol': params[0].value }
  }

  handleChord (line, keyword, params) {
    if (params.length < 2 || params.length > 4) throw new ParserException(line, keyword.toUpperCase() + ' expected between 2 and 4 values (name, tablature[, fingering="000000/-", comment=""]), but found ' + params.length)

    let name = params[0].value
    let tablature = params[1].value
    let fingering = params.length >= 3 ? params[2].value : null
    let comment = params.length >= 4 ? params[3].value : ''

    this.songcheat['chords'] = this.songcheat['chords'] || []
    let chord = { name, tablature, fingering, comment }
    this.songcheat['chords'].push(chord)
  }

  handleRhythm (line, keyword, params) {
    if (params.length !== 2) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 2 values (name and score), but found ' + params.length)

    this.songcheat['rhythms'] = this.songcheat['rhythms'] || []
    let rhythm = { 'name': params[0].value, 'score': params[1].value }
    this.songcheat['rhythms'].push(rhythm)
  }

  handleSub (line, keyword, params) {
    // a sub is a part like any other but with "sub" = true
    // meaning that this part will not be exported in parsed songcheat (i.e. it cannot be used for a unit)
    let part = this.handlePart(line, keyword, params)
    part.sub = true
  }

  handlePart (line, keyword, params) {
    if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (name and bar(s)), but found ' + params.length)
    this.songcheat['parts'] = this.songcheat['parts'] || []

    // extract part name from params
    let part = { 'name': params[0].value, 'phrases': [] }
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

      // search for part by its name (if several, use last one)
      let foundPart = null
      for (let p of this.songcheat['parts']) {
        if (p !== part && p.name === param.value) {
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
        continue
      }

      // not a || phrase separator nor a part name: must be a bar
      let parts = param.value.split(/\s*\*/)
      bars.push({ 'rhythm': parts[0], 'chords': parts[1] || '' })
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
      this.songcheat['structure'].push({ 'part': params[pIndex].value, 'lyrics': params[pIndex + 1].value })
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
