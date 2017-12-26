/**
 * SongCheat Core 1.0.0 built on Tue Dec 26 2017 00:42:31 GMT+0100 (CET).
  * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>
 *
 * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-core
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var Utils = function () {
  function Utils() {
    classCallCheck(this, Utils);
  }

  createClass(Utils, null, [{
    key: 'arraysEqual',

    /**
    * Array helper functions
    */

    value: function arraysEqual(a, b) {
      if (a === b) return true;
      if (a === null || b === null) return false;
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    /**
    * String helper functions
    */

  }, {
    key: 'title',
    value: function title(str) {
      return '\n' + this.spaces(str.length + 8, '*') + '\n*** ' + str + ' ***\n' + this.spaces(str.length + 8, '*') + '\n';
    }
  }, {
    key: 'firstUpper',
    value: function firstUpper(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
  }, {
    key: 'camelCase',
    value: function camelCase(s, firstUpper) {
      var camel = s.toLowerCase().replace(/(?:[-_])(.)/g, function (match, group1) {
        return group1.toUpperCase();
      });
      return firstUpper ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel;
    }
  }, {
    key: 'spaces',
    value: function spaces(length, char) {
      if (isNaN(length) || !isFinite(length) || length < 0) throw new Error('Length must a positive finite number');
      var s = '';
      for (var i = 0; i < length; i++) {
        s += char || ' ';
      }return s;
    }

    /**
     * Interlace two multi line strings: one line of each file in alternance
     * If the second file contains more line then the first one, these additional lines will be ignored
     **/

  }, {
    key: 'interlace',
    value: function interlace(text1, text2, sepLine, keepEmptyLines) {
      var a1 = text1.split(/\r?\n/);
      var a2 = text2.split(/\r?\n/);
      var a = a1.map(function (v, i) {
        var lines = keepEmptyLines || a2[i] && a2[i].trim() ? [v, a2[i]] : [v];
        if (typeof sepLine === 'string') lines.push(sepLine);
        return lines.join('\n');
      });
      return a.join('\n');
    }

    /**
     * Encode given parameters as a GET query string
     **/

  }, {
    key: 'encodeQueryData',
    value: function encodeQueryData(data) {
      var ret = [];
      for (var d in data) {
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
      }
      return ret.join('&');
    }

    /**
     * Convert a duration code to the smallest unit (64th)
     **/

  }, {
    key: 'duration',
    value: function duration(code) {
      if (code === ':32') return 2;
      if (code === ':16') return 4;
      if (code === ':8') return 8;
      if (code === ':q') return 16;
      if (code === ':h') return 32;
      if (code === ':w') return 64;

      if (code === ':32d') return 3;
      if (code === ':16d') return 6;
      if (code === ':8d') return 12;
      if (code === ':qd') return 24;
      if (code === ':hd') return 48;
      if (code === ':wd') return 96;

      throw new Error('Invalid duration code "' + code + '"');
    }

    /**
     * Convert back a number of units (64th) into a duration code
     **/

  }, {
    key: 'durationcode',
    value: function durationcode(units) {
      var _arr = ['w', 'h', 'q', '8', '16', '32'];

      for (var _i = 0; _i < _arr.length; _i++) {
        var code = _arr[_i];
        if (this.duration(':' + code) === units) return ':' + code;
        if (this.duration(':' + code + 'd') === units) return ':' + code + 'd';
      }

      throw new Error('Could not find a code with a value of ' + units + ' units');
    }

    /**
     * Convert a number of units (64th) into one or several duration codes
     **/

  }, {
    key: 'durationcodes',
    value: function durationcodes(units) {
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

      if (rest > 0) throw new Error('Could not find codes adding to a value of ' + units + ' units');

      return codes;
    }

    /**
     * Convert a fret number (up to 35) to a single char (digit or capital letter)
     * Fret 10 is notated as A, 11 as B, ... and 35 as Z
     */

  }, {
    key: 'fret2char',
    value: function fret2char(fret) {
      if (isNaN(fret) || fret < 0 || fret > 35) throw new Error('Cannot convert fret number ' + fret + ' to a single char (expected a value between 0 and 35)');
      return fret < 10 ? '' + fret : String.fromCharCode('A'.charCodeAt(0) + fret - 10);
    }

    /**
     * Convert a single char (digit or capital letter) to a fret number
     * A means fret 10, 11 fret B, ... and Z fret 35
     */

  }, {
    key: 'char2fret',
    value: function char2fret(char) {
      if (typeof char !== 'string') throw new Error('Invalid fret char ' + char + ' expected a string');
      if (!char.match(/^[0-9A-Z]$/)) throw new Error('Invalid fret char ' + char + ' (expected a value between [0-9] or [A-Z])');
      return char >= 'A' ? 10 + char.charCodeAt(0) - 'A'.charCodeAt(0) : parseInt(char, 10);
    }

    /**
     * Convert an absolute fret number (single char) to a relative fret number (0 never changes)
     */

  }, {
    key: 'abs2rel',
    value: function abs2rel(char, startingFret) {
      var fret = this.char2fret(char);
      if (isNaN(fret) || fret < 0) throw new Error('Invalid fret number ' + fret + ' (expected a positive or 0 integer value)');
      if (fret === 0) return 0;
      if (isNaN(startingFret) || startingFret < 0) throw new Error('Invalid starting fret number ' + startingFret + ' (expected a positive or 0 integer value)');
      if (startingFret + 8 < fret || startingFret > fret) throw new Error('Fret ' + fret + ' cannot be made relative to starting fret ' + startingFret + ' within the allowed range of 1 to 9');
      return fret + 1 - startingFret;
    }

    /**
     * Convert a relative fret number to an absolute fret number (single char) (0 never changes)
     */

  }, {
    key: 'rel2abs',
    value: function rel2abs(relFret, startingFret) {
      return this.fret2char(relFret ? relFret + startingFret - 1 : relFret);
    }

    /**
     * Take a chord and a placeholder contents
     * Return an array containing one object { string, fret, mute } for each played string
     */

  }, {
    key: 'chordStrings',
    value: function chordStrings(chord, strings) {
      if (!chord.tablature) throw new Error('Tablature not defined for chord ' + chord.name);
      if (!chord.fingering) throw new Error('Fingering not defined for chord ' + chord.name);

      var result = [];
      for (var i = 0; i < chord.tablature.length; i++) {
        // string will be between 6 and 1 since chord.tablature.length has been verified and is 6
        var string = 6 - i;

        // string never played in this chord
        if (chord.tablature[i] === 'x') continue;

        // first time we meet a played string, it's the bass so replace B and B' with the string number
        strings = strings.replace(/B'/g, string >= 5 ? string - 1 : string);
        strings = strings.replace(/B/g, string);

        // check if this string should be played with the right hand
        // * means "all strings", otherwise concatenated specific string numbers are specified (or B for bass or B' for alternate bass)
        // x after string means muted (ghost) note
        if (strings.match(/^\*/) || strings.indexOf(string) !== -1) {
          var fret = this.char2fret(chord.tablature[i]);
          var xIndex = strings.match(/^\*/) ? 1 : strings.indexOf(string) + 1;
          var mute = strings[xIndex] === 'x';
          result.push({
            string: string,
            fret: fret,
            mute: mute
          });
        }
      }

      return result;
    }
  }]);
  return Utils;
}();

var ParserException = function () {
  function ParserException(line, message) {
    classCallCheck(this, ParserException);

    this.message = message;
    this.line = line;
  }

  createClass(ParserException, [{
    key: 'toString',
    value: function toString() {
      return 'Parser error at line ' + this.line + ': ' + this.message;
    }
  }]);
  return ParserException;
}();

