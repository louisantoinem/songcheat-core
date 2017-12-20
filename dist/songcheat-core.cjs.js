/**
 * SongCheat Core 1.0.0 built on Wed Dec 20 2017 18:30:00 GMT+0100 (CET).
  * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>
 *
 * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-core
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Utils {
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
    var camel = s.toLowerCase().replace(/(?:[-_])(.)/g, function (match, group1) { return group1.toUpperCase() });
    return firstUpper ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel
  }

  static spaces (length, char) {
    if (isNaN(length) || !isFinite(length) || length < 0) throw new Error('Length must a positive finite number')
    var s = '';
    for (var i = 0; i < length; i++) s += char || ' ';
    return s
  }

  /**
   * Interlace two multi line strings: one line of each file in alternance
   * If the second file contains more line then the first one, these additional lines will be ignored
   **/

  static interlace (text1, text2, sepLine, keepEmptyLines) {
    var a1 = text1.split(/\r?\n/);
    var a2 = text2.split(/\r?\n/);
    var a = a1.map(function (v, i) {
      let lines = keepEmptyLines || (a2[i] && a2[i].trim()) ? [v, a2[i]] : [v];
      if (typeof sepLine === 'string') lines.push(sepLine);
      return lines.join('\n')
    });
    return a.join('\n')
  }

  /**
   * Encode given parameters as a GET query string
   **/

  static encodeQueryData (data) {
    let ret = [];
    for (let d in data) { ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d])); }
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
    var codes = [];

    var current = units;
    var rest = 0;

    while (current > 0) {
      try {
        codes.push(this.durationcode(current));
        current = rest;
        rest = 0;
      } catch (e) {
        current--;
        rest++;
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
    let fret = this.char2fret(char);
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

    var result = [];
    for (var i = 0; i < chord.tablature.length; i++) {
      // string will be between 6 and 1 since chord.tablature.length has been verified and is 6
      var string = 6 - i;

      // string never played in this chord
      if (chord.tablature[i] === 'x') continue

      // first time we meet a played string, it's the bass so replace B and B' with the string number
      strings = strings.replace(/B'/g, (string >= 5 ? string - 1 : string));
      strings = strings.replace(/B/g, string);

      // check if this string should be played with the right hand
      // * means "all strings", otherwise concatenated specific string numbers are specified (or B for bass or B' for alternate bass)
      // x after string means muted (ghost) note
      if (strings.match(/^\*/) || strings.indexOf(string) !== -1) {
        let fret = this.char2fret(chord.tablature[i]);
        let xIndex = strings.match(/^\*/) ? 1 : strings.indexOf(string) + 1;
        let mute = strings[xIndex] === 'x';
        result.push({
          string: string,
          fret: fret,
          mute: mute
        });
      }
    }

    return result
  }
}

class ParserException {
  constructor (line, message) {
    this.message = message;
    this.line = line;
  }

  toString () {
    return 'Parser error at line ' + this.line + ': ' + this.message
  }
}

class Parser_ {
  constructor () {
    this.songcheat = {};
    this.blocks = {};
  }

  parse (text) {
    // reset
    this.songcheat = {};
    this.blocks = {};

    // split text into tokens
    let tokens = this.tokenize(text);
    if (tokens.length === 0) return true

    let tokenIndex = 0;
    while (tokenIndex < tokens.length) {
      let token = tokens[tokenIndex];
      let keyword = this.isKeyword(token);

      // we must be on a keyword, otherwise it means that first token in text is not a keyword as expected
      if (!keyword) throw new ParserException(token.line, 'expected keyword, found "' + token.value + '"')

      // get all tokens until next keyword or end
      let params = [];
      for (++tokenIndex; tokenIndex < tokens.length; ++tokenIndex) {
        if (this.isKeyword(tokens[tokenIndex])) break
        params.push(tokens[tokenIndex]);
      }

      // use specific handler if any or default one
      let handler = this['handle' + Utils.firstUpper(keyword)] || this.handleDefault;
      if (typeof handler === 'function') handler.call(this, token.line, keyword, params);
      else throw new ParserException(token.line, 'non function handler found for keyword ' + keyword)
    }

    return this.songcheat
  }

  isKeyword (token) {
    let keyword = Utils.camelCase(token.value);
    return ['artist', 'title', 'year', 'difficulty', 'video', 'tutorial', 'comment', 'tuning', 'capo', 'key', 'time', 'tempo', 'shuffle', 'chord', 'rhythm', 'block', 'part', 'lyricsUnit' /* will disappear soon */, 'structure'].indexOf(keyword) >= 0 ? keyword : false
  }

  tokenize (text) {
    let tokens = [];

    // https://stackoverflow.com/questions/4780728/regex-split-string-preserving-quotes?noredirect=1&lq=1
    let reSpaces = /(?<=^[^"]*(?:"[^"]*"[^"]*)*)[\s\t]+(?=(?:[^"]*"[^"]*")*[^"]*$)/;
    let reNewline = /(?<=^[^"]*(?:"[^"]*"[^"]*)*)(\r?\n)(?=(?:[^"]*"[^"]*")*[^"]*$)/;

    let lineNumber = 1;

    // split at newlines unless enclosed in quotes
    for (let line of text.split(reNewline)) {
      // split also returns the newlines, ignore them
      if (line.match(/^\r?\n$/)) continue

      // trim line
      line = line.trim();

      // console.log("L" + lineNumber + ": ["+ line + "]");

      // if not a comment or empty line
      if (line && !line.match(/^#/)) {
        // split at spaces and tabs unless enclosed in quotes, then trim spaces and quotes
        for (let value of line.split(reSpaces).map(s => s.trim().replace(/^"|"$/g, ''))) tokens.push({ 'value': value, 'line': lineNumber });
      }

      // increment line number
      lineNumber += (1 + (line.match(/(?:\r?\n)/g) || []).length);
    }

    return tokens
  }

  handleDefault (line, keyword, params) {
    if (params.length !== 1) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 1 value, but found ' + params.length)
    this.songcheat[keyword] = ['year', 'capo', 'difficulty'].indexOf(keyword) >= 0 ? parseInt(params[0].value, 10) : params[0].value;
  }

  handleSignature (line, keyword, params) {
    if (params.length !== 1) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 1 value, but found ' + params.length)
    this.songcheat['signature'] = this.songcheat['signature'] || {};
    this.songcheat['signature'][keyword] = keyword === 'tempo' ? parseFloat(params[0].value, 10) : params[0].value;
  }

  handleKey (line, keyword, params) { return this.handleSignature(line, keyword, params) }
  handleTempo (line, keyword, params) { return this.handleSignature(line, keyword, params) }
  handleShuffle (line, keyword, params) { return this.handleSignature(line, keyword, params) }

  handleTime (line, keyword, params) {
    if (params.length !== 3) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 3 values, but found ' + params.length)
    this.songcheat['signature'] = this.songcheat['signature'] || [];
    this.songcheat['signature']['time'] = { 'beatsPerBar': params[1].value, 'beatDuration': params[2].value, 'symbol': params[0].value };
  }

  handleChord (line, keyword, params) {
    if (params.length < 2 || params.length > 4) throw new ParserException(line, keyword.toUpperCase() + ' expected between 2 and 4 values (name, tablature[, fretting="000000/-", comment=""]), but found ' + params.length)

    let name = params[0].value;
    let tablature = params[1].value;
    let fingering = params.length >= 3 ? params[2].value : '000000/-';
    let comment = params.length >= 4 ? params[3].value : '';

    this.songcheat['chords'] = this.songcheat['chords'] || [];
    let chord = { 'id': this.songcheat['chords'].length + 1, 'name': name, 'tablature': tablature, 'fingering': fingering, 'comment': comment };
    this.songcheat['chords'].push(chord);

    // return created chord (used when meeting an inline chord)
    return chord
  }

  handleRhythm (line, keyword, params) {
    if (params.length !== 2) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 2 values (id and score), but found ' + params.length)
    this.songcheat['rhythms'] = this.songcheat['rhythms'] || [];
    this.songcheat['rhythms'].push({ 'id': this.songcheat['rhythms'].length + 1, 'name': params[0].value, 'score': params[1].value });
  }

  handleBlock (line, keyword, params) {
    if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (name and bar(s)), but found ' + params.length)
    this.blocks[params[0].value] = params.slice(1);
  }

  handlePart (line, keyword, params) {
    if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (name and bar(s)), but found ' + params.length)
    this.songcheat['parts'] = this.songcheat['parts'] || [];

    // extract part name from params
    let part = { 'id': this.songcheat['parts'].length + 1, 'name': params[0].value, 'phrases': [] };
    params = params.splice(1);
    this.songcheat['parts'].push(part);

    // iterate on remaining params to get bars and phrases
    let bars = [];
    for (let pIndex = 0; pIndex < params.length; pIndex++) {
      let param = params[pIndex];

      // phrase separator
      if (param.value === '||') {
        part.phrases.push({ 'bars': bars });
        bars = [];
        continue
      }

      // bar repeater
      if (param.value === '%') {
        if (bars.length === 0) throw new ParserException(param.line, 'found bar repeater ' + param.value + ' but there is no bar yet in phrase')
        bars.push(JSON.parse(JSON.stringify(bars[bars.length - 1])));
        continue
      }

      // bar between []
      if (param.value.match(/^\[[^[\]]+\]$/)) {
        let bar = { 'rhythm': null, 'chords': [] };
        let str = param.value.substr(1, param.value.length - 2);
        let parts = str.split(/\*|:/);

        // find rhythm
        let found = false;
        for (let rhythm of this.songcheat['rhythms']) {
          if (rhythm.name === parts[0]) {
            bar.rhythm = rhythm.id;
            found = true;
            break
          }
        }

        if (!found) throw new ParserException(param.line, parts[0] + ' is not the name of an existing rhythm')

        // find chords
        parts = parts.slice(1);
        for (let part of parts) {
          // chord repeater
          if (!part.trim()) {
            if (bar.chords.length === 0) throw new ParserException(param.line, 'found chord repeater but there is no chord yet in bar')
            bar.chords.push(JSON.parse(JSON.stringify(bar.chords[bar.chords.length - 1])));
            continue
          }

          // search for chord by its name
          let found = false;
          for (let chord of this.songcheat['chords']) {
            if (chord.name === part) {
              bar.chords.push(chord.id);
              found = true;
              break
            }
          }

          // if no chord found with this name but this is a valid chord tablature (with an optional barred fret /[-0-9A-Z])
          if (!found && part.match(/^[x0-9A-Z]{6}(\/[-0-9A-Z])?$/)) {
            // create inline chord with the name being the tablature itself, and no fingering nor comment
            let chord = this.handleChord(param.line, 'chord', [{ value: part, line: param.line }, { value: part.split('/')[0], line: param.line }, { value: '000000/' + (part.split('/')[1] || '-'), line: param.line }]);
            bar.chords.push(chord.id);
            found = true;
          }

          if (!found) throw new ParserException(param.line, part + ' is not the name of an existing chord and is not a valid chord tablature')
        }

        bars.push(bar);
        continue
      }

      // not a || phrase separator nor a [] bar: must be a block name
      if (!this.blocks[param.value]) throw new ParserException(param.line, param.value + ' is not the name of an existing block')

      // insert block tokens in params at current position
      let args = [pIndex, 1];
      Array.prototype.push.apply(args, this.blocks[param.value]);
      Array.prototype.splice.apply(params, args);
      pIndex--;
    }

    // end of last phrase
    if (bars.length > 0) part.phrases.push({ 'bars': bars });
  }

  handleStructure (line, keyword, params) {
    if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (part name and lyrics), but found ' + params.length)
    if (params.length % 2 !== 0) throw new ParserException(line, keyword.toUpperCase() + ' expected an even number of parameters (N x part name and lyrics), but found ' + params.length)
    this.songcheat['structure'] = this.songcheat['structure'] || [];

    for (let pIndex = 0; pIndex < params.length; pIndex += 2) {
      let param = params[pIndex];

      let found = false;
      for (let part of this.songcheat['parts']) {
        if (part.name === param.value) {
          this.songcheat['structure'].push({ 'part': part.id, 'lyrics': params[pIndex + 1].value });
          found = true;
          break
        }
      }

      if (!found) throw new ParserException(param.line, param.value + '" is not the name of an existing part')
    }
  }
}

/**
 * Public API
 */

class Parser {
  constructor () {
    this.parser_ = new Parser_();
  }

  parse (songcheat) {
    return this.parser_.parse(songcheat)
  }
}

let MIN_LYRICS_BARLEN = 20; // minimum length of a bar lyrics (before reducing) - not really needed but produces a clearer view when maxConsecutiveSpaces set to 0 (and thus when displaying parts with partdisplay=full) since bars with no or little text will have the same length (unless there are really many chord changes...)
let LYRICS_SUM_DURATIONS = false; // if true "::" is equivalent to ":h:" (assuming lyrics unit is :q)
let KEEP_EMPTY_LINES = false;

class CompilerException {
  constructor (message) {
    this.message = message;
  }

  toString () {
    return 'Compiler error: ' + this.message
  }
}

class Compiler_ {
  constructor (DEBUG) {
    // DEBUG 1 forces showing . * | characters in unit text (even if showDots is passed false) as well as _ for groups that were automatically created when crossing a bar
    this.DEBUG = DEBUG;
  }

  log () {
    if (this.DEBUG > 0) console.log.apply(console, arguments);
  }

  compile (songcheat) {
    // default values for optional properties
    songcheat.mode = songcheat.mode || 'rt';
    songcheat.lyricsMode = songcheat.lyricsMode || 's';
    songcheat.barsPerLine = songcheat.barsPerLine || 4;
    songcheat.signature.key = songcheat.signature.key || 'C';
    songcheat.lyricsUnit = songcheat.lyricsUnit || songcheat.signature.time.beatDuration;

    // deduce bar duration from signature
    songcheat.barDuration = songcheat.signature.time.beatsPerBar * Utils.duration(songcheat.signature.time.beatDuration);

    // resolve all id references (rhythms and chords)
    this.resolveIds(songcheat);

    // default structure if not specified : one unit for each part
    if (!songcheat.parts) {
      songcheat.parts = [];
      for (let part of songcheat.parts) songcheat.structure.push({ 'part': part });
    }

    // give a name to each unit if not already set = name of part with automatic numbering
    let unitsByPart = {};
    let numberByPart = {};
    for (let unit of songcheat.structure) unitsByPart[unit.part.id] = typeof unitsByPart[unit.part.id] === 'undefined' ? 1 : unitsByPart[unit.part.id] + 1;
    for (let unit of songcheat.structure) {
      numberByPart[unit.part.id] = typeof numberByPart[unit.part.id] === 'undefined' ? 1 : numberByPart[unit.part.id] + 1;
      if (!unit.name) unit.name = unit.part.name + (unitsByPart[unit.part.id] > 1 ? ' ' + numberByPart[unit.part.id] : '');
    }

    // give a color to each part if not already set
    let colors = ['red', '#06D6A0', 'blue', 'purple', 'orange', 'magenta'];
    let partIndex = 0;
    for (let part of songcheat.parts) { if (!part.color) part.color = colors[partIndex++ % colors.length]; }

    // validate and compile each rhythm
    for (let rhythm of songcheat.rhythms) this.compileRhythm(rhythm, songcheat.signature.time.beatDuration);

    for (let part of songcheat.parts) {
      // compute a "chordChanges" property in each phrase
      let phraseIndex = 0;
      for (let phrase of part.phrases) {
        phrase.chordChanges = [];
        let lastChord = null;
        for (let bar of phrase.bars) lastChord = this.addChordChanges(bar, phrase.chordChanges, songcheat.barDuration, false, lastChord);

        this.log('Phrase wise chord durations for phrase ' + part.name + '.' + (phraseIndex + 1));
        for (let c of phrase.chordChanges) this.log('\t[' + c.chord.name + '] = ' + c.duration + ' units');

        // compute a "chordChanges" property in each bar
        let barIndex = 0;
        for (let bar of phrase.bars) {
          bar.chordChanges = { 'bar': [], 'rhythm': [] };
          for (let chordChangesMode of ['rhythm', 'bar']) this.addChordChanges(bar, bar.chordChanges[chordChangesMode], songcheat.barDuration, chordChangesMode === 'bar');

          this.log('\tRythm wise chord durations for bar ' + part.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1));
          for (let c of bar.chordChanges['rhythm']) this.log('\t\t[' + c.chord.name + '] = ' + c.duration + ' units');
          this.log('\tBar wise chord durations for bar ' + part.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1));
          for (let c of bar.chordChanges['bar']) this.log('\t\t[' + c.chord.name + '] = ' + c.duration + ' units');

          barIndex++;
        }

        phraseIndex++;
      }

      // compute duration of part
      part.duration = 0;
      for (let phrase of part.phrases) { for (let bar of phrase.bars) part.duration += bar.rhythm.duration; }
    }

    // fluid API
    return songcheat
  }

  resolveIds (songcheat) {
    let unitIndex = 0;
    for (let unit of songcheat.structure) {
      if (!unit.part) throw new CompilerException('Part not defined for unit ' + (unitIndex + 1))

      // resolve part id
      let part = this.resolveId(songcheat.parts, unit.part);
      if (!part) throw new CompilerException('Part ' + unit.part + ' not found')
      unit.part = part;

      unitIndex++;
    }

    for (let part of songcheat.parts) {
      if (!part.phrases) throw new CompilerException('Phrases not defined for part "' + part.name + '"')
      if (!(part.phrases instanceof Array)) throw new CompilerException('Phrases defined for part "' + part.name + '" must be an Array, found: ' + (typeof songcheat.parts.phrases))

      let phraseIndex = 0;
      for (let phrase of part.phrases) {
        let barIndex = 0;
        for (let bar of phrase.bars) {
          if (!bar.rhythm) throw new CompilerException('Rhythm not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
          if (!bar.chords) throw new CompilerException('Chords not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + part.name)
          if (!(bar.chords instanceof Array)) throw new CompilerException('Chords defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' must be an Array, found: ' + (typeof bar.chords))

          // resolve rhythm id
          let rhythm = this.resolveId(songcheat.rhythms, bar.rhythm);
          if (!rhythm) throw new CompilerException('Rhythm ' + bar.rhythm + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1))
          bar.rhythm = rhythm;

          // resolved array of chord ids
          let chords = [];
          for (let chordId of bar.chords) {
            // resolve chord id
            let chord = this.resolveId(songcheat.chords, chordId);
            if (!chord) throw new CompilerException('Chord ' + chordId + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1))
            chords.push(chord);
          }

          bar.chords = chords;
          barIndex++;
        }

        phraseIndex++;
      }
    }
  }

  resolveId (collection, id) {
    if (collection) { for (let i of collection) { if (i.id === id) return i } }
    return null
  }

  compileRhythm (rhythm, initialNoteDuration) {
    this.log('Compiling rhythm ' + rhythm.id + ' with score "' + rhythm.score + '"');

    // default note duration, until changed
    let noteDuration = initialNoteDuration;

    // take not of each placeholder's index, so we can later fetch the associated chord
    rhythm.placeholdercount = 0;

    // for locating syntax errors in message
    let position = 1;
    let lastToken = null;

    // compile the score string into an array of objects
    rhythm.compiledScore = [];
    for (let token of rhythm.score.split(/((?::(?:w|h|q|8|16|32)d?)|\(#\)|T?\s*\([^(]*\)[^()\sT:]*)/)) {
      if ((token = token.trim())) {
        let match = null;
        if ((match = token.match(/^(:(?:w|h|q|8|16|32)d?)$/))) {
          // duration: change note duration to use next
          noteDuration = Utils.duration(match[1]);
        } else if ((match = token.match(/^\(#\)$/))) {
          // rest
          rhythm.compiledScore.push({ rest: true, duration: noteDuration, tied: false, strings: false, flags: {}, placeholderIndex: rhythm.placeholdercount++ });
        } else if ((match = token.match(/^(T?)\s*\(([^(]*)\)([^()\s]*)$/))) {
          // chord placeholder
          let tied = match[1] === 'T';

          // strings = between parentheses
          let strings = match[2];
          if (strings === '') strings = '*'; // an empty string is a shortcut for "*"
          if (strings === 'x') strings = '*x'; // a x alone is a shortcut for "*x"
          if (!strings.match(/^(?:(\*x?)|((?:(?:B|B'|1|2|3|4|5|6)x?)+))$/)) throw new CompilerException('Invalid syntax found in chord placeholder: ' + strings)

          // flags = after parentheses
          let flagsString = match[3];
          let flags = { stroke: null, accent: false, pm: false, fingering: null };
          for (let flag of flagsString.split(/(dd?|uu?|>|PM|[pima]+)/)) {
            if (flag.trim()) {
              if (flag.match(/^(dd?|uu?)$/g)) {
                // stroke mode
                if (flags.fingering) throw new CompilerException('Fingering (' + flags.fingering + ') and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
                if (flags.pm) throw new CompilerException('Palm muting (PM) and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
                if (flags.stroke) throw new CompilerException('More than one stroke mode (d, u, dd, uu) defined for the chord placeholder: ' + token)
                flags.stroke = flag;
              } else if (flag.match(/^[pima]+$/)) {
                // PIMA fingering
                if (flags.stroke) throw new CompilerException('Stroke (' + flags.stroke + ') and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
                if (flags.pm) throw new CompilerException('Palm muting (PM) and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
                if (flags.fingering) throw new CompilerException('More than one fingering (pima) defined for the chord placeholder: ' + token)
                flags.fingering = flag;
              } else if (flag.match(/^PM$/)) {
                // palm muting
                if (flags.stroke) throw new CompilerException('Stroke (' + flags.stroke + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
                if (flags.fingering) throw new CompilerException('Fingering (' + flags.fingering + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token)
                if (flags.pm) throw new CompilerException('More than one palm muting (PM) defined for the chord placeholder: ' + token)
                flags.pm = true;
              } else if (flag.match(/^>$/)) {
                // accent
                if (flags.accent) throw new CompilerException('More than one accent (>) defined for the same placeholder: ' + token)
                flags.accent = true;
              } else throw new CompilerException('Invalid flag "' + flag + '" defined for chord placeholder "' + token + '"')
            }
          }

          // add a note
          rhythm.compiledScore.push({ rest: false, duration: noteDuration, tied: tied, strings: strings, flags: flags, placeholderIndex: rhythm.placeholdercount++ });
        } else throw new CompilerException('Invalid token "' + token + '" in rhythm score definition at position ' + position + (lastToken ? ' (after "' + lastToken + '")' : ''))

        lastToken = token;
      }

      position += token.length;
    }

    // compute total rhythm duration
    rhythm.duration = 0;
    for (let o of rhythm.compiledScore) rhythm.duration += o.duration;
  }

  addChordChanges (bar, chordChanges, barDuration, resetAtBars, lastChord) {
    // ensure number of chords match number of placeholders in rhythm score, by repeating last chord
    if (bar.chords.length < 1) throw new CompilerException('chords must contain at least 1 entry, but ' + bar.chords.length + ' were found')
    while (bar.chords.length < bar.rhythm.placeholdercount) bar.chords.push(bar.chords[bar.chords.length - 1]);

    let offset = 0;
    for (let note of bar.rhythm.compiledScore) {
      // get chord corresponding to the placeholder position
      let chord = bar.chords[note.placeholderIndex];
      if (!chord) throw new CompilerException('No chord found for placeholder ' + (note.placeholderIndex + 1))

      // same chord as before and not a new bar: increment duration with this new note
      if (lastChord === chord && offset % barDuration !== 0) chordChanges[chordChanges.length - 1].duration += note.duration;

      // chord changed: new duration starts with one note of the new chord
      // unless requested to reset chords at bars, chord change will be hidden if still the same as before
      else chordChanges.push({ chord: chord, duration: note.duration, hidden: lastChord === chord && !resetAtBars });

      lastChord = chord;
      offset += note.duration;
    }

    return lastChord
  }

  parseLyrics (unit, defaultCursorStep, barDuration) {
    let warnings = [];
    let offset = 0;

    // remove DOS newlines
    unit.lyrics = (unit.lyrics || '').replace(/\r/g, '');

    // split lyrics into word groups, split occurs at cursor forward instructions (colons, durations and bars)
    unit.groups = [];
    for (let part of unit.lyrics.split(/((?::(?:w|h|q|8|16|32)d?)?:|\|)/)) { // nb: split with capture groups only works in decent browsers, e.g. IE10+
      let match = null;
      // move cursor forward by given or default step duration
      if ((match = part.match(/(:(?:w|h|q|8|16|32)d?)?:/))) offset = this.registerGroup(unit, offset, match[1] ? Utils.duration(match[1]) : defaultCursorStep, barDuration);

      // move cursor to begin of next bar
      else if (part.match(/\|/)) offset = this.registerGroup(unit, offset, barDuration - (offset % barDuration), barDuration);

      // (non empty) word group (waiting for its duration)
      else if (part.length > 0) unit.groups.push({ text: part, offset: offset, duration: 0 });
    }

    // simulate a final bar if last group still open (no duration), i.e. if lyrics do not end on a : or |
    if (unit.groups.length && unit.groups[unit.groups.length - 1].duration === 0) offset = this.registerGroup(unit, offset, barDuration - (offset % barDuration), barDuration);

    // get missing duration and complete with empty groups if needed (offset now contains the total duration of all groups)
    let missingDuration = unit.part.duration - offset;
    this.log('[' + unit.name + '] Missing duration = ' + missingDuration + ' units (' + unit.part.duration + ' - ' + offset + ') = ' + (missingDuration / barDuration) + ' bars missing');
    if (missingDuration < 0) warnings.push('Lyrics contain ' + Math.floor(-missingDuration / barDuration) + ' bar(s)' + (-missingDuration % barDuration ? ' and ' + Utils.durationcodes(-missingDuration % barDuration) : '') + ' in excess');
    offset = this.registerGroup(unit, offset, missingDuration, barDuration);

    for (let group of unit.groups) {
      // compute length of group (in chars), adding 1 so the group having max density is not collated with next group
      let groupLength = this.getGroupLength(group) + 1;

      // ensure the bar will always have the required minimal width
      group.plen = Math.max(groupLength, Math.ceil(MIN_LYRICS_BARLEN * group.duration / barDuration));

      // compute density of group based on the obtained length
      group.p = group.plen / group.duration;

      // set bar true if group ends on a bar
      group.bar = (group.offset + group.duration) % barDuration === 0;

      // initialize chord changes
      group.chordChanges = { 'bar': [], 'rhythm': [], 'phrase': [] };
    }

    // compute maximum density across all groups
    unit.pmax = 0;
    for (let group of unit.groups) unit.pmax = Math.max(unit.pmax, group.p);

    // iterate on each phrase wise chord change and find the associated group
    offset = 0;
    for (let phrase of unit.part.phrases) {
      for (let chordDuration of phrase.chordChanges) {
        // find closest group starting at or before chord offset
        let group = null;
        for (let g of unit.groups) { if (g.offset <= offset) group = g; }
        if (!group) throw new Error('No closest group found for chord ' + chordDuration.chord.name + ' with offset ' + offset + ' units')

        // register chord change in group
        group.chordChanges['phrase'].push({ offset: offset, text: this.getChordDisplay(chordDuration) });

        offset += chordDuration.duration;
      }
    }

    // iterate on each bar wise chord change and find the associated group
    offset = { 'rhythm': 0, 'bar': 0 };
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let chordChangesMode of ['rhythm', 'bar']) {
          for (let chordDuration of bar.chordChanges[chordChangesMode]) {
            // find closest group starting at or before chord offset
            let group = null;
            for (let g of unit.groups) { if (g.offset <= offset[chordChangesMode]) group = g; }
            if (!group) throw new Error('No closest group found for chord ' + chordDuration.chord.name + ' with offset ' + offset[chordChangesMode] + ' units')

            // register chord change in group
            group.chordChanges[chordChangesMode].push({ offset: offset[chordChangesMode], text: this.getChordDisplay(chordDuration) });

            offset[chordChangesMode] += chordDuration.duration;
          }
        }
      }
    }

    // debug info
    var debugText = 'Groups of unit [' + unit.name + ']:\n';
    var barIndex = 0;
    let zeroDuration = false;
    for (let group of unit.groups) {
      debugText += '\tBar ' + (barIndex + 1) + '\t[' + group.text.replace(/\n/g, '\\N') + ']:' + group.duration + ' (' + group.offset + ' - ' + (group.offset + group.duration) + ') L=' + this.getGroupLength(group) + " L'=" + group.plen + ' ρ=' + group.p.toFixed(2) + ' #Chord changes %bar= ' + group.chordChanges['bar'].length + ' %phrase= ' + group.chordChanges['phrase'].length;
      if (group.duration === 0) zeroDuration = true;
      if (group.bar) {
        barIndex++;
        debugText += ' | ';
      }
      debugText += '\n';
    }
    debugText += 'ρ max = ' + unit.pmax.toFixed(2);
    this.log(debugText);

    if (zeroDuration) throw new Error('Detected group with 0 duration')

    return warnings
  }

  getUnitText (unit, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
    var unitText = '';

    // concatenate lyrics groups, giving them a number of positions proprtional to their duration
    var barIndex = 0;
    var groupIndex = 0;
    for (let group of unit.groups) {
      // where and on how many positions will this group be displayed
      group.position = [...unitText.replace(/\n/g, '')].length;
      group.length = Math.ceil(group.duration * unit.pmax);

      // an hyphen means a word has been cut in two, no need for a space before next group
      // but if the final character should be a bar, then always count this extra character
      let needFinalSpace = group.bar || !group.text.match(/-$/);

      // if maxConsecutiveSpaces is set, set a maximum for the number of allowed positions if needed
      let maxLength = null;
      if (maxConsecutiveSpaces > 0) maxLength = this.getGroupLength(group) + maxConsecutiveSpaces - (needFinalSpace ? 0 : 1);
      if (maxLength) group.length = Math.min(group.length, maxLength);

      // but if group has associated chords, we must have enough space for them (and this has priority over maxConsecutiveSpaces)
      let minLength = group.bar ? 1 : 0; // 1 for the final bar sign if any
      if (group.chordChanges[chordChangesMode]) { for (let i = 0; i < group.chordChanges[chordChangesMode].length; i++) minLength += group.chordChanges[chordChangesMode][i].text.length; }
      minLength = Math.max(this.getGroupLength(group) + (needFinalSpace ? 1 : 0), minLength);
      group.length = Math.max(group.length, minLength);

      // filler string used to reach that length (nb: filler will always have a length of at least 1)
      let filler = Utils.spaces(group.length - this.getGroupLength(group), showDots || this.DEBUG ? '.' : ' ');

      // replace last character of filler by a | if this is the end of a bar
      filler = filler.replace(/(.)$/, group.bar ? (split > 0 && ((barIndex + 1) % split === 0) ? '|\n' : '|') : (this.DEBUG ? '*' : '$1'));

      // append filler to text, remove new lines if splitting at bars
      var groupText = (split > 0 ? group.text.replace(/\n/g, '') : group.text) + filler;

      this.log('[' + unit.name + '] Display group ' + (groupIndex + 1) + ' "' + groupText.replace(/\n/g, '\\N') + '" on ' + group.length + ' chars (CEIL ' + (group.duration * unit.pmax).toFixed(2) + ' MIN ' + minLength + ' MAX ' + (maxLength || 'n/a') + ')');
      unitText += groupText;

      groupIndex++;
      if (group.bar) barIndex++;
    }

    // we weren't asked to add chords
    if (!chordChangesMode) return unitText

    // build chord inserts, based on bar or phrase wise changes, each with the text and position where to insert
    let chordInserts = [];
    for (let group of unit.groups) {
      let lengthStillToPlaceOnThisGroup = 0;
      let lengthYetPlacedOnThisGroup = 0;

      // compute length of all chord inserts
      for (let chordChange of group.chordChanges[chordChangesMode]) lengthStillToPlaceOnThisGroup += chordChange.text.length;

      for (let chordChange of group.chordChanges[chordChangesMode]) {
        // position of the chord will be the position of the group + length corresponding to offset delta
        let positionDelta = Math.ceil(((chordChange.offset - group.offset) / group.duration) * group.length);
        let positionDelta_ = positionDelta;

        // ensure that chord name will not cross end of group it belongs to (last char of group must not be overwritten either if it is a bar)
        while (positionDelta + lengthStillToPlaceOnThisGroup > group.length - (group.bar ? 1 : 0)) { positionDelta--; }

        // ensure that chords already there still have enough room
        while (positionDelta - lengthYetPlacedOnThisGroup < 0) { positionDelta++; }

        this.log('Closest group "' + group.text.replace(/\n/g, '\\n') + '" with offset ' + group.offset + ' and position ' + group.position + ' found for ' + chordChange.text.trim() + ' with offset ' + chordChange.offset + ' units\n\tposition delta from group start = ' + positionDelta + ' chars (initially ' + positionDelta_ + ' chars)');
        chordInserts.push({ text: chordChange.text, offset: chordChange.offset, position: group.position + positionDelta });

        lengthYetPlacedOnThisGroup = positionDelta + chordChange.text.length;
        lengthStillToPlaceOnThisGroup -= chordChange.text.length;
      }
    }

    for (let chordInsert of chordInserts) this.log('[' + unit.name + '] Should insert ' + chordInsert.text + ' @ ' + chordInsert.offset + ' units / ' + chordInsert.position + ' chars');

    // insert these chord inserts
    let position = 0;
    let skip = 0;
    let unitText_ = unitText;
    let chordText = '';
    unitText = '';
    for (let char of unitText_) {
      if (char === '\n') {
        unitText += '\n';
        chordText += '\n';
        skip = 0;
      } else {
        for (let chordInsert of chordInserts) {
          if (!chordInsert.inserted) {
            if (chordInsert.position <= position) {
              this.log('[' + unit.name + '] Inserting ' + chordInsert.text + ' @ ' + position + ' chars');
              chordText += chordInsert.text;
              chordInsert.inserted = true;
              skip = chordInsert.text.length;
            }
          }
        }

        position++;

        // add char to unit text, and corresponding space to chord text
        // only bar symbols are added in chord text instead of unit text (if showing dots, then bars are displayed in both texts)
        if (skip === 0) { chordText += char === '|' ? char : ' '; } else { skip--; }
        unitText += char === '|' && !(showDots || this.DEBUG) ? ' ' : char;
      }
    }

    // and interlace the two strings
    return Utils.interlace(chordText, unitText, null, KEEP_EMPTY_LINES)
  }

  registerGroup (unit, offset, step, barDuration) {
    if (!barDuration) throw new Error('Invalid bar duration passed to registerGroup')

    while (step > 0) {
      // duration added to preceding group may never be more than what's left until end of bar
      let addDuration = Math.min(step, barDuration - (offset % barDuration));

      // create a new group if none or if preceding already got its duration
      if (!unit.groups.length || (!LYRICS_SUM_DURATIONS && unit.groups[unit.groups.length - 1].duration > 0)) unit.groups.push({ text: '', offset: offset, duration: 0 });

      // add this duration to preceding group (create it if needed)
      unit.groups[unit.groups.length - 1].duration += addDuration;
      offset += addDuration;
      step -= addDuration;

      // step is going to cross end of bar: directly create a first empty group
      if (step > 0) unit.groups.push({ text: this.DEBUG > 1 ? '_' : '', offset: offset, duration: 0 });
    }

    return offset
  }

  getGroupLength (group) {
    // return the number of visible graphemes in group text
    // - newlines are not counted
    // - tabs will be converted to spaces and may thus count as 1
    // - use spread operator to correctly count astral unicode symbols
    return [...group.text.replace(/\n/g, '')].length
  }

  getChordDisplay (chordDuration) {
    // space and not empty if hidden, to ensure that a white space will show that this change does not happen at the begin of the bar
    if (chordDuration.hidden) return ' '

    // a space prevents chord names to be glued together on group and prevents a next group from starting directly after last chord of previous group
    return chordDuration.chord.name + ' '
  }
}

/**
 * Public API
 */

class Compiler {
  constructor (songcheat, DEBUG) {
    this.compiler_ = new Compiler_(DEBUG);
    if (songcheat) this.set(songcheat);
  }

  set (songcheat) {
    this.compiler_.log(Utils.title('COMPILE SONGCHEAT'));
    this.scc = this.compiler_.compile(JSON.parse(JSON.stringify(songcheat)));
  }

  parseLyrics (unit) {
    this.compiler_.log(Utils.title('PARSE LYRICS ' + unit.name));
    return this.compiler_.parseLyrics(unit, Utils.duration(this.scc.lyricsUnit), this.scc.barDuration)
  }

  getUnitText (unit, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
    this.compiler_.log(Utils.title(`GET LYRICS TEXT ${unit.name} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, chordChangesMode = ${chordChangesMode}, showDots = ${showDots})`));
    return this.compiler_.getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots)
  }

  getPartText (part, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
    // dummy unit with no lyrics
    let unit = { name: part.name, part: part };

    this.compiler_.log(Utils.title('PARSE PART LYRICS ' + unit.name));
    this.compiler_.parseLyrics(unit, Utils.duration(this.scc.lyricsUnit), this.scc.barDuration);

    this.compiler_.log(Utils.title(`GET PART LYRICS TEXT ${unit.name} (maxConsecutiveSpaces = ${maxConsecutiveSpaces}, split = ${split}, chordChangesMode = ${chordChangesMode}, showDots = ${showDots})`));
    return this.compiler_.getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots)
  }
}

exports.Utils = Utils;
exports.Parser = Parser;
exports.ParserException = ParserException;
exports.Compiler = Compiler;
exports.CompilerException = CompilerException;