var Parser_ = function () {
  function Parser_() {
    classCallCheck(this, Parser_);

    this.songcheat = {};
    this.blocks = {};
  }

  createClass(Parser_, [{
    key: 'parse',
    value: function parse(text) {
      // reset
      this.songcheat = {};
      this.blocks = {};

      // split text into tokens
      var tokens = this.tokenize(text);
      if (tokens.length === 0) return this.songcheat;

      var tokenIndex = 0;
      while (tokenIndex < tokens.length) {
        var token = tokens[tokenIndex];
        var keyword = this.isKeyword(token);

        // we must be on a keyword, otherwise it means that first token in text is not a keyword as expected
        if (!keyword) throw new ParserException(token.line, 'expected keyword, found "' + token.value + '"');

        // get all tokens until next keyword or end
        var params = [];
        for (++tokenIndex; tokenIndex < tokens.length; ++tokenIndex) {
          if (this.isKeyword(tokens[tokenIndex])) break;
          params.push(tokens[tokenIndex]);
        }

        // use specific handler if any or default one
        var handler = this['handle' + Utils.firstUpper(keyword)] || this.handleDefault;
        if (typeof handler === 'function') handler.call(this, token.line, keyword, params);else throw new ParserException(token.line, 'non function handler found for keyword ' + keyword);
      }

      return this.songcheat;
    }
  }, {
    key: 'getPrecedingKeyword',
    value: function getPrecedingKeyword(text, line) {
      // reset
      this.songcheat = {};
      this.blocks = {};

      var lastResult = null;

      // split text into tokens
      var tokens = this.tokenize(text);
      if (tokens.length === 0) return true;

      var tokenIndex = 0;
      while (tokenIndex < tokens.length) {
        var token = tokens[tokenIndex];
        var keyword = this.isKeyword(token);

        if (token.line > line) return lastResult;

        // we must be on a keyword, otherwise it means that first token in text is not a keyword as expected
        if (!keyword) throw new ParserException(token.line, 'expected keyword, found "' + token.value + '"');

        // get all tokens until next keyword or end
        var params = [];
        for (++tokenIndex; tokenIndex < tokens.length; ++tokenIndex) {
          if (this.isKeyword(tokens[tokenIndex])) break;
          params.push(tokens[tokenIndex]);
        }

        // use specific handler if any or default one
        var handler = this['handle' + Utils.firstUpper(keyword)] || this.handleDefault;
        if (typeof handler === 'function') handler.call(this, token.line, keyword, params);else throw new ParserException(token.line, 'non function handler found for keyword ' + keyword);

        lastResult = { line: token.line, keyword: keyword, params: params, chordIndex: null, rhythmIndex: null, partIndex: null, unitIndex: null };

        if (keyword === 'chord') lastResult.chordIndex = this.songcheat.chords.length - 1;else if (keyword === 'rhythm') lastResult.rhythmIndex = this.songcheat.rhythms.length - 1;else if (keyword === 'part') lastResult.partIndex = this.songcheat.parts.length - 1;else if (keyword === 'structure') {
          // special case since there is no distinct UNIT keyword for each unit, but a single STRUCTURE keyword for all units
          var paramIndex = 0;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var param = _step.value;

              if (param.line > line) break;
              lastResult.unitIndex = Math.floor(paramIndex / 2);
              paramIndex++;
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      }

      return lastResult;
    }
  }, {
    key: 'isKeyword',
    value: function isKeyword(token) {
      var keyword = Utils.camelCase(token.value);
      return ['artist', 'title', 'year', 'difficulty', 'video', 'tutorial', 'comment', 'tuning', 'capo', 'key', 'time', 'tempo', 'shuffle', 'chord', 'rhythm', 'block', 'part', 'lyricsUnit' /* will disappear soon */, 'structure'].indexOf(keyword) >= 0 ? keyword : false;
    }
  }, {
    key: 'tokenize',
    value: function tokenize(text) {
      var tokens = [];

      // https://stackoverflow.com/questions/4780728/regex-split-string-preserving-quotes?noredirect=1&lq=1
      var reSpaces = /(?<=^[^"]*(?:"[^"]*"[^"]*)*)[\s\t]+(?=(?:[^"]*"[^"]*")*[^"]*$)/;
      var reNewline = /(?<=^[^"]*(?:"[^"]*"[^"]*)*)(\r?\n)(?=(?:[^"]*"[^"]*")*[^"]*$)/;

      var lineNumber = 1;

      // split at newlines unless enclosed in quotes
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = text.split(reNewline)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var line = _step2.value;

          // split also returns the newlines, ignore them
          if (line.match(/^\r?\n$/)) continue;

          // trim line
          line = line.trim();

          // console.log("L" + lineNumber + ": ["+ line + "]");

          // if not a comment or empty line
          if (line && !line.match(/^#/)) {
            // split at spaces and tabs unless enclosed in quotes, then trim spaces and quotes
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = line.split(reSpaces).map(function (s) {
                return s.trim().replace(/^"|"$/g, '');
              })[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var value = _step3.value;
                tokens.push({ 'value': value, 'line': lineNumber });
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }
          }

          // increment line number
          lineNumber += 1 + (line.match(/(?:\r?\n)/g) || []).length;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return tokens;
    }
  }, {
    key: 'handleDefault',
    value: function handleDefault(line, keyword, params) {
      if (params.length !== 1) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 1 value, but found ' + params.length);
      this.songcheat[keyword] = ['year', 'capo', 'difficulty'].indexOf(keyword) >= 0 ? parseInt(params[0].value, 10) : params[0].value;
    }
  }, {
    key: 'handleSignature',
    value: function handleSignature(line, keyword, params) {
      if (params.length !== 1) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 1 value, but found ' + params.length);
      this.songcheat['signature'] = this.songcheat['signature'] || {};
      this.songcheat['signature'][keyword] = keyword === 'tempo' ? parseFloat(params[0].value, 10) : params[0].value;
    }
  }, {
    key: 'handleKey',
    value: function handleKey(line, keyword, params) {
      return this.handleSignature(line, keyword, params);
    }
  }, {
    key: 'handleTempo',
    value: function handleTempo(line, keyword, params) {
      return this.handleSignature(line, keyword, params);
    }
  }, {
    key: 'handleShuffle',
    value: function handleShuffle(line, keyword, params) {
      return this.handleSignature(line, keyword, params);
    }
  }, {
    key: 'handleTime',
    value: function handleTime(line, keyword, params) {
      if (params.length !== 3) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 3 values, but found ' + params.length);
      this.songcheat['signature'] = this.songcheat['signature'] || [];
      this.songcheat['signature']['time'] = { 'beatsPerBar': params[1].value, 'beatDuration': params[2].value, 'symbol': params[0].value };
    }
  }, {
    key: 'handleChord',
    value: function handleChord(line, keyword, params) {
      if (params.length < 2 || params.length > 4) throw new ParserException(line, keyword.toUpperCase() + ' expected between 2 and 4 values (name, tablature[, fingering="000000/-", comment=""]), but found ' + params.length);

      var name = params[0].value;
      var tablature = params[1].value;
      var fingering = params.length >= 3 ? params[2].value : '000000/-';
      var comment = params.length >= 4 ? params[3].value : '';

      this.songcheat['chords'] = this.songcheat['chords'] || [];
      var chord = { 'id': this.songcheat['chords'].length + 1, 'name': name, 'tablature': tablature, 'fingering': fingering, 'comment': comment };
      this.songcheat['chords'].push(chord);

      // return created chord (used when meeting an inline chord)
      return chord;
    }
  }, {
    key: 'handleRhythm',
    value: function handleRhythm(line, keyword, params) {
      if (params.length !== 2) throw new ParserException(line, keyword.toUpperCase() + ' expected exactly 2 values (id and score), but found ' + params.length);
      this.songcheat['rhythms'] = this.songcheat['rhythms'] || [];
      this.songcheat['rhythms'].push({ 'id': this.songcheat['rhythms'].length + 1, 'name': params[0].value, 'score': params[1].value });
    }
  }, {
    key: 'handleBlock',
    value: function handleBlock(line, keyword, params) {
      if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (name and bar(s)), but found ' + params.length);
      this.blocks[params[0].value] = params.slice(1);
    }
  }, {
    key: 'handlePart',
    value: function handlePart(line, keyword, params) {
      if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (name and bar(s)), but found ' + params.length);
      this.songcheat['parts'] = this.songcheat['parts'] || [];

      // extract part name from params
      var part = { 'id': this.songcheat['parts'].length + 1, 'name': params[0].value, 'phrases': [] };
      params = params.splice(1);
      this.songcheat['parts'].push(part);

      // iterate on remaining params to get bars and phrases
      var bars = [];
      for (var pIndex = 0; pIndex < params.length; pIndex++) {
        var param = params[pIndex];

        // phrase separator
        if (param.value === '||') {
          part.phrases.push({ 'bars': bars });
          bars = [];
          continue;
        }

        // bar repeater
        if (param.value === '%') {
          if (bars.length === 0) throw new ParserException(param.line, 'found bar repeater ' + param.value + ' but there is no bar yet in phrase');
          bars.push(JSON.parse(JSON.stringify(bars[bars.length - 1])));
          continue;
        }

        // bar between []
        if (param.value.match(/^\[[^[\]]+\]$/)) {
          var bar = { 'rhythm': null, 'chords': [] };
          var str = param.value.substr(1, param.value.length - 2);
          var parts = str.split(/\*|:/);

          // find rhythm
          var found = false;
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = this.songcheat['rhythms'][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var rhythm = _step4.value;

              if (rhythm.name === parts[0]) {
                bar.rhythm = rhythm.id;
                found = true;
                break;
              }
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }

          if (!found) throw new ParserException(param.line, parts[0] + ' is not the name of an existing rhythm');

          // find chords
          parts = parts.slice(1);
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = parts[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var _part = _step5.value;

              // chord repeater
              if (!_part.trim()) {
                if (bar.chords.length === 0) throw new ParserException(param.line, 'found chord repeater but there is no chord yet in bar');
                bar.chords.push(JSON.parse(JSON.stringify(bar.chords[bar.chords.length - 1])));
                continue;
              }

              // search for chord by its name
              var _found = false;
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                for (var _iterator6 = this.songcheat['chords'][Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                  var chord = _step6.value;

                  if (chord.name === _part) {
                    bar.chords.push(chord.id);
                    _found = true;
                    break;
                  }
                }

                // if no chord found with this name but this is a valid chord tablature (with an optional barred fret /[-0-9A-Z])
              } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                  }
                } finally {
                  if (_didIteratorError6) {
                    throw _iteratorError6;
                  }
                }
              }

              if (!_found && _part.match(/^[x0-9A-Z]{6}(\/[-0-9A-Z])?$/)) {
                // create inline chord with the name being the tablature itself, and no fingering nor comment
                var _chord = this.handleChord(param.line, 'chord', [{ value: _part, line: param.line }, { value: _part.split('/')[0], line: param.line }, { value: '000000/' + (_part.split('/')[1] || '-'), line: param.line }]);
                bar.chords.push(_chord.id);
                _found = true;
              }

              if (!_found) throw new ParserException(param.line, _part + ' is not the name of an existing chord and is not a valid chord tablature');
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }

          bars.push(bar);
          continue;
        }

        // not a || phrase separator nor a [] bar: must be a block name
        if (!this.blocks[param.value]) throw new ParserException(param.line, param.value + ' is not the name of an existing block');

        // insert block tokens in params at current position
        var args = [pIndex, 1];
        Array.prototype.push.apply(args, this.blocks[param.value]);
        Array.prototype.splice.apply(params, args);
        pIndex--;
      }

      // end of last phrase
      if (bars.length > 0) part.phrases.push({ 'bars': bars });
    }
  }, {
    key: 'handleStructure',
    value: function handleStructure(line, keyword, params) {
      if (params.length < 2) throw new ParserException(line, keyword.toUpperCase() + ' expected at least 2 values (part name and lyrics), but found ' + params.length);
      if (params.length % 2 !== 0) throw new ParserException(line, keyword.toUpperCase() + ' expected an even number of parameters (N x part name and lyrics), but found ' + params.length);
      this.songcheat['structure'] = this.songcheat['structure'] || [];

      for (var pIndex = 0; pIndex < params.length; pIndex += 2) {
        var param = params[pIndex];

        var found = false;
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = this.songcheat['parts'][Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var part = _step7.value;

            if (part.name === param.value) {
              this.songcheat['structure'].push({ 'part': part.id, 'lyrics': params[pIndex + 1].value });
              found = true;
              break;
            }
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
              _iterator7.return();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }

        if (!found) throw new ParserException(param.line, param.value + '" is not the name of an existing part');
      }
    }
  }]);
  return Parser_;
}();

/**
 * Public API
 */

var Parser = function () {
  function Parser() {
    classCallCheck(this, Parser);

    this.parser_ = new Parser_();
  }

  createClass(Parser, [{
    key: 'parse',
    value: function parse(songcheat) {
      return this.parser_.parse(songcheat);
    }
  }, {
    key: 'getPrecedingKeyword',
    value: function getPrecedingKeyword(songcheat, line) {
      return this.parser_.getPrecedingKeyword(songcheat, line);
    }
  }]);
  return Parser;
}();

var MIN_LYRICS_BARLEN = 20; // minimum length of a bar lyrics (before reducing) - not really needed but produces a clearer view when maxConsecutiveSpaces set to 0 (and thus when displaying parts with partdisplay=full) since bars with no or little text will have the same length (unless there are really many chord changes...)
var LYRICS_SUM_DURATIONS = false; // if true "::" is equivalent to ":h:" (assuming lyrics unit is :q)
var KEEP_EMPTY_LINES = false;

var CompilerException = function () {
  function CompilerException(message) {
    classCallCheck(this, CompilerException);

    this.message = message;
  }

  createClass(CompilerException, [{
    key: 'toString',
    value: function toString() {
      return 'Compiler error: ' + this.message;
    }
  }]);
  return CompilerException;
}();

var Compiler_ = function () {
  function Compiler_(DEBUG) {
    classCallCheck(this, Compiler_);

    // DEBUG 1 forces showing . * | characters in unit text (even if showDots is passed false) as well as _ for groups that were automatically created when crossing a bar
    this.DEBUG = DEBUG;
  }

  createClass(Compiler_, [{
    key: 'log',
    value: function log() {
      if (this.DEBUG > 0) console.log.apply(console, arguments);
    }
  }, {
    key: 'compile',
    value: function compile(songcheat) {
      // default values for optional properties
      songcheat.mode = songcheat.mode || 'rt';
      songcheat.lyricsMode = songcheat.lyricsMode || 's';
      songcheat.barsPerLine = songcheat.barsPerLine || 4;
      songcheat.signature = songcheat.signature || {};
      songcheat.signature.key = songcheat.signature.key || 'C';
      songcheat.signature.time = songcheat.signature.time || { beatDuration: ':q', beatsPerBar: 4, symbol: '4/4' };
      songcheat.lyricsUnit = songcheat.lyricsUnit || songcheat.signature.time.beatDuration;
      songcheat.chords = songcheat.chords || [];
      songcheat.rhythms = songcheat.rhythms || [];
      songcheat.parts = songcheat.parts || [];

      // deduce bar duration from signature
      songcheat.barDuration = songcheat.signature.time.beatsPerBar * Utils.duration(songcheat.signature.time.beatDuration);

      // resolve all id references (rhythms and chords)
      this.resolveIds(songcheat);

      // default structure if not specified : one unit for each part
      if (!songcheat.structure) {
        songcheat.structure = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = songcheat.parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var part = _step.value;
            songcheat.structure.push({ 'part': part });
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }

      // give a name to each unit if not already set = name of part with automatic numbering
      var unitsByPart = {};
      var numberByPart = {};
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = songcheat.structure[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var unit = _step2.value;
          unitsByPart[unit.part.id] = typeof unitsByPart[unit.part.id] === 'undefined' ? 1 : unitsByPart[unit.part.id] + 1;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = songcheat.structure[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _unit = _step3.value;

          numberByPart[_unit.part.id] = typeof numberByPart[_unit.part.id] === 'undefined' ? 1 : numberByPart[_unit.part.id] + 1;
          if (!_unit.name) _unit.name = _unit.part.name + (unitsByPart[_unit.part.id] > 1 ? ' ' + numberByPart[_unit.part.id] : '');
        }

        // give a color to each part if not already set
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var colors = ['red', '#06D6A0', 'blue', 'purple', 'orange', 'magenta'];
      var partIndex = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = songcheat.parts[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _part = _step4.value;
          if (!_part.color) _part.color = colors[partIndex++ % colors.length];
        }

        // validate and compile each rhythm
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = songcheat.rhythms[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var rhythm = _step5.value;
          this.compileRhythm(rhythm, songcheat.signature.time.beatDuration);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = songcheat.parts[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var _part2 = _step6.value;

          // compute a "chordChanges" property in each phrase
          var phraseIndex = 0;
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = _part2.phrases[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var phrase = _step7.value;

              phrase.chordChanges = [];
              var lastChord = null;
              var _iteratorNormalCompletion9 = true;
              var _didIteratorError9 = false;
              var _iteratorError9 = undefined;

              try {
                for (var _iterator9 = phrase.bars[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                  var bar = _step9.value;
                  lastChord = this.addChordChanges(bar, phrase.chordChanges, songcheat.barDuration, false, lastChord);
                }
              } catch (err) {
                _didIteratorError9 = true;
                _iteratorError9 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion9 && _iterator9.return) {
                    _iterator9.return();
                  }
                } finally {
                  if (_didIteratorError9) {
                    throw _iteratorError9;
                  }
                }
              }

              this.log('Phrase wise chord durations for phrase ' + _part2.name + '.' + (phraseIndex + 1));
              var _iteratorNormalCompletion10 = true;
              var _didIteratorError10 = false;
              var _iteratorError10 = undefined;

              try {
                for (var _iterator10 = phrase.chordChanges[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                  var c = _step10.value;
                  this.log('\t[' + c.chord.name + '] = ' + c.duration + ' units');
                } // compute a "chordChanges" property in each bar
              } catch (err) {
                _didIteratorError10 = true;
                _iteratorError10 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion10 && _iterator10.return) {
                    _iterator10.return();
                  }
                } finally {
                  if (_didIteratorError10) {
                    throw _iteratorError10;
                  }
                }
              }

              var barIndex = 0;
              var _iteratorNormalCompletion11 = true;
              var _didIteratorError11 = false;
              var _iteratorError11 = undefined;

              try {
                for (var _iterator11 = phrase.bars[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                  var _bar = _step11.value;

                  _bar.chordChanges = { 'bar': [], 'rhythm': [] };
                  var _arr = ['rhythm', 'bar'];
                  for (var _i = 0; _i < _arr.length; _i++) {
                    var chordChangesMode = _arr[_i];this.addChordChanges(_bar, _bar.chordChanges[chordChangesMode], songcheat.barDuration, chordChangesMode === 'bar');
                  }this.log('\tRythm wise chord durations for bar ' + _part2.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1));
                  var _iteratorNormalCompletion12 = true;
                  var _didIteratorError12 = false;
                  var _iteratorError12 = undefined;

                  try {
                    for (var _iterator12 = _bar.chordChanges['rhythm'][Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                      var _c = _step12.value;
                      this.log('\t\t[' + _c.chord.name + '] = ' + _c.duration + ' units');
                    }
                  } catch (err) {
                    _didIteratorError12 = true;
                    _iteratorError12 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion12 && _iterator12.return) {
                        _iterator12.return();
                      }
                    } finally {
                      if (_didIteratorError12) {
                        throw _iteratorError12;
                      }
                    }
                  }

                  this.log('\tBar wise chord durations for bar ' + _part2.name + '.' + (phraseIndex + 1) + '.' + (barIndex + 1));
                  var _iteratorNormalCompletion13 = true;
                  var _didIteratorError13 = false;
                  var _iteratorError13 = undefined;

                  try {
                    for (var _iterator13 = _bar.chordChanges['bar'][Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                      var _c2 = _step13.value;
                      this.log('\t\t[' + _c2.chord.name + '] = ' + _c2.duration + ' units');
                    }
                  } catch (err) {
                    _didIteratorError13 = true;
                    _iteratorError13 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion13 && _iterator13.return) {
                        _iterator13.return();
                      }
                    } finally {
                      if (_didIteratorError13) {
                        throw _iteratorError13;
                      }
                    }
                  }

                  barIndex++;
                }
              } catch (err) {
                _didIteratorError11 = true;
                _iteratorError11 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion11 && _iterator11.return) {
                    _iterator11.return();
                  }
                } finally {
                  if (_didIteratorError11) {
                    throw _iteratorError11;
                  }
                }
              }

              phraseIndex++;
            }

            // compute duration of part
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }

          _part2.duration = 0;
          var _iteratorNormalCompletion8 = true;
          var _didIteratorError8 = false;
          var _iteratorError8 = undefined;

          try {
            for (var _iterator8 = _part2.phrases[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
              var _phrase = _step8.value;
              var _iteratorNormalCompletion14 = true;
              var _didIteratorError14 = false;
              var _iteratorError14 = undefined;

              try {
                for (var _iterator14 = _phrase.bars[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                  var _bar2 = _step14.value;
                  _part2.duration += _bar2.rhythm.duration;
                }
              } catch (err) {
                _didIteratorError14 = true;
                _iteratorError14 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion14 && _iterator14.return) {
                    _iterator14.return();
                  }
                } finally {
                  if (_didIteratorError14) {
                    throw _iteratorError14;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError8 = true;
            _iteratorError8 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
              }
            } finally {
              if (_didIteratorError8) {
                throw _iteratorError8;
              }
            }
          }
        }

        // fluid API
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      return songcheat;
    }
  }, {
    key: 'resolveIds',
    value: function resolveIds(songcheat) {
      var unitIndex = 0;
      if (songcheat.structure) {
        var _iteratorNormalCompletion15 = true;
        var _didIteratorError15 = false;
        var _iteratorError15 = undefined;

        try {
          for (var _iterator15 = songcheat.structure[Symbol.iterator](), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
            var unit = _step15.value;

            if (!unit.part) throw new CompilerException('Part not defined for unit ' + (unitIndex + 1));

            // resolve part id
            var part = this.resolveId(songcheat.parts, unit.part);
            if (!part) throw new CompilerException('Part ' + unit.part + ' not found');
            unit.part = part;

            unitIndex++;
          }
        } catch (err) {
          _didIteratorError15 = true;
          _iteratorError15 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion15 && _iterator15.return) {
              _iterator15.return();
            }
          } finally {
            if (_didIteratorError15) {
              throw _iteratorError15;
            }
          }
        }
      }

      if (songcheat.parts) {
        var _iteratorNormalCompletion16 = true;
        var _didIteratorError16 = false;
        var _iteratorError16 = undefined;

        try {
          for (var _iterator16 = songcheat.parts[Symbol.iterator](), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
            var _part3 = _step16.value;

            if (!_part3.phrases) throw new CompilerException('Phrases not defined for part "' + _part3.name + '"');
            if (!(_part3.phrases instanceof Array)) throw new CompilerException('Phrases defined for part "' + _part3.name + '" must be an Array, found: ' + _typeof(songcheat.parts.phrases));

            var phraseIndex = 0;
            var _iteratorNormalCompletion17 = true;
            var _didIteratorError17 = false;
            var _iteratorError17 = undefined;

            try {
              for (var _iterator17 = _part3.phrases[Symbol.iterator](), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                var phrase = _step17.value;

                var barIndex = 0;
                var _iteratorNormalCompletion18 = true;
                var _didIteratorError18 = false;
                var _iteratorError18 = undefined;

                try {
                  for (var _iterator18 = phrase.bars[Symbol.iterator](), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                    var bar = _step18.value;

                    if (!bar.rhythm) throw new CompilerException('Rhythm not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + _part3.name);
                    if (!bar.chords) throw new CompilerException('Chords not defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' of ' + _part3.name);
                    if (!(bar.chords instanceof Array)) throw new CompilerException('Chords defined for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1) + ' must be an Array, found: ' + _typeof(bar.chords));

                    // resolve rhythm id
                    var rhythm = this.resolveId(songcheat.rhythms, bar.rhythm);
                    if (!rhythm) throw new CompilerException('Rhythm ' + bar.rhythm + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1));
                    bar.rhythm = rhythm;

                    // resolved array of chord ids
                    var chords = [];
                    var _iteratorNormalCompletion19 = true;
                    var _didIteratorError19 = false;
                    var _iteratorError19 = undefined;

                    try {
                      for (var _iterator19 = bar.chords[Symbol.iterator](), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
                        var chordId = _step19.value;

                        // resolve chord id
                        var chord = this.resolveId(songcheat.chords, chordId);
                        if (!chord) throw new CompilerException('Chord ' + chordId + ' not found for bar ' + (barIndex + 1) + ' of phrase ' + (phraseIndex + 1));
                        chords.push(chord);
                      }
                    } catch (err) {
                      _didIteratorError19 = true;
                      _iteratorError19 = err;
                    } finally {
                      try {
                        if (!_iteratorNormalCompletion19 && _iterator19.return) {
                          _iterator19.return();
                        }
                      } finally {
                        if (_didIteratorError19) {
                          throw _iteratorError19;
                        }
                      }
                    }

                    bar.chords = chords;
                    barIndex++;
                  }
                } catch (err) {
                  _didIteratorError18 = true;
                  _iteratorError18 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion18 && _iterator18.return) {
                      _iterator18.return();
                    }
                  } finally {
                    if (_didIteratorError18) {
                      throw _iteratorError18;
                    }
                  }
                }

                phraseIndex++;
              }
            } catch (err) {
              _didIteratorError17 = true;
              _iteratorError17 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion17 && _iterator17.return) {
                  _iterator17.return();
                }
              } finally {
                if (_didIteratorError17) {
                  throw _iteratorError17;
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError16 = true;
          _iteratorError16 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion16 && _iterator16.return) {
              _iterator16.return();
            }
          } finally {
            if (_didIteratorError16) {
              throw _iteratorError16;
            }
          }
        }
      }
    }
  }, {
    key: 'resolveId',
    value: function resolveId(collection, id) {
      if (collection) {
        var _iteratorNormalCompletion20 = true;
        var _didIteratorError20 = false;
        var _iteratorError20 = undefined;

        try {
          for (var _iterator20 = collection[Symbol.iterator](), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
            var i = _step20.value;
            if (i.id === id) return i;
          }
        } catch (err) {
          _didIteratorError20 = true;
          _iteratorError20 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion20 && _iterator20.return) {
              _iterator20.return();
            }
          } finally {
            if (_didIteratorError20) {
              throw _iteratorError20;
            }
          }
        }
      }
      return null;
    }
  }, {
    key: 'compileRhythm',
    value: function compileRhythm(rhythm, initialNoteDuration) {
      this.log('Compiling rhythm ' + rhythm.id + ' with score "' + rhythm.score + '"');

      // default note duration, until changed
      var noteDuration = initialNoteDuration;

      // take not of each placeholder's index, so we can later fetch the associated chord
      rhythm.placeholdercount = 0;

      // for locating syntax errors in message
      var position = 1;
      var lastToken = null;

      // compile the score string into an array of objects
      rhythm.compiledScore = [];
      var _iteratorNormalCompletion21 = true;
      var _didIteratorError21 = false;
      var _iteratorError21 = undefined;

      try {
        for (var _iterator21 = rhythm.score.split(/((?::(?:w|h|q|8|16|32)d?)|\(#\)|T?\s*\([^(]*\)[^()\sT:]*)/)[Symbol.iterator](), _step21; !(_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done); _iteratorNormalCompletion21 = true) {
          var token = _step21.value;

          if (token = token.trim()) {
            var match = null;
            if (match = token.match(/^(:(?:w|h|q|8|16|32)d?)$/)) {
              // duration: change note duration to use next
              noteDuration = Utils.duration(match[1]);
            } else if (match = token.match(/^\(#\)$/)) {
              // rest
              rhythm.compiledScore.push({ rest: true, duration: noteDuration, tied: false, strings: false, flags: {}, placeholderIndex: rhythm.placeholdercount++ });
            } else if (match = token.match(/^(T?)\s*\(([^(]*)\)([^()\s]*)$/)) {
              // chord placeholder
              var tied = match[1] === 'T';

              // strings = between parentheses
              var strings = match[2];
              if (strings === '') strings = '*'; // an empty string is a shortcut for "*"
              if (strings === 'x') strings = '*x'; // a x alone is a shortcut for "*x"
              if (!strings.match(/^(?:(\*x?)|((?:(?:B|B'|1|2|3|4|5|6)x?)+))$/)) throw new CompilerException('Invalid syntax found in chord placeholder: ' + strings);

              // flags = after parentheses
              var flagsString = match[3];
              var flags = { stroke: null, accent: false, pm: false, fingering: null };
              var _iteratorNormalCompletion23 = true;
              var _didIteratorError23 = false;
              var _iteratorError23 = undefined;

              try {
                for (var _iterator23 = flagsString.split(/(dd?|uu?|>|PM|[pima]+)/)[Symbol.iterator](), _step23; !(_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done); _iteratorNormalCompletion23 = true) {
                  var flag = _step23.value;

                  if (flag.trim()) {
                    if (flag.match(/^(dd?|uu?)$/g)) {
                      // stroke mode
                      if (flags.fingering) throw new CompilerException('Fingering (' + flags.fingering + ') and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token);
                      if (flags.pm) throw new CompilerException('Palm muting (PM) and stroke (' + flag + ') cannot be both defined for the chord placeholder: ' + token);
                      if (flags.stroke) throw new CompilerException('More than one stroke mode (d, u, dd, uu) defined for the chord placeholder: ' + token);
                      flags.stroke = flag;
                    } else if (flag.match(/^[pima]+$/)) {
                      // PIMA fingering
                      if (flags.stroke) throw new CompilerException('Stroke (' + flags.stroke + ') and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token);
                      if (flags.pm) throw new CompilerException('Palm muting (PM) and fingering (' + flag + ') cannot be both defined for the chord placeholder: ' + token);
                      if (flags.fingering) throw new CompilerException('More than one fingering (pima) defined for the chord placeholder: ' + token);
                      flags.fingering = flag;
                    } else if (flag.match(/^PM$/)) {
                      // palm muting
                      if (flags.stroke) throw new CompilerException('Stroke (' + flags.stroke + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token);
                      if (flags.fingering) throw new CompilerException('Fingering (' + flags.fingering + ') and palm muting (' + flag + ') cannot be both defined for the chord placeholder: ' + token);
                      if (flags.pm) throw new CompilerException('More than one palm muting (PM) defined for the chord placeholder: ' + token);
                      flags.pm = true;
                    } else if (flag.match(/^>$/)) {
                      // accent
                      if (flags.accent) throw new CompilerException('More than one accent (>) defined for the same placeholder: ' + token);
                      flags.accent = true;
                    } else throw new CompilerException('Invalid flag "' + flag + '" defined for chord placeholder "' + token + '"');
                  }
                }

                // add a note
              } catch (err) {
                _didIteratorError23 = true;
                _iteratorError23 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion23 && _iterator23.return) {
                    _iterator23.return();
                  }
                } finally {
                  if (_didIteratorError23) {
                    throw _iteratorError23;
                  }
                }
              }

              rhythm.compiledScore.push({ rest: false, duration: noteDuration, tied: tied, strings: strings, flags: flags, placeholderIndex: rhythm.placeholdercount++ });
            } else throw new CompilerException('Invalid token "' + token + '" in rhythm score definition at position ' + position + (lastToken ? ' (after "' + lastToken + '")' : ''));

            lastToken = token;
          }

          position += token.length;
        }

        // compute total rhythm duration
      } catch (err) {
        _didIteratorError21 = true;
        _iteratorError21 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion21 && _iterator21.return) {
            _iterator21.return();
          }
        } finally {
          if (_didIteratorError21) {
            throw _iteratorError21;
          }
        }
      }

      rhythm.duration = 0;
      var _iteratorNormalCompletion22 = true;
      var _didIteratorError22 = false;
      var _iteratorError22 = undefined;

      try {
        for (var _iterator22 = rhythm.compiledScore[Symbol.iterator](), _step22; !(_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done); _iteratorNormalCompletion22 = true) {
          var o = _step22.value;
          rhythm.duration += o.duration;
        }
      } catch (err) {
        _didIteratorError22 = true;
        _iteratorError22 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion22 && _iterator22.return) {
            _iterator22.return();
          }
        } finally {
          if (_didIteratorError22) {
            throw _iteratorError22;
          }
        }
      }
    }
  }, {
    key: 'addChordChanges',
    value: function addChordChanges(bar, chordChanges, barDuration, resetAtBars, lastChord) {
      // ensure number of chords match number of placeholders in rhythm score, by repeating last chord
      if (bar.chords.length < 1) throw new CompilerException('chords must contain at least 1 entry, but ' + bar.chords.length + ' were found');
      while (bar.chords.length < bar.rhythm.placeholdercount) {
        bar.chords.push(bar.chords[bar.chords.length - 1]);
      }var offset = 0;
      var _iteratorNormalCompletion24 = true;
      var _didIteratorError24 = false;
      var _iteratorError24 = undefined;

      try {
        for (var _iterator24 = bar.rhythm.compiledScore[Symbol.iterator](), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
          var note = _step24.value;

          // get chord corresponding to the placeholder position
          var chord = bar.chords[note.placeholderIndex];
          if (!chord) throw new CompilerException('No chord found for placeholder ' + (note.placeholderIndex + 1));

          // same chord as before and not a new bar: increment duration with this new note
          if (lastChord === chord && offset % barDuration !== 0) chordChanges[chordChanges.length - 1].duration += note.duration;

          // chord changed: new duration starts with one note of the new chord
          // unless requested to reset chords at bars, chord change will be hidden if still the same as before
          else chordChanges.push({ chord: chord, duration: note.duration, hidden: lastChord === chord && !resetAtBars });

          lastChord = chord;
          offset += note.duration;
        }
      } catch (err) {
        _didIteratorError24 = true;
        _iteratorError24 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion24 && _iterator24.return) {
            _iterator24.return();
          }
        } finally {
          if (_didIteratorError24) {
            throw _iteratorError24;
          }
        }
      }

      return lastChord;
    }
  }, {
    key: 'parseLyrics',
    value: function parseLyrics(unit, defaultCursorStep, barDuration) {
      var warnings = [];
      var offset = 0;

      // remove DOS newlines
      unit.lyrics = (unit.lyrics || '').replace(/\r/g, '');

      // split lyrics into word groups, split occurs at cursor forward instructions (colons, durations and bars)
      unit.groups = [];
      var _iteratorNormalCompletion25 = true;
      var _didIteratorError25 = false;
      var _iteratorError25 = undefined;

      try {
        for (var _iterator25 = unit.lyrics.split(/((?::(?:w|h|q|8|16|32)d?)?:|\|)/)[Symbol.iterator](), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
          var part = _step25.value;
          // nb: split with capture groups only works in decent browsers, e.g. IE10+
          var match = null;
          // move cursor forward by given or default step duration
          if (match = part.match(/(:(?:w|h|q|8|16|32)d?)?:/)) offset = this.registerGroup(unit, offset, match[1] ? Utils.duration(match[1]) : defaultCursorStep, barDuration);

          // move cursor to begin of next bar
          else if (part.match(/\|/)) offset = this.registerGroup(unit, offset, barDuration - offset % barDuration, barDuration);

            // (non empty) word group (waiting for its duration)
            else if (part.length > 0) unit.groups.push({ text: part, offset: offset, duration: 0 });
        }

        // simulate a final bar if last group still open (no duration), i.e. if lyrics do not end on a : or |
      } catch (err) {
        _didIteratorError25 = true;
        _iteratorError25 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion25 && _iterator25.return) {
            _iterator25.return();
          }
        } finally {
          if (_didIteratorError25) {
            throw _iteratorError25;
          }
        }
      }

      if (unit.groups.length && unit.groups[unit.groups.length - 1].duration === 0) offset = this.registerGroup(unit, offset, barDuration - offset % barDuration, barDuration);

      // get missing duration and complete with empty groups if needed (offset now contains the total duration of all groups)
      var missingDuration = unit.part.duration - offset;
      this.log('[' + unit.name + '] Missing duration = ' + missingDuration + ' units (' + unit.part.duration + ' - ' + offset + ') = ' + missingDuration / barDuration + ' bars missing');
      if (missingDuration < 0) warnings.push('Lyrics contain ' + Math.floor(-missingDuration / barDuration) + ' bar(s)' + (-missingDuration % barDuration ? ' and ' + Utils.durationcodes(-missingDuration % barDuration) : '') + ' in excess');
      offset = this.registerGroup(unit, offset, missingDuration, barDuration);

      var _iteratorNormalCompletion26 = true;
      var _didIteratorError26 = false;
      var _iteratorError26 = undefined;

      try {
        for (var _iterator26 = unit.groups[Symbol.iterator](), _step26; !(_iteratorNormalCompletion26 = (_step26 = _iterator26.next()).done); _iteratorNormalCompletion26 = true) {
          var group = _step26.value;

          // compute length of group (in chars), adding 1 so the group having max density is not collated with next group
          var groupLength = this.getGroupLength(group) + 1;

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
      } catch (err) {
        _didIteratorError26 = true;
        _iteratorError26 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion26 && _iterator26.return) {
            _iterator26.return();
          }
        } finally {
          if (_didIteratorError26) {
            throw _iteratorError26;
          }
        }
      }

      unit.pmax = 0;
      var _iteratorNormalCompletion27 = true;
      var _didIteratorError27 = false;
      var _iteratorError27 = undefined;

      try {
        for (var _iterator27 = unit.groups[Symbol.iterator](), _step27; !(_iteratorNormalCompletion27 = (_step27 = _iterator27.next()).done); _iteratorNormalCompletion27 = true) {
          var _group = _step27.value;
          unit.pmax = Math.max(unit.pmax, _group.p);
        } // iterate on each phrase wise chord change and find the associated group
      } catch (err) {
        _didIteratorError27 = true;
        _iteratorError27 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion27 && _iterator27.return) {
            _iterator27.return();
          }
        } finally {
          if (_didIteratorError27) {
            throw _iteratorError27;
          }
        }
      }

      offset = 0;
      var _iteratorNormalCompletion28 = true;
      var _didIteratorError28 = false;
      var _iteratorError28 = undefined;

      try {
        for (var _iterator28 = unit.part.phrases[Symbol.iterator](), _step28; !(_iteratorNormalCompletion28 = (_step28 = _iterator28.next()).done); _iteratorNormalCompletion28 = true) {
          var phrase = _step28.value;
          var _iteratorNormalCompletion31 = true;
          var _didIteratorError31 = false;
          var _iteratorError31 = undefined;

          try {
            for (var _iterator31 = phrase.chordChanges[Symbol.iterator](), _step31; !(_iteratorNormalCompletion31 = (_step31 = _iterator31.next()).done); _iteratorNormalCompletion31 = true) {
              var chordDuration = _step31.value;

              // find closest group starting at or before chord offset
              var _group3 = null;
              var _iteratorNormalCompletion32 = true;
              var _didIteratorError32 = false;
              var _iteratorError32 = undefined;

              try {
                for (var _iterator32 = unit.groups[Symbol.iterator](), _step32; !(_iteratorNormalCompletion32 = (_step32 = _iterator32.next()).done); _iteratorNormalCompletion32 = true) {
                  var g = _step32.value;
                  if (g.offset <= offset) _group3 = g;
                }
              } catch (err) {
                _didIteratorError32 = true;
                _iteratorError32 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion32 && _iterator32.return) {
                    _iterator32.return();
                  }
                } finally {
                  if (_didIteratorError32) {
                    throw _iteratorError32;
                  }
                }
              }

              if (!_group3) throw new Error('No closest group found for chord ' + chordDuration.chord.name + ' with offset ' + offset + ' units');

              // register chord change in group
              _group3.chordChanges['phrase'].push({ offset: offset, text: this.getChordDisplay(chordDuration) });

              offset += chordDuration.duration;
            }
          } catch (err) {
            _didIteratorError31 = true;
            _iteratorError31 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion31 && _iterator31.return) {
                _iterator31.return();
              }
            } finally {
              if (_didIteratorError31) {
                throw _iteratorError31;
              }
            }
          }
        }

        // iterate on each bar wise chord change and find the associated group
      } catch (err) {
        _didIteratorError28 = true;
        _iteratorError28 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion28 && _iterator28.return) {
            _iterator28.return();
          }
        } finally {
          if (_didIteratorError28) {
            throw _iteratorError28;
          }
        }
      }

      offset = { 'rhythm': 0, 'bar': 0 };
      var _iteratorNormalCompletion29 = true;
      var _didIteratorError29 = false;
      var _iteratorError29 = undefined;

      try {
        for (var _iterator29 = unit.part.phrases[Symbol.iterator](), _step29; !(_iteratorNormalCompletion29 = (_step29 = _iterator29.next()).done); _iteratorNormalCompletion29 = true) {
          var _phrase2 = _step29.value;
          var _iteratorNormalCompletion33 = true;
          var _didIteratorError33 = false;
          var _iteratorError33 = undefined;

          try {
            for (var _iterator33 = _phrase2.bars[Symbol.iterator](), _step33; !(_iteratorNormalCompletion33 = (_step33 = _iterator33.next()).done); _iteratorNormalCompletion33 = true) {
              var bar = _step33.value;
              var _arr2 = ['rhythm', 'bar'];

              for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
                var chordChangesMode = _arr2[_i2];var _iteratorNormalCompletion34 = true;
                var _didIteratorError34 = false;
                var _iteratorError34 = undefined;

                try {
                  for (var _iterator34 = bar.chordChanges[chordChangesMode][Symbol.iterator](), _step34; !(_iteratorNormalCompletion34 = (_step34 = _iterator34.next()).done); _iteratorNormalCompletion34 = true) {
                    var _chordDuration = _step34.value;

                    // find closest group starting at or before chord offset
                    var _group4 = null;
                    var _iteratorNormalCompletion35 = true;
                    var _didIteratorError35 = false;
                    var _iteratorError35 = undefined;

                    try {
                      for (var _iterator35 = unit.groups[Symbol.iterator](), _step35; !(_iteratorNormalCompletion35 = (_step35 = _iterator35.next()).done); _iteratorNormalCompletion35 = true) {
                        var _g = _step35.value;
                        if (_g.offset <= offset[chordChangesMode]) _group4 = _g;
                      }
                    } catch (err) {
                      _didIteratorError35 = true;
                      _iteratorError35 = err;
                    } finally {
                      try {
                        if (!_iteratorNormalCompletion35 && _iterator35.return) {
                          _iterator35.return();
                        }
                      } finally {
                        if (_didIteratorError35) {
                          throw _iteratorError35;
                        }
                      }
                    }

                    if (!_group4) throw new Error('No closest group found for chord ' + _chordDuration.chord.name + ' with offset ' + offset[chordChangesMode] + ' units');

                    // register chord change in group
                    _group4.chordChanges[chordChangesMode].push({ offset: offset[chordChangesMode], text: this.getChordDisplay(_chordDuration) });

                    offset[chordChangesMode] += _chordDuration.duration;
                  }
                } catch (err) {
                  _didIteratorError34 = true;
                  _iteratorError34 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion34 && _iterator34.return) {
                      _iterator34.return();
                    }
                  } finally {
                    if (_didIteratorError34) {
                      throw _iteratorError34;
                    }
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError33 = true;
            _iteratorError33 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion33 && _iterator33.return) {
                _iterator33.return();
              }
            } finally {
              if (_didIteratorError33) {
                throw _iteratorError33;
              }
            }
          }
        }

        // debug info
      } catch (err) {
        _didIteratorError29 = true;
        _iteratorError29 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion29 && _iterator29.return) {
            _iterator29.return();
          }
        } finally {
          if (_didIteratorError29) {
            throw _iteratorError29;
          }
        }
      }

      var debugText = 'Groups of unit [' + unit.name + ']:\n';
      var barIndex = 0;
      var zeroDuration = false;
      var _iteratorNormalCompletion30 = true;
      var _didIteratorError30 = false;
      var _iteratorError30 = undefined;

      try {
        for (var _iterator30 = unit.groups[Symbol.iterator](), _step30; !(_iteratorNormalCompletion30 = (_step30 = _iterator30.next()).done); _iteratorNormalCompletion30 = true) {
          var _group2 = _step30.value;

          debugText += '\tBar ' + (barIndex + 1) + '\t[' + _group2.text.replace(/\n/g, '\\N') + ']:' + _group2.duration + ' (' + _group2.offset + ' - ' + (_group2.offset + _group2.duration) + ') L=' + this.getGroupLength(_group2) + " L'=" + _group2.plen + ' ρ=' + _group2.p.toFixed(2) + ' #Chord changes %bar= ' + _group2.chordChanges['bar'].length + ' %phrase= ' + _group2.chordChanges['phrase'].length;
          if (_group2.duration === 0) zeroDuration = true;
          if (_group2.bar) {
            barIndex++;
            debugText += ' | ';
          }
          debugText += '\n';
        }
      } catch (err) {
        _didIteratorError30 = true;
        _iteratorError30 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion30 && _iterator30.return) {
            _iterator30.return();
          }
        } finally {
          if (_didIteratorError30) {
            throw _iteratorError30;
          }
        }
      }

      debugText += 'ρ max = ' + unit.pmax.toFixed(2);
      this.log(debugText);

      if (zeroDuration) throw new Error('Detected group with 0 duration');

      return warnings;
    }
  }, {
    key: 'getUnitText',
    value: function getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
      var unitText = '';

      // concatenate lyrics groups, giving them a number of positions proprtional to their duration
      var barIndex = 0;
      var groupIndex = 0;
      var _iteratorNormalCompletion36 = true;
      var _didIteratorError36 = false;
      var _iteratorError36 = undefined;

      try {
        for (var _iterator36 = unit.groups[Symbol.iterator](), _step36; !(_iteratorNormalCompletion36 = (_step36 = _iterator36.next()).done); _iteratorNormalCompletion36 = true) {
          var group = _step36.value;

          // where and on how many positions will this group be displayed
          group.position = [].concat(toConsumableArray(unitText.replace(/\n/g, ''))).length;
          group.length = Math.ceil(group.duration * unit.pmax);

          // an hyphen means a word has been cut in two, no need for a space before next group
          // but if the final character should be a bar, then always count this extra character
          var needFinalSpace = group.bar || !group.text.match(/-$/);

          // if maxConsecutiveSpaces is set, set a maximum for the number of allowed positions if needed
          var maxLength = null;
          if (maxConsecutiveSpaces > 0) maxLength = this.getGroupLength(group) + maxConsecutiveSpaces - (needFinalSpace ? 0 : 1);
          if (maxLength) group.length = Math.min(group.length, maxLength);

          // but if group has associated chords, we must have enough space for them (and this has priority over maxConsecutiveSpaces)
          var minLength = group.bar ? 1 : 0; // 1 for the final bar sign if any
          if (group.chordChanges[chordChangesMode]) {
            for (var i = 0; i < group.chordChanges[chordChangesMode].length; i++) {
              minLength += group.chordChanges[chordChangesMode][i].text.length;
            }
          }
          minLength = Math.max(this.getGroupLength(group) + (needFinalSpace ? 1 : 0), minLength);
          group.length = Math.max(group.length, minLength);

          // filler string used to reach that length (nb: filler will always have a length of at least 1)
          var filler = Utils.spaces(group.length - this.getGroupLength(group), showDots || this.DEBUG ? '.' : ' ');

          // replace last character of filler by a | if this is the end of a bar
          filler = filler.replace(/(.)$/, group.bar ? split > 0 && (barIndex + 1) % split === 0 ? '|\n' : '|' : this.DEBUG ? '*' : '$1');

          // append filler to text, remove new lines if splitting at bars
          var groupText = (split > 0 ? group.text.replace(/\n/g, '') : group.text) + filler;

          this.log('[' + unit.name + '] Display group ' + (groupIndex + 1) + ' "' + groupText.replace(/\n/g, '\\N') + '" on ' + group.length + ' chars (CEIL ' + (group.duration * unit.pmax).toFixed(2) + ' MIN ' + minLength + ' MAX ' + (maxLength || 'n/a') + ')');
          unitText += groupText;

          groupIndex++;
          if (group.bar) barIndex++;
        }

        // we weren't asked to add chords
      } catch (err) {
        _didIteratorError36 = true;
        _iteratorError36 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion36 && _iterator36.return) {
            _iterator36.return();
          }
        } finally {
          if (_didIteratorError36) {
            throw _iteratorError36;
          }
        }
      }

      if (!chordChangesMode) return unitText;

      // build chord inserts, based on bar or phrase wise changes, each with the text and position where to insert
      var chordInserts = [];
      var _iteratorNormalCompletion37 = true;
      var _didIteratorError37 = false;
      var _iteratorError37 = undefined;

      try {
        for (var _iterator37 = unit.groups[Symbol.iterator](), _step37; !(_iteratorNormalCompletion37 = (_step37 = _iterator37.next()).done); _iteratorNormalCompletion37 = true) {
          var _group5 = _step37.value;

          var lengthStillToPlaceOnThisGroup = 0;
          var lengthYetPlacedOnThisGroup = 0;

          // compute length of all chord inserts
          var _iteratorNormalCompletion40 = true;
          var _didIteratorError40 = false;
          var _iteratorError40 = undefined;

          try {
            for (var _iterator40 = _group5.chordChanges[chordChangesMode][Symbol.iterator](), _step40; !(_iteratorNormalCompletion40 = (_step40 = _iterator40.next()).done); _iteratorNormalCompletion40 = true) {
              var chordChange = _step40.value;
              lengthStillToPlaceOnThisGroup += chordChange.text.length;
            }
          } catch (err) {
            _didIteratorError40 = true;
            _iteratorError40 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion40 && _iterator40.return) {
                _iterator40.return();
              }
            } finally {
              if (_didIteratorError40) {
                throw _iteratorError40;
              }
            }
          }

          var _iteratorNormalCompletion41 = true;
          var _didIteratorError41 = false;
          var _iteratorError41 = undefined;

          try {
            for (var _iterator41 = _group5.chordChanges[chordChangesMode][Symbol.iterator](), _step41; !(_iteratorNormalCompletion41 = (_step41 = _iterator41.next()).done); _iteratorNormalCompletion41 = true) {
              var _chordChange = _step41.value;

              // position of the chord will be the position of the group + length corresponding to offset delta
              var positionDelta = Math.ceil((_chordChange.offset - _group5.offset) / _group5.duration * _group5.length);
              var positionDelta_ = positionDelta;

              // ensure that chord name will not cross end of group it belongs to (last char of group must not be overwritten either if it is a bar)
              while (positionDelta + lengthStillToPlaceOnThisGroup > _group5.length - (_group5.bar ? 1 : 0)) {
                positionDelta--;
              }

              // ensure that chords already there still have enough room
              while (positionDelta - lengthYetPlacedOnThisGroup < 0) {
                positionDelta++;
              }

              this.log('Closest group "' + _group5.text.replace(/\n/g, '\\n') + '" with offset ' + _group5.offset + ' and position ' + _group5.position + ' found for ' + _chordChange.text.trim() + ' with offset ' + _chordChange.offset + ' units\n\tposition delta from group start = ' + positionDelta + ' chars (initially ' + positionDelta_ + ' chars)');
              chordInserts.push({ text: _chordChange.text, offset: _chordChange.offset, position: _group5.position + positionDelta });

              lengthYetPlacedOnThisGroup = positionDelta + _chordChange.text.length;
              lengthStillToPlaceOnThisGroup -= _chordChange.text.length;
            }
          } catch (err) {
            _didIteratorError41 = true;
            _iteratorError41 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion41 && _iterator41.return) {
                _iterator41.return();
              }
            } finally {
              if (_didIteratorError41) {
                throw _iteratorError41;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError37 = true;
        _iteratorError37 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion37 && _iterator37.return) {
            _iterator37.return();
          }
        } finally {
          if (_didIteratorError37) {
            throw _iteratorError37;
          }
        }
      }

      var _iteratorNormalCompletion38 = true;
      var _didIteratorError38 = false;
      var _iteratorError38 = undefined;

      try {
        for (var _iterator38 = chordInserts[Symbol.iterator](), _step38; !(_iteratorNormalCompletion38 = (_step38 = _iterator38.next()).done); _iteratorNormalCompletion38 = true) {
          var chordInsert = _step38.value;
          this.log('[' + unit.name + '] Should insert ' + chordInsert.text + ' @ ' + chordInsert.offset + ' units / ' + chordInsert.position + ' chars');
        } // insert these chord inserts
      } catch (err) {
        _didIteratorError38 = true;
        _iteratorError38 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion38 && _iterator38.return) {
            _iterator38.return();
          }
        } finally {
          if (_didIteratorError38) {
            throw _iteratorError38;
          }
        }
      }

      var position = 0;
      var skip = 0;
      var unitText_ = unitText;
      var chordText = '';
      unitText = '';
      var _iteratorNormalCompletion39 = true;
      var _didIteratorError39 = false;
      var _iteratorError39 = undefined;

      try {
        for (var _iterator39 = unitText_[Symbol.iterator](), _step39; !(_iteratorNormalCompletion39 = (_step39 = _iterator39.next()).done); _iteratorNormalCompletion39 = true) {
          var char = _step39.value;

          if (char === '\n') {
            unitText += '\n';
            chordText += '\n';
            skip = 0;
          } else {
            var _iteratorNormalCompletion42 = true;
            var _didIteratorError42 = false;
            var _iteratorError42 = undefined;

            try {
              for (var _iterator42 = chordInserts[Symbol.iterator](), _step42; !(_iteratorNormalCompletion42 = (_step42 = _iterator42.next()).done); _iteratorNormalCompletion42 = true) {
                var _chordInsert = _step42.value;

                if (!_chordInsert.inserted) {
                  if (_chordInsert.position <= position) {
                    this.log('[' + unit.name + '] Inserting ' + _chordInsert.text + ' @ ' + position + ' chars');
                    chordText += _chordInsert.text;
                    _chordInsert.inserted = true;
                    skip = _chordInsert.text.length;
                  }
                }
              }
            } catch (err) {
              _didIteratorError42 = true;
              _iteratorError42 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion42 && _iterator42.return) {
                  _iterator42.return();
                }
              } finally {
                if (_didIteratorError42) {
                  throw _iteratorError42;
                }
              }
            }

            position++;

            // add char to unit text, and corresponding space to chord text
            // only bar symbols are added in chord text instead of unit text (if showing dots, then bars are displayed in both texts)
            if (skip === 0) {
              chordText += char === '|' ? char : ' ';
            } else {
              skip--;
            }
            unitText += char === '|' && !(showDots || this.DEBUG) ? ' ' : char;
          }
        }

        // and interlace the two strings
      } catch (err) {
        _didIteratorError39 = true;
        _iteratorError39 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion39 && _iterator39.return) {
            _iterator39.return();
          }
        } finally {
          if (_didIteratorError39) {
            throw _iteratorError39;
          }
        }
      }

      return Utils.interlace(chordText, unitText, null, KEEP_EMPTY_LINES);
    }
  }, {
    key: 'registerGroup',
    value: function registerGroup(unit, offset, step, barDuration) {
      if (!barDuration) throw new Error('Invalid bar duration passed to registerGroup');

      while (step > 0) {
        // duration added to preceding group may never be more than what's left until end of bar
        var addDuration = Math.min(step, barDuration - offset % barDuration);

        // create a new group if none or if preceding already got its duration
        if (!unit.groups.length || !LYRICS_SUM_DURATIONS && unit.groups[unit.groups.length - 1].duration > 0) unit.groups.push({ text: '', offset: offset, duration: 0 });

        // add this duration to preceding group (create it if needed)
        unit.groups[unit.groups.length - 1].duration += addDuration;
        offset += addDuration;
        step -= addDuration;

        // step is going to cross end of bar: directly create a first empty group
        if (step > 0) unit.groups.push({ text: this.DEBUG > 1 ? '_' : '', offset: offset, duration: 0 });
      }

      return offset;
    }
  }, {
    key: 'getGroupLength',
    value: function getGroupLength(group) {
      // return the number of visible graphemes in group text
      // - newlines are not counted
      // - tabs will be converted to spaces and may thus count as 1
      // - use spread operator to correctly count astral unicode symbols
      return [].concat(toConsumableArray(group.text.replace(/\n/g, ''))).length;
    }
  }, {
    key: 'getChordDisplay',
    value: function getChordDisplay(chordDuration) {
      // space and not empty if hidden, to ensure that a white space will show that this change does not happen at the begin of the bar
      if (chordDuration.hidden) return ' ';

      // a space prevents chord names to be glued together on group and prevents a next group from starting directly after last chord of previous group
      return chordDuration.chord.name + ' ';
    }
  }]);
  return Compiler_;
}();

/**
 * Public API
 */

var Compiler = function () {
  function Compiler(songcheat, DEBUG) {
    classCallCheck(this, Compiler);

    this.compiler_ = new Compiler_(DEBUG);
    if (songcheat) this.set(songcheat);
  }

  createClass(Compiler, [{
    key: 'set',
    value: function set$$1(songcheat) {
      this.compiler_.log(Utils.title('COMPILE SONGCHEAT'));
      this.scc = this.compiler_.compile(JSON.parse(JSON.stringify(songcheat)));
    }
  }, {
    key: 'parseLyrics',
    value: function parseLyrics(unit) {
      this.compiler_.log(Utils.title('PARSE LYRICS ' + unit.name));
      return this.compiler_.parseLyrics(unit, Utils.duration(this.scc.lyricsUnit), this.scc.barDuration);
    }
  }, {
    key: 'getUnitText',
    value: function getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
      this.compiler_.log(Utils.title('GET LYRICS TEXT ' + unit.name + ' (maxConsecutiveSpaces = ' + maxConsecutiveSpaces + ', split = ' + split + ', chordChangesMode = ' + chordChangesMode + ', showDots = ' + showDots + ')'));
      return this.compiler_.getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots);
    }
  }, {
    key: 'getPartText',
    value: function getPartText(part, maxConsecutiveSpaces, split, chordChangesMode, showDots) {
      // dummy unit with no lyrics
      var unit = { name: part.name, part: part };

      this.compiler_.log(Utils.title('PARSE PART LYRICS ' + unit.name));
      this.compiler_.parseLyrics(unit, Utils.duration(this.scc.lyricsUnit), this.scc.barDuration);

      this.compiler_.log(Utils.title('GET PART LYRICS TEXT ' + unit.name + ' (maxConsecutiveSpaces = ' + maxConsecutiveSpaces + ', split = ' + split + ', chordChangesMode = ' + chordChangesMode + ', showDots = ' + showDots + ')'));
      return this.compiler_.getUnitText(unit, maxConsecutiveSpaces, split, chordChangesMode, showDots);
    }
  }]);
  return Compiler;
}();

exports.Utils = Utils;
exports.Parser = Parser;
exports.ParserException = ParserException;
exports.Compiler = Compiler;
exports.CompilerException = CompilerException;
