/**
 * SongCheat Core 1.0.0 built on Tue Dec 26 2017 02:52:13 GMT+0100 (CET).
  * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>
 *
 * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-core
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

class Utils {
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

let DEBUG = 0;

class VexTabException {
  constructor (message) {
    this.message = message;
  }

  toString () {
    return 'VexTab error: ' + this.message
  }
}

class VexTab$1 {
  // build VexTab chord notation
  static Chord2VexTab (chord, strings, transpose) {
    var vextabchord = [];
    for (let o of Utils.chordStrings(chord, strings)) {
      vextabchord.push((o.mute ? 'X' : transpose + o.fret) + '/' + o.string);
    }
    return '(' + vextabchord.join('.') + ')'
  }

  static Note2VexTab (note, strokes, accents) {
    let vextab = '';

    // rest with given duration
    if (note.rest) vextab += Utils.durationcode(note.duration) + '#5#';

    else {
      // note duration, slashed if no chord given
      vextab += note.chord ? Utils.durationcode(note.duration) : Utils.durationcode(note.duration).replace(/(:(?:w|h|q|8|16|32))(d?)/g, '$1S$2');

      // if tied note
      if (note.tied) vextab += 'T';

      // chord or dummy note (for slash notation)
      vextab += !note.chord ? '(4/3)' : VexTab$1.Chord2VexTab(note.chord, note.strings, 0); // do not transpose with capo: chords are tabbed exactly as their diagrm says (author chooses to use capo'd chords or not)

      // stroke flag d or u (dd and uu are not built-in in vextab and are handled later through text2VexTab)
      if (strokes && note.flags.stroke && note.flags.stroke.length === 1) vextab += note.flags.stroke;

      // accent (put on top)
      if (accents && note.flags.accent) vextab += '$.a>/' + accents + '.$';
    }

    return vextab
  }

  static Notes2Stave (songcheat, offset, notes, strokes, accents, subtitle, hs, notation, tablature) {
    let vextab = '';
    let barDuration = songcheat.barDuration;

    console.log('Drawing ' + (notation ? 'notation ' : '') + (tablature ? 'tablature ' : '') + 'stave with ' + notes.length + ' notes');

    // start new stave with signature
    vextab += '\ntabstave notation=' + (notation ? 'true' : 'false') + ' tablature=' + (tablature ? 'true' : 'false') + '\n';
    vextab += 'tuning=' + songcheat.tuning + ' key=' + songcheat.signature.key + ' time=' + songcheat.signature.time.symbol + '\n';

    // add subtitle if first bar
    if (subtitle && offset === 0) vextab += 'text .' + hs + ',.font=Arial-10-bold,[' + subtitle + ']\n';

    vextab += 'notes ';

    // initial bar line if needed (double if first bar)
    if (offset % barDuration === 0) vextab += (offset === 0 ? '=||' : '|');

    // add each note, followed by a bar or phrase sign if needed
    for (let note of notes) {
      vextab += VexTab$1.Note2VexTab(note, strokes, accents);
      offset += note.duration;
      if (note.lastInPhrase && offset % barDuration !== 0) console.warn('Phrase matches no bar (' + Utils.durationcodes(barDuration - offset % barDuration) + ' away)');
      if (offset % barDuration === 0) vextab += note.lastInPhrase ? '=||' : '|';
    }

    return vextab + '\n'
  }

  static Text2VexTab (textGroups, barDuration, offset, staveDuration, h, font) {
    let text = '';

    // for groups that start within our range
    for (let group of textGroups) {
      if (group.offset >= offset + staveDuration) break
      if (group.offset >= offset) {
        let line = 'text ++,.' + h + ',.font=' + font;

        // initial bar line if needed
        if (offset % barDuration === 0) line += ',|';

        // add empty text groups to fill the gap between start of stave and start of group
        let gap = group.offset - offset;
        while (gap > 0) {
          // gap duration may never be more than what's left until end of bar
          let d = Math.min(gap, barDuration - (offset % barDuration));
          for (let code of Utils.durationcodes(d)) line += ',' + code + ', ';
          if ((offset + d) % barDuration === 0) line += ',|';

          // continue with remaining gap
          gap -= d;
        }

        // add actual text group on all available duration until end of stave (or more precisely the largest duration code which is <= available duration)
        let available = offset + staveDuration - group.offset;
        for (let code of Utils.durationcodes(available)) { line += ',' + code + ',' + (group.text.replace(/\n/g, '') || ' '); break }

        // remove trailing spaces and comma: vextab does not allow to finish on an empty word group
        text += line.replace(/[ ,]+$/, '') + '\n';
      }
    }

    return text
  }

  static Songcheat2VexTab (songcheat) {
    let vextab = '';
    let unitIndex = 0;
    for (let unit of songcheat.structure) {
      if (typeof songcheat.showUnitIndex === 'undefined' || songcheat.showUnitIndex === null || songcheat.showUnitIndex === unitIndex) {
        vextab += VexTab$1.Unit2VexTab(songcheat, unit, unitIndex) + '\n';
      }
      unitIndex++;
    }
    return vextab
  }

  static Unit2VexTab (songcheat, unit, unitIndex) {
    let stems = songcheat.mode.indexOf('s') >= 0;
    let showLyrics = songcheat.lyricsMode === 's';
    let barDuration = songcheat.barDuration;

    let vextab = 'options tempo=' + songcheat.signature.tempo + ' player=false tab-stems=' + (stems ? 'true' : 'false') + ' tab-stem-direction=up\n';
    unitIndex = unitIndex || 0;

    let staveDuration = 0;
    let notes = [];
    let notesSlashed = [];

    console.log('VexTabbing unit ' + (unitIndex + 1) + ' "' + unit.name + '"');

    // space before first unit and between units
    vextab += 'options space=' + (unitIndex > 0 && songcheat.showUnitIndex === null ? 50 : 20) + '\n';

    // get lyrics word groups
    let lyricsGroups = [];
    if (unit.groups) for (let group of unit.groups) lyricsGroups.push({ offset: group.offset, text: group.text + (DEBUG ? '/' + group.duration : '') });

    // get rhythm wise chord changes (same as ascii lyrics)
    let offset = 0;
    let chordGroups = [];
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let chordChange of bar.chordChanges['rhythm']) {
          chordGroups.push({ offset: offset, text: chordChange.chord.name + (DEBUG ? '/' + chordChange.duration : '') });
          offset += chordChange.duration;
        }
      }
    }

    // get PIMA and dd/uu word groups
    offset = 0;
    let fingeringGroups = [];
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let note of bar.rhythm.compiledScore) {
          if (note.flags.fingering) fingeringGroups.push({ offset: offset, text: note.flags.fingering.toLowerCase() });
          else if (note.flags.stroke && note.flags.stroke.length === 2) fingeringGroups.push({ offset: offset, text: note.flags.stroke === 'dd' ? '⤋' : '⤊' });
          offset += note.duration;
        }
      }
    }

    // get PM word groups
    offset = 0;
    let pmGroups = [];
    for (let phrase of unit.part.phrases) {
      for (let bar of phrase.bars) {
        for (let note of bar.rhythm.compiledScore) {
          if (note.flags.pm) pmGroups.push({ offset: offset, text: 'PM' });
          offset += note.duration;
        }
      }
    }

    // for each phrase in unit
    offset = 0;
    let phraseIndex = 0;
    for (let phrase of unit.part.phrases) {
      console.log('\tphrase ' + (phraseIndex + 1));
      let lastPhraseInPart = phraseIndex === unit.part.phrases.length - 1;

      // for each bar in phrase
      let barIndex = 0;
      for (let bar of phrase.bars) {
        console.log('\t\tbar ' + (barIndex + 1));
        let lastBarInPhrase = barIndex === phrase.bars.length - 1;

        // for each note in rhythm
        let noteIndex = 0;
        for (let note of bar.rhythm.compiledScore) {
          // note with no chord set (slash)
          let phraseNote = JSON.parse(JSON.stringify(note));
          phraseNote.lastInPhrase = lastBarInPhrase && noteIndex === bar.rhythm.compiledScore.length - 1;
          notesSlashed.push(phraseNote);

          // register note with corresponding chord
          let chordedPhraseNote = JSON.parse(JSON.stringify(phraseNote));
          chordedPhraseNote.chord = bar.chords[note.placeholderIndex];
          if (!chordedPhraseNote.chord) throw new VexTabException('No chord found for placeholder ' + (note.placeholderIndex + 1))
          notes.push(chordedPhraseNote);

          // draw staves when we have completed barsPerLine bars or if the part is done
          staveDuration += note.duration;
          let partDone = lastPhraseInPart && phraseNote.lastInPhrase;
          if (staveDuration >= songcheat.barsPerLine * barDuration || partDone) {
            console.log((partDone ? 'EOP' : 'EOL') + ' @ ' + staveDuration + ' units: drawing ' + notes.length + ' notes stave' + (songcheat.mode.length > 1 ? 's' : ''));

            // notation: shows unit.name, chords, accents, stems (slashes) and lyrics
            // if tablature is not displayed, it also shows strokes/fingering
            // it never shows PM and frets
            if (songcheat.mode.indexOf('r') >= 0) {
              let strokes = songcheat.mode.indexOf('t') < 0;
              vextab += VexTab$1.Notes2Stave(songcheat, offset, notesSlashed, strokes, 'top', unit.name, -1, true, false);
              if (strokes && fingeringGroups.length > 0) vextab += VexTab$1.Text2VexTab(fingeringGroups, barDuration, offset, staveDuration, 11, 'Arial-9-normal'); // PIMA on same line as strokes
              if (showLyrics && lyricsGroups.length > 0) vextab += VexTab$1.Text2VexTab(lyricsGroups, barDuration, offset, staveDuration, strokes ? 13 : 11, 'Times-11-italic');
              if (chordGroups.length > 0) vextab += VexTab$1.Text2VexTab(chordGroups, barDuration, offset, staveDuration, 2, 'Arial-10-normal');
              vextab += 'options space=' + (strokes ? 40 : 20) + '\n';
            }

            // tablature: shows PM, frets and strokes/fingering
            // if notation is not displayed, it also shows unit.name, chords, lyrics and stems (if mode "ts")
            // it never shows accents
            if (songcheat.mode.indexOf('t') >= 0) {
              if (stems) vextab += 'options space=' + 30 + '\n';
              vextab += VexTab$1.Notes2Stave(songcheat, offset, notes, true, false, songcheat.mode.indexOf('r') < 0 ? unit.name : false, stems ? -3 : -1, false, true);
              if (fingeringGroups.length > 0) vextab += VexTab$1.Text2VexTab(fingeringGroups, barDuration, offset, staveDuration, 10, 'Arial-9-normal'); // PIMA on same line as strokes
              if (pmGroups.length > 0) vextab += VexTab$1.Text2VexTab(pmGroups, barDuration, offset, staveDuration, 10, 'Arial-9-normal'); // PM on same line as strokes
              if (songcheat.mode.indexOf('r') < 0 && showLyrics && lyricsGroups.length > 0) vextab += VexTab$1.Text2VexTab(lyricsGroups, barDuration, offset, staveDuration, 12, 'Times-11-italic');
              if (songcheat.mode.indexOf('r') < 0 && chordGroups.length > 0) vextab += VexTab$1.Text2VexTab(chordGroups, barDuration, offset, staveDuration, stems ? -1 : 1, 'Arial-10-normal');
              vextab += 'options space=' + (songcheat.mode.indexOf('r') ? 30 : 10) + '\n';
            }

            // space after staves
            vextab += 'options space=' + 10 + '\n';

            // increment offset
            offset += staveDuration;

            // clear workspace
            notes = [];
            notesSlashed = [];
            staveDuration = 0;
          }

          // next note in rhythm
          noteIndex++;
        }

        // next bar in phrase
        barIndex++;
      }

      // next phrase in part
      phraseIndex++;
    }

    return vextab
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
    if (songcheat.structure) {
      for (let unit of songcheat.structure) {
        if (!unit.part) throw new CompilerException('Part not defined for unit ' + (unitIndex + 1))

      // resolve part id
        let part = this.resolveId(songcheat.parts, unit.part);
        if (!part) throw new CompilerException('Part ' + unit.part + ' not found')
        unit.part = part;

        unitIndex++;
      }
    }

    if (songcheat.parts) {
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

var samples = [
  {
    "artist": "Alain Bashung",
    "title": "Je t'ai manqué",
    "year": 2008,
    "difficulty": 3,
    "video": "https://www.youtube.com/watch?v=90HUdz87td4",
    "tutorial": "",
    "comment": "Chanson assez facile:\n- une seule ryhtmique (en shuffle)\n- uniquement des accords ouverts.\n\nChanter en même temps demande tout de même un peu d'exercice.",
    "tuning": "standard",
    "capo": 5,
    "signature": {
      "key": "G",
      "time": {"beatsPerBar": "4", "beatDuration": ":q", "symbol": "4/4"},
      "tempo": 146,
      "shuffle": ":8"
    },
    "chords": [
      {
        "id": 1,
        "name": "Am",
        "tablature": "x02210",
        "fingering": "T02310/-",
        "comment": ""
      },
      {
        "id": 2,
        "name": "E",
        "tablature": "022100",
        "fingering": "023100/-",
        "comment": ""
      },
      {
        "id": 3,
        "name": "C",
        "tablature": "x32010",
        "fingering": "T32010/-",
        "comment": ""
      },
      {
        "id": 4,
        "name": "G",
        "tablature": "320003",
        "fingering": "210003/-",
        "comment": "G with 3 fingers."
      },
      {
        "id": 5,
        "name": "Asus4",
        "tablature": "x02230",
        "fingering": "T02340/-",
        "comment": "Same as Am but adding finger 4 on fret 3 of B string."
      },
      {
        "id": 6,
        "name": "Cadd9",
        "tablature": "x3203x",
        "fingering": "T32040/-",
        "comment": "Same as C but adding finger 4 on fret 3 of B string."
      }
    ],
    "rhythms": [
      {"id": 1, "name": "R1", "score": ":8 ()d ()u ()d ()u T() ()u ()d ()u"},
      {"id": 2, "name": "R2", "score": ":h ()dd :h (#)"}
    ],
    "parts": [
      {
        "id": 1,
        "name": "Chorus",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3, 3, 3, 3, 3, 4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [5, 5, 5, 5, 5, 1]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [6, 6, 6, 6, 6, 3]}
            ]
          }
        ]
      },
      {
        "id": 2,
        "name": "Verse",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [5, 5, 5, 5, 5, 1]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [6, 6, 6, 6, 6, 3]}
            ]
          }
        ]
      },
      {
        "id": 3,
        "name": "Bridge",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [5, 5, 5, 5, 5, 1]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [6, 6, 6, 6, 6, 3]}
            ]
          }
        ]
      },
      {
        "id": 4,
        "name": "Outro",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3, 3, 3, 3, 3, 4]}
            ]
          },
          {"bars": [{"rhythm": 2, "chords": [1]}]}
        ]
      }
    ],
    "lyricsUnit": ":h",
    "structure": [
      {
        "part": 1,
        "lyrics": "|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?"
      },
      {
        "part": 2,
        "lyrics": ":Tous nos échanges|coulaient de|source:\nTous nos mé-|langes:cotés|en bourse."
      },
      {
        "part": 2,
        "lyrics": ":Tout est brutal|botté en|touche.:\nTout à|l'horizontal:nos envies nos|amours|nos héros:"
      },
      {
        "part": 1,
        "lyrics": "|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?"
      },
      {
        "part": 2,
        "lyrics": " :Tout est extrême|limites et cônes|glacés.:\nTout est idem|les vitrines:les|pôles opposés."
      },
      {
        "part": 2,
        "lyrics": " :Dans les étoiles|ou sous la|douche.:\nTout à|l'horizontal:nos envies nos|amours|nos héros:"
      },
      {
        "part": 1,
        "lyrics": "|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?"
      },
      {
        "part": 3,
        "lyrics": "|\nEt si l’on disait le|contraire|\nOu si l’on ne|disait rien|\nSi l’on construisait|les phrases à l’envers|\nOu si l’on|soulevait demain|\nQui serait|l’adversaire ?|\nEntre nous qui serait|le plus malin ?|\nEt si l’on disait|le contraire|\nOu si l’on ne|disait plus rien ?"
      },
      {
        "part": 1,
        "lyrics": "|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?"
      },
      {
        "part": 2,
        "lyrics": " :Tout est brutal|botté en|touche.:\nTout à|l'horizontal:nos envies nos|amours|nos héros:"
      },
      {
        "part": 3,
        "lyrics": "|\nSi l’on suivait|les voies ferroviaires|\nQui aurait le|pied marin ?|\nSi l’on sifflait|les fonds de théière|\nOu si l’on ne|sifflait plus !|\nQui serait|l’adversaire ?|\nEntre nous qui serait|le plus malin ?|\nEt si l’on disait|le contraire|\nOu si l’on ne|se disait plus rien ?"
      },
      {"part": 4, "lyrics": "|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?"}
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"Alain Bashung\"\nTITLE \"Je t'ai manqué\"\nYEAR 2008\nDIFFICULTY 3\nVIDEO \"https://www.youtube.com/watch?v=90HUdz87td4\"\nTUTORIAL \"\"\nCOMMENT \"Chanson assez facile:\n- une seule ryhtmique (en shuffle)\n- uniquement des accords ouverts.\n\nChanter en même temps demande tout de même un peu d'exercice.\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 5\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY G\nTIME 4/4 4 :q\nTEMPO 146\nSHUFFLE \":8\"\n\n##########\n# CHORDS #\n##########\n\nCHORD Am    x02210 T02310/-\nCHORD E\t    022100 023100/-\nCHORD C\t    x32010 T32010/-\nCHORD G\t    320003 210003/- \"G with 3 fingers.\"\nCHORD Asus4\tx02230 T02340/- \"Same as Am but adding finger 4 on fret 3 of B string.\"\nCHORD Cadd9\tx3203x T32040/- \"Same as C but adding finger 4 on fret 3 of B string.\"\n\n###########\n# RHYTHMS #\n###########\n\nRHYTHM R1\t\":8 ()d ()u ()d ()u T() ()u ()d ()u\"\nRHYTHM R2\t\":h ()dd :h (#)\"\n\n#########\n# PARTS #\n#########\n\nBLOCK TAIL [R1*Am] [R1*Asus4:::::Am] [R1*C] [R1*Cadd9:::::C]\n\nPART \"Chorus\"   [R1*Am] [R1*E] % [R1*C:::::G] || TAIL\nPART \"Verse\"    [R1*Am] % [R1*C] [R1*G] || TAIL\nPART \"Bridge\"   [R1*Am] % [R1*G] % || [R1*Am] % [R1*G] % || [R1*Am] % [R1*G] % || [R1*Am] % [R1*G] % || TAIL\nPART \"Outro\"    [R1*Am] [R1*E] % [R1*C:::::G] || [R2*Am]\n\n#############\n# STRUCTURE #\n#############\n\nLYRICS_UNIT \":h\"\n\nSTRUCTURE\n\n\"Chorus\" \"|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?\"\n\n\"Verse\" \":Tous nos échanges|coulaient de|source:\nTous nos mé-|langes:cotés|en bourse.\"\n\n\"Verse\" \":Tout est brutal|botté en|touche.:\nTout à|l'horizontal:nos envies nos|amours|nos héros:\"\n\n\"Chorus\" \"|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?\"\n\n\"Verse\" \" :Tout est extrême|limites et cônes|glacés.:\nTout est idem|les vitrines:les|pôles opposés.\"\n\n\"Verse\" \" :Dans les étoiles|ou sous la|douche.:\nTout à|l'horizontal:nos envies nos|amours|nos héros:\"\n\n\"Chorus\" \"|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?\"\n\n\"Bridge\" \"|\nEt si l’on disait le|contraire|\nOu si l’on ne|disait rien|\nSi l’on construisait|les phrases à l’envers|\nOu si l’on|soulevait demain|\nQui serait|l’adversaire ?|\nEntre nous qui serait|le plus malin ?|\nEt si l’on disait|le contraire|\nOu si l’on ne|disait plus rien ?\"\n\n\"Chorus\" \"|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?\"\n\n\"Verse\" \" :Tout est brutal|botté en|touche.:\nTout à|l'horizontal:nos envies nos|amours|nos héros:\"\n\n\"Bridge\" \"|\nSi l’on suivait|les voies ferroviaires|\nQui aurait le|pied marin ?|\nSi l’on sifflait|les fonds de théière|\nOu si l’on ne|sifflait plus !|\nQui serait|l’adversaire ?|\nEntre nous qui serait|le plus malin ?|\nEt si l’on disait|le contraire|\nOu si l’on ne|se disait plus rien ?\"\n\n\"Outro\" \"|Je t'ai manqué ?||\nPourquoi ?::8:Tu me|visais ?\"\n"
  },
  {
    "artist": "Renaud",
    "title": "Chanson pour Pierrot",
    "year": 1979,
    "difficulty": 2,
    "video": "https://www.youtube.com/watch?v=fs5GrZC_LnM",
    "tutorial": "",
    "comment": "Chanson en arpèges assez facile:\n- ryhtmique unique en croches shuffle (à la Brassens)\n- uniquement des accords ouverts.",
    "tuning": "standard",
    "capo": 2,
    "signature": {
      "key": "C",
      "time": {"beatsPerBar": "2", "beatDuration": ":q", "symbol": "2/4"},
      "tempo": 76.5,
      "shuffle": ":8"
    },
    "chords": [
      {
        "id": 1,
        "name": "Em",
        "tablature": "022000",
        "fingering": "023000/-",
        "comment": ""
      },
      {
        "id": 2,
        "name": "Am",
        "tablature": "x02210",
        "fingering": "T02310/-",
        "comment": ""
      },
      {
        "id": 3,
        "name": "B7",
        "tablature": "x21202",
        "fingering": "P44404/-",
        "comment": ""
      },
      {
        "id": 4,
        "name": "D",
        "tablature": "xx0232",
        "fingering": "T00132/-",
        "comment": ""
      },
      {
        "id": 5,
        "name": "C",
        "tablature": "x32010",
        "fingering": "T32010/-",
        "comment": ""
      }
    ],
    "rhythms": [
      {"id": 1, "name": "R1", "score": ":8 (B)p (3)i (12)ma (3)i"},
      {"id": 2, "name": "R2", "score": ":8 (B)p> :qd (#)"}
    ],
    "parts": [
      {
        "id": 1,
        "name": "Intro",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [5]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [5]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]
          },
          {"bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [3]}]}
        ]
      },
      {
        "id": 2,
        "name": "Verse",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [5]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [5]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3]}
            ]
          }
        ]
      },
      {
        "id": 3,
        "name": "Chorus",
        "phrases": [
          {"bars": [{"rhythm": 2, "chords": [3]}]},
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 2, "chords": [4]},
              {"rhythm": 1, "chords": [1]}
            ]
          }
        ]
      }
    ],
    "lyricsUnit": ":8",
    "structure": [
      {"part": 1, "lyrics": ""},
      {
        "part": 2,
        "lyrics": ":T'es pas né dans la|rue:t'es pas né dans le rui-|sseau:\nT'es pas un enfant per-|du:pas un enfant de|salaud:\nVu qu't'es né qu'dans ma|tête:et qu'tu vis dans ma|peau:\nJ'ai construit ta pla-|nète:au fond de mon cer-|veau__|"
      },
      {
        "part": 3,
        "lyrics": ":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___"
      },
      {
        "part": 2,
        "lyrics": ":Depuis le temps que j'te|rêve:depuis le temps que j't'in-|vente:\nDe pas te voir j'en|crève:mais j'te sens dans mon|ventre:\nLe jour où tu t'ra-|mènes:j'arrête de boire pro-|mis:\nAu moins toute une se-|maine:ce sera dur mais tant|pis__"
      },
      {
        "part": 3,
        "lyrics": ":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___"
      },
      {
        "part": 2,
        "lyrics": ":Qu'tu sois fils de prin-|cesse:ou que tu sois fils de|rien:\nTu s'ras fils de ten-|dresse:tu seras pas or-|phelin:\nJe connais pas ta|mère:mais je la cherche en|vain:\nJe connais qu'la mi-|sère d'être tout seul sur le|ch'min"
      },
      {
        "part": 3,
        "lyrics": ":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___"
      },
      {
        "part": 2,
        "lyrics": ":Dans un coin de ma|tête:y a déjà ton trou-|sseau:\nUn jean une moby-|lette:une paire de san-|tiago:\nT'iras pas à l'é-|cole: j't'apprendrai des gros|mots:\nOn jouera au foot-|ball:on ira au bis-|trot_"
      },
      {
        "part": 3,
        "lyrics": ":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___"
      },
      {
        "part": 2,
        "lyrics": ":Tu te laveras pas les|pognes avant d'venir à|table:\nEt tu me traiteras d'i-|vrogne:quand je piquerai ton|cartable:\nJe t'apprendrai des chan-|sons:tu les trouveras dé-|biles:\nT'auras peut-être bien rai-|son mais je serai vexé quand|mê_me"
      },
      {
        "part": 3,
        "lyrics": ":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___"
      },
      {
        "part": 2,
        "lyrics": ":Allez viens mon Pier-|rot:tu seras le chef de ma|bande:\nJe te refilerai mon cou|teau:je t'apprendrai la|truande:\nAllez viens mon co-|pain:je t'ai trouvé une ma-|man:\nTous les trois ça sera|bien:allez viens je t'at-|tends_"
      },
      {
        "part": 3,
        "lyrics": ":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___"
      }
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"Renaud\"\nTITLE \"Chanson pour Pierrot\"\nYEAR 1979\nDIFFICULTY 2\nVIDEO \"https://www.youtube.com/watch?v=fs5GrZC_LnM\"\nTUTORIAL \"\"\nCOMMENT \"Chanson en arpèges assez facile:\n- ryhtmique unique en croches shuffle (à la Brassens)\n- uniquement des accords ouverts.\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 2\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY C\nTIME 2/4 2 :q\nTEMPO 76.5\nSHUFFLE \":8\"\n\n##########\n# CHORDS #\n##########\n\nCHORD Em\t022000 023000/-\nCHORD Am\tx02210 T02310/-\nCHORD B7\tx21202 P44404/-\nCHORD D\t  xx0232 T00132/-\nCHORD C\t  x32010 T32010/-\n\n###########\n# RHYTHMS #\n###########\n\nRHYTHM R1\t\":8 (B)p (3)i (12)ma (3)i\"\nRHYTHM R2\t\":8 (B)p> :qd (#)\"\n\n#########\n# PARTS #\n#########\n\nPART \"Intro\"\t[R1*Em] [R1*C] || [R1*Em] [R1*C] || [R1*Em] [R1*Am] || [R1*Em] [R1*B7]\nPART \"Verse\"\t[R1*Em] [R1*C] || [R1*Em] [R1*C] || [R1*Em] [R1*Am] || [R1*Em] [R1*Am] [R1*B7]\nPART \"Chorus\"\t[R2*B7] || [R1*Em] [R1*Am] || [R1*D] [R2*D] [R1*Em]\n\n#############\n# STRUCTURE #\n#############\n\nLYRICS_UNIT\t\":8\"\n\nSTRUCTURE\n\n\"Intro\" \"\"\n\n\"Verse\" \":T'es pas né dans la|rue:t'es pas né dans le rui-|sseau:\nT'es pas un enfant per-|du:pas un enfant de|salaud:\nVu qu't'es né qu'dans ma|tête:et qu'tu vis dans ma|peau:\nJ'ai construit ta pla-|nète:au fond de mon cer-|veau__|\"\n\n\"Chorus\" \":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___\"\n\n\"Verse\" \":Depuis le temps que j'te|rêve:depuis le temps que j't'in-|vente:\nDe pas te voir j'en|crève:mais j'te sens dans mon|ventre:\nLe jour où tu t'ra-|mènes:j'arrête de boire pro-|mis:\nAu moins toute une se-|maine:ce sera dur mais tant|pis__\"\n\n\"Chorus\" \":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___\"\n\n\"Verse\" \":Qu'tu sois fils de prin-|cesse:ou que tu sois fils de|rien:\nTu s'ras fils de ten-|dresse:tu seras pas or-|phelin:\nJe connais pas ta|mère:mais je la cherche en|vain:\nJe connais qu'la mi-|sère d'être tout seul sur le|ch'min\"\n\n\"Chorus\" \":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___\"\n\n\"Verse\" \":Dans un coin de ma|tête:y a déjà ton trou-|sseau:\nUn jean une moby-|lette:une paire de san-|tiago:\nT'iras pas à l'é-|cole: j't'apprendrai des gros|mots:\nOn jouera au foot-|ball:on ira au bis-|trot_\"\n\n\"Chorus\" \":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___\"\n\n\"Verse\" \":Tu te laveras pas les|pognes avant d'venir à|table:\nEt tu me traiteras d'i-|vrogne:quand je piquerai ton|cartable:\nJe t'apprendrai des chan-|sons:tu les trouveras dé-|biles:\nT'auras peut-être bien rai-|son mais je serai vexé quand|mê_me\"\n\n\"Chorus\" \":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___\"\n\n\"Verse\" \":Allez viens mon Pier-|rot:tu seras le chef de ma|bande:\nJe te refilerai mon cou|teau:je t'apprendrai la|truande:\nAllez viens mon co-|pain:je t'ai trouvé une ma-|man:\nTous les trois ça sera|bien:allez viens je t'at-|tends_\"\n\n\"Chorus\" \":Pierrot::mon|gosse:\nmon frangin mon po-|teau:\nmon copain tu m'tiens|chaud:\n|:::Pier-|rot___\"\n"
  },
  {
    "artist": "The Mamas and The Papas",
    "title": "California Dreamin'",
    "year": 1966,
    "difficulty": 3,
    "video": "",
    "tutorial": "",
    "comment": "Morceau composé de 3 phrases de 4 mesures qui tournent en boucle.\n\nCes 3 phrases ont la même rythmique basée sur une rythmique « Ballade » (1 noire 2 croches 1 noire 2 croches) avec changement d'accord sur le 1er et le 3ème temps.\n\nOn « avance d'un 1⁄2 temps » le début de la mesure suivante. La rythmique finale s'étend donc sur 2 mesures avec un changement d'accord avancé sur la dernière croche de la 1ère mesure. Cette rythmique à 2 mesures se répète 2 fois dans chaque phrase.",
    "tuning": "standard",
    "capo": 4,
    "signature": {
      "key": "C",
      "time": {"beatsPerBar": "4", "beatDuration": ":q", "symbol": "4/4"},
      "tempo": 110,
      "shuffle": ""
    },
    "chords": [
      {
        "id": 1,
        "name": "Am",
        "tablature": "x02210",
        "fingering": "T02310/-",
        "comment": ""
      },
      {
        "id": 2,
        "name": "G",
        "tablature": "320003",
        "fingering": "320004/-",
        "comment": "G with 3 fingers. Finger 1 not used (kept for coming F)."
      },
      {
        "id": 3,
        "name": "F",
        "tablature": "133211",
        "fingering": "134211/1",
        "comment": ""
      },
      {
        "id": 4,
        "name": "E7sus4",
        "tablature": "020200",
        "fingering": "020300/-",
        "comment": "Same as E but with finger 3 down one string."
      },
      {
        "id": 5,
        "name": "E7",
        "tablature": "020100",
        "fingering": "020100/-",
        "comment": "Same as E but without finger 3."
      },
      {
        "id": 6,
        "name": "C",
        "tablature": "x32010",
        "fingering": "T32010/-",
        "comment": ""
      }
    ],
    "rhythms": [
      {
        "id": 1,
        "name": "R1",
        "score": ":q ()d> :8 ()d()u()d>()uT()()u :8 T()()u()d()u :q ()d :8 ()d()u"
      },
      {
        "id": 2,
        "name": "R2",
        "score": ":q ()d> :8 ()d()u()d>()u(#)()u :8 (#)()u()d()u :q ()d :8 ()d()u"
      }
    ],
    "parts": [
      {
        "id": 1,
        "name": "Verse",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 2]},
              {"rhythm": 1, "chords": [4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 3]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [6, 6, 6, 5, 5, 5, 1, 1, 1, 1, 1, 3]},
              {"rhythm": 1, "chords": [4, 4, 4, 4, 4, 4, 5]}
            ]
          },
          {
            "bars": [
              {"rhythm": 2, "chords": [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 2]},
              {"rhythm": 2, "chords": [4, 4, 4, 4, 4, 4, 5]}
            ]
          },
          {
            "bars": [
              {"rhythm": 2, "chords": [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 2]},
              {"rhythm": 2, "chords": [4, 4, 4, 4, 4, 4, 5]}
            ]
          }
        ]
      }
    ],
    "lyricsUnit": ":8",
    "structure": [
      {
        "part": 1,
        "lyrics": "brown:h:|\n:q:and:the:sky:q:is|gray:|\n:qd:I've:been__:q:for:a|walk:|\n:qd:on a:win-:q:ter:'s|day:|\n:qd:I'd:be:q:safe:and|warm:|\n:qd:if:I:q:was:in|L.A|\n:qd:Ca-:li-:q:for-:nia|drea-:q:ming|\n:qd:on:such:q:a win-:ter's|day|"
      }
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"The Mamas and The Papas\"\nTITLE \"California Dreamin'\"\nYEAR 1966\nDIFFICULTY 3\nVIDEO \"\"\nTUTORIAL \"\"\nCOMMENT \"Morceau composé de 3 phrases de 4 mesures qui tournent en boucle.\n\nCes 3 phrases ont la même rythmique basée sur une rythmique « Ballade » (1 noire 2 croches 1 noire 2 croches) avec changement d'accord sur le 1er et le 3ème temps.\n\nOn « avance d'un 1⁄2 temps » le début de la mesure suivante. La rythmique finale s'étend donc sur 2 mesures avec un changement d'accord avancé sur la dernière croche de la 1ère mesure. Cette rythmique à 2 mesures se répète 2 fois dans chaque phrase.\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 4\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY C\nTIME 4/4 4 :q\nTEMPO 110\nSHUFFLE \"\"\n\n##########\n# CHORDS #\n##########\n\nCHORD Am\t\t  x02210 T02310/-\nCHORD G       320003 320004/- \"G with 3 fingers. Finger 1 not used (kept for coming F).\"\nCHORD F\t\t\t  133211 134211/1\nCHORD E7sus4\t020200 020300/- \"Same as E but with finger 3 down one string.\"\nCHORD E7\t\t  020100 020100/- \"Same as E but without finger 3.\"\nCHORD C\t\t\t  x32010 T32010/-\n\n###########\n# RHYTHMS #\n###########\n\n# 2 bars always together, accents on beats 1 and 3 (>, after d or u if any)\nRHYTHM R1\t\":q ()d> :8 ()d()u()d>()uT()()u :8 T()()u()d()u :q ()d :8 ()d()u\"\n\n# testing rests (#) instead of tied notes\nRHYTHM R2\t\":q ()d> :8 ()d()u()d>()u(#)()u :8 (#)()u()d()u :q ()d :8 ()d()u\"\n\n#########\n# PARTS #\n#########\n\nBLOCK A\t[R1*Am:::G:::F:::::G]  [R1*E7sus4::::::E7:::::F]\nBLOCK B\t[R1*C:::E7:::Am:::::F] [R1*E7sus4::::::E7]\nBLOCK C\t[R2*Am:::G:::F:::::G]  [R2*E7sus4::::::E7]\n\nPART \"Verse\"\tA || B || C || C\n\n#############\n# STRUCTURE #\n#############\n\nLYRICS_UNIT\t\":8\"\n\nSTRUCTURE\n\"Verse\" \"brown:h:|\n:q:and:the:sky:q:is|gray:|\n:qd:I've:been__:q:for:a|walk:|\n:qd:on a:win-:q:ter:'s|day:|\n:qd:I'd:be:q:safe:and|warm:|\n:qd:if:I:q:was:in|L.A|\n:qd:Ca-:li-:q:for-:nia|drea-:q:ming|\n:qd:on:such:q:a win-:ter's|day|\"\n"
  },
  {
    "artist": "Johnny Cash",
    "title": "Solitary man",
    "year": 2002,
    "difficulty": 2,
    "video": "",
    "tutorial": "",
    "comment": "",
    "tuning": "standard",
    "capo": 3,
    "signature": {
      "key": "Em",
      "time": {"beatsPerBar": "4", "beatDuration": ":q", "symbol": "4/4"},
      "tempo": 160,
      "shuffle": ":8"
    },
    "chords": [
      {
        "id": 1,
        "name": "Em",
        "tablature": "022000",
        "fingering": "023000/-",
        "comment": ""
      },
      {
        "id": 2,
        "name": "Am",
        "tablature": "x02210",
        "fingering": "T02310/-",
        "comment": ""
      },
      {
        "id": 3,
        "name": "G",
        "tablature": "320003",
        "fingering": "210003/-",
        "comment": "G with 3 fingers."
      },
      {
        "id": 4,
        "name": "D",
        "tablature": "xx0232",
        "fingering": "T00132/-",
        "comment": ""
      },
      {
        "id": 5,
        "name": "C",
        "tablature": "x32010",
        "fingering": "T32010/-",
        "comment": ""
      }
    ],
    "rhythms": [
      {"id": 1, "name": "R1", "score": ":q (B)d :8 ()d()uT()()u()d()u"}
    ],
    "parts": [
      {
        "id": 1,
        "name": "Intro",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]}
            ]
          }
        ]
      },
      {
        "id": 2,
        "name": "Verse",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [1]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [2]}
            ]
          }
        ]
      },
      {
        "id": 3,
        "name": "Chorus",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [5]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [5]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [4]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [1]}
            ]
          }
        ]
      },
      {
        "id": 4,
        "name": "Interlude",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [2]}
            ]
          },
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [2]}
            ]
          }
        ]
      }
    ],
    "structure": [
      {"part": 1, "lyrics": ""},
      {
        "part": 2,
        "lyrics": ":Bel-:inda:was|mine:h:\nTill:the|time:h:that I:found|her|\n:h:Hol-:ding|Jim|:And:Lo-:ving|Him"
      },
      {
        "part": 2,
        "lyrics": ":Then Sue came a-|long:h:\nLoved:me|strong:h:that's:what I|thought|\n:h:Me and|Sue|:But:that:died|too"
      },
      {
        "part": 3,
        "lyrics": "|:Don't know that I|will but un-|til I can|find me|\n:A girl who’ll|stay and won't|play games be-|hind me|\nI'll be what I|am|\n:A solitary|man|\n:Solitary|man "
      },
      {
        "part": 2,
        "lyrics": ":I've had it to|here:h:\nBeing|where:h:love's a|small:word|\n:A:part:time|thing|:h:a pa-:per|ring"
      },
      {
        "part": 2,
        "lyrics": ":I know it's been |done:h:\nHaving|one girl:h:who|loves me|\n:h:Right or|wrong|:h:weak or|strong"
      },
      {
        "part": 3,
        "lyrics": "|:Don't know that I|will but un-|til I can|find me|\n:The girl who’ll|stay and won't|play games be-|hind me|\nI'll be what I|am|\n:A solitary|man|\n:Solitary|man "
      },
      {"part": 4, "lyrics": "||||\n||||"},
      {
        "part": 3,
        "lyrics": "|:Don't know that I|will but un-|til I can|find me|\n:The girl who’ll|stay and won't|play games be-|hind me|\nI'll be what I|am|\n:A solitary|man|\n:Solitary|man "
      }
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"Johnny Cash\"\nTITLE \"Solitary man\"\nYEAR 2002\nDIFFICULTY 2\nVIDEO \"\"\nTUTORIAL \"\"\nCOMMENT \"\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 3\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY Em\nTIME 4/4 4 :q\nTEMPO 160\nSHUFFLE \":8\"\n\n##########\n# CHORDS #\n##########\n\nCHORD Em\t022000 023000/-\nCHORD Am\tx02210 T02310/-\nCHORD G\t  320003 210003/- \"G with 3 fingers.\"\nCHORD D\t  xx0232 T00132/-\nCHORD C\t  x32010 T32010/-\n\n###########\n# RHYTHMS #\n###########\n\nRHYTHM R1\t\":q (B)d :8 ()d()uT()()u()d()u\"\n\n#########\n# PARTS #\n#########\n\nPART \"Intro\" \t\t [R1*Em] % % %\nPART \"Verse\" \t\t [R1*Em] [R1*Am] [R1*G] [R1*Em] || [R1*G] [R1*Am] [R1*G] [R1*Am]\nPART \"Chorus\" \t [R1*Am] [R1*G]  [R1*C] [R1*G]  [R1*D] % [R1*C] [R1*G] [R1*D] || [R1*D] [R1*Em] [R1*D] [R1*Em] [R1*D] [R1*Em]\nPART \"Interlude\" [R1*Em] [R1*Em] [R1*Am] [R1*Am] || [R1*Em] [R1*Em] [R1*Am] [R1*Am]\n\n#############\n# STRUCTURE #\n#############\n\nSTRUCTURE\n\n\"Intro\" \"\"\n\n\"Verse\" \":Bel-:inda:was|mine:h:\nTill:the|time:h:that I:found|her|\n:h:Hol-:ding|Jim|:And:Lo-:ving|Him\"\n\n\"Verse\" \":Then Sue came a-|long:h:\nLoved:me|strong:h:that's:what I|thought|\n:h:Me and|Sue|:But:that:died|too\"\n\n\"Chorus\" \"|:Don't know that I|will but un-|til I can|find me|\n:A girl who’ll|stay and won't|play games be-|hind me|\nI'll be what I|am|\n:A solitary|man|\n:Solitary|man \"\n\n\"Verse\" \":I've had it to|here:h:\nBeing|where:h:love's a|small:word|\n:A:part:time|thing|:h:a pa-:per|ring\"\n\n\"Verse\" \":I know it's been |done:h:\nHaving|one girl:h:who|loves me|\n:h:Right or|wrong|:h:weak or|strong\"\n\n\"Chorus\" \"|:Don't know that I|will but un-|til I can|find me|\n:The girl who’ll|stay and won't|play games be-|hind me|\nI'll be what I|am|\n:A solitary|man|\n:Solitary|man \"\n\n\"Interlude\" \"||||\n||||\"\n\n\"Chorus\" \"|:Don't know that I|will but un-|til I can|find me|\n:The girl who’ll|stay and won't|play games be-|hind me|\nI'll be what I|am|\n:A solitary|man|\n:Solitary|man \"\n"
  },
  {
    "artist": "Léo Ferré",
    "title": "La mémoire et la mer",
    "year": 1970,
    "difficulty": 2,
    "video": "",
    "tutorial": "",
    "comment": "",
    "tuning": "standard",
    "capo": 0,
    "signature": {
      "key": "C",
      "time": {"beatsPerBar": "4", "beatDuration": ":qd", "symbol": "12/8"},
      "tempo": 85,
      "shuffle": ""
    },
    "chords": [
      {
        "id": 1,
        "name": "C01",
        "tablature": "0xxCCE",
        "fingering": "000113/C",
        "comment": "Barrer en 12 sur 3 cordes"
      },
      {
        "id": 2,
        "name": "C02",
        "tablature": "xxxCCC",
        "fingering": "000111/C",
        "comment": "Enlever un doigt"
      },
      {
        "id": 3,
        "name": "C03",
        "tablature": "xxxBAC",
        "fingering": "000213/-",
        "comment": "Barrer en 10 sur 2 cordes"
      },
      {
        "id": 4,
        "name": "C04",
        "tablature": "xxxBAA",
        "fingering": "000211/A",
        "comment": "Enlever un doigt"
      },
      {
        "id": 5,
        "name": "C05",
        "tablature": "xxx98A",
        "fingering": "000213/-",
        "comment": "Barrer en 8 sur 2 cordes"
      },
      {
        "id": 6,
        "name": "C06",
        "tablature": "xxx988",
        "fingering": "000211/8",
        "comment": "Enlever un doigt"
      },
      {
        "id": 7,
        "name": "C07",
        "tablature": "xxx778",
        "fingering": "000112/7",
        "comment": "Barrer en 7 sur 3 cordes"
      },
      {
        "id": 8,
        "name": "C08",
        "tablature": "xxx777",
        "fingering": "000111/7",
        "comment": "Enlever un doigt"
      },
      {
        "id": 9,
        "name": "C09",
        "tablature": "xxx557",
        "fingering": "000113/5",
        "comment": "Barrer en 5 sur 3 cordes"
      },
      {
        "id": 10,
        "name": "C10",
        "tablature": "xxx555",
        "fingering": "000111/5",
        "comment": "Enlever un doigt"
      },
      {
        "id": 11,
        "name": "C11",
        "tablature": "xxx435",
        "fingering": "000213/3",
        "comment": "Barrer en 3 sur 2 cordes"
      },
      {
        "id": 12,
        "name": "C12",
        "tablature": "xxx433",
        "fingering": "000211/3",
        "comment": "Enlever un doigt"
      },
      {
        "id": 13,
        "name": "C13",
        "tablature": "x0x213",
        "fingering": "000213/-",
        "comment": ""
      },
      {
        "id": 14,
        "name": "C14",
        "tablature": "2xx212",
        "fingering": "T00213/-",
        "comment": "Fretter la corde E avc le pouce"
      },
      {
        "id": 15,
        "name": "C15",
        "tablature": "0xx002",
        "fingering": "000003/-",
        "comment": "Enlever tous les doigts sauf le 3ème"
      },
      {
        "id": 16,
        "name": "C16",
        "tablature": "0xx000",
        "fingering": "000000/-",
        "comment": "Tout à vide"
      },
      {
        "id": 17,
        "name": "C17",
        "tablature": "0x425x",
        "fingering": "003140/-",
        "comment": "On peut aussi jouer le corde e à vide au lieu de la corde B, ce qui permet de placer le doigt 2 sur la corde B pour C20A"
      },
      {
        "id": 18,
        "name": "C18",
        "tablature": "x5423x",
        "fingering": "043120/-",
        "comment": "On peut ignorer le petit doigt (i.e. ne pas jouer la basse) ou la jouer sur la corde D à vide"
      },
      {
        "id": 19,
        "name": "C18b",
        "tablature": "xx421x",
        "fingering": "003210/-",
        "comment": "Ca passe aussi si on reste sur C20A"
      },
      {
        "id": 20,
        "name": "C18c",
        "tablature": "xx420x",
        "fingering": "003200/-",
        "comment": "Enlever un doigt, soit l'index si on vient de C20B soit le doigt 2 si on vient de C20A"
      },
      {
        "id": 21,
        "name": "0xx002",
        "tablature": "0xx002",
        "fingering": "000000/-",
        "comment": ""
      },
      {
        "id": 22,
        "name": "xxx003",
        "tablature": "xxx003",
        "fingering": "000000/-",
        "comment": ""
      },
      {
        "id": 23,
        "name": "xxx000",
        "tablature": "xxx000",
        "fingering": "000000/-",
        "comment": ""
      },
      {
        "id": 24,
        "name": "xxx007",
        "tablature": "xxx007",
        "fingering": "000000/-",
        "comment": ""
      }
    ],
    "rhythms": [
      {
        "id": 1,
        "name": "R1",
        "score": ":8   (1)(2)(3)  (1)(2)(3)  (1)(2)(3)  (1)(2)(3)"
      },
      {
        "id": 2,
        "name": "R2",
        "score": ":8  (B1)(2)(3)  (1)(2)(3)  (1)(2)(3)  (1)(2)(3)"
      },
      {
        "id": 3,
        "name": "R3",
        "score": ":8  (B2)(3)(4)  (2)(3)(4)  (2)(3)(4)  (2)(3)(4)"
      }
    ],
    "parts": [
      {
        "id": 1,
        "name": "Intro",
        "phrases": [
          {"bars": [{"rhythm": 2, "chords": [1]}, {"rhythm": 2, "chords": [1]}]}
        ]
      },
      {
        "id": 2,
        "name": "Verse",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1]},
              {"rhythm": 1, "chords": [2]},
              {"rhythm": 1, "chords": [3]},
              {"rhythm": 1, "chords": [4]},
              {"rhythm": 1, "chords": [5]},
              {"rhythm": 1, "chords": [6]},
              {"rhythm": 1, "chords": [7]},
              {"rhythm": 1, "chords": [8]},
              {"rhythm": 1, "chords": [9]},
              {"rhythm": 1, "chords": [10]},
              {"rhythm": 1, "chords": [11]},
              {"rhythm": 1, "chords": [12]},
              {"rhythm": 2, "chords": [13]},
              {"rhythm": 2, "chords": [14]},
              {"rhythm": 2, "chords": [15]},
              {"rhythm": 2, "chords": [16]},
              {"rhythm": 3, "chords": [17]},
              {"rhythm": 3, "chords": [18, 18, 18, 18, 18, 18, 19, 19, 19, 20]},
              {"rhythm": 2, "chords": [21, 21, 21, 21, 21, 21, 21, 21, 21, 22]},
              {"rhythm": 2, "chords": [21, 21, 21, 23, 23, 23, 22, 22, 22, 24]}
            ]
          }
        ]
      }
    ],
    "structure": [
      {"part": 1, "lyrics": ""},
      {
        "part": 2,
        "lyrics": "La marée je l'ai dans le cœur|\nQui me remonte comme un signe|\nJe meurs de ma petite sœur|\nDe mon enfant et de mon cygne|\nUn bateau ça dépend comment|\nOn l'arrime au port de justesse|\nIl pleure de mon firmament|\nDes années-lumière et j'en laisse|\nJe suis le fantôme Jersey|\nCelui qui vient les soirs de frime|\nTe lancer la brume en baisers|\nEt te ramasser dans ses rimes|\nComme le trémail de juillet|\nOù luisait le loup solitaire|\nCelui que je voyais briller |\n||\nAux doigts du sable de la te-|-rre|"
      },
      {
        "part": 2,
        "lyrics": "Rappelle-toi ce chien de mer|\nQue nous libérions sur parole|\nEt qui gueule dans le désert|\nDes goémons de nécropole|\nJe suis sûr que la vie est là|\nAvec ses poumons de flanelle|\nQuand il pleure de ces temps-là|\nLe froid tout gris qui nous appelle|\nJe me souviens des soirs là-bas|\nEt des sprints gagnés sur l'écume|\nCette bave des chevaux ras|\nAu ras des rocs qui se consument|\nô l'ange des plaisirs perdus|\nô rumeurs d'une autre habitude|\nMes désirs dès lors ne sont plus|\n||\nQu'un chagrin de ma solitu-|-de|"
      },
      {
        "part": 2,
        "lyrics": "Et le diable des soirs conquis|\nAvec ses pâleurs de rescousse|\nEt le squale des paradis|\nDans le milieu mouillé de mousse|\nReviens fille verte des fjords|\nReviens violon des violonades|\nDans le port fanfarent les cors|\nPour le retour des camarades|\nô parfum rare des salants|\nDans le poivre feu des gerçures|\nQuand j'allais géométrisant|\nMon âme au creux de ta blessure|\nDans le désordre de ton cul|\nPoissé dans les draps d'aube fine|\nJe voyais un vitrail de plus|\n||\nEt toi fille verte mon|spleen|"
      },
      {
        "part": 2,
        "lyrics": "Les coquillages figurants|\nSous les sunlights cassés liquides|\nJouent de la castagnette tant|\nQu'on dirait l'Espagne livide|\nDieu des granits ayez pitié|\nDe leur vocation de parure|\nQuand le couteau vient s'immiscer|\nDans leur castagnette figure|\nEt je voyais ce qu'on pressent|\nQuand on pressent l'entrevoyure|\nEntre les persiennes du sang|\nEt que les globules figurent|\nUne mathématique bleue|\nDans cette mer jamais étale|\nD'où nous remonte peu à peu|\n||\nCette mémoire des ét-|-oiles|"
      },
      {
        "part": 2,
        "lyrics": "Cette rumeur qui vient de là|\nSous l'arc copain où je m'aveugle|\nCes mains qui me font du flafla|\nCes mains ruminantes qui meuglent|\nCette rumeur me suit longtemps|\nComme un mendiant sous l'anathème|\nComme l'ombre qui perd son temps|\nà dessiner mon théorème|\nEt sur mon maquillage roux|\nS'en vient battre comme une porte|\nCette rumeur qui va debout|\nDans la rue aux musiques mortes|\nC'est fini la mer c'est fini|\nSur la plage le sable bêle|\nComme des moutons d'infini|\n||\nQuand la mer bergère m'ap-|pelle|"
      }
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"Léo Ferré\"\nTITLE \"La mémoire et la mer\"\nYEAR 1970\nDIFFICULTY 2\nVIDEO \"\"\nTUTORIAL \"\"\nCOMMENT \"\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 0\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY C\nTIME 12/8 4 :qd\nTEMPO 85\nSHUFFLE \"\"\n\n##########\n# CHORDS #\n##########\n\nCHORD C01\t  0xxCCE 000113/C \"Barrer en 12 sur 3 cordes\"\nCHORD C02   xxxCCC 000111/C \"Enlever un doigt\"\nCHORD C03   xxxBAC 000213/- \"Barrer en 10 sur 2 cordes\"\nCHORD C04   xxxBAA 000211/A \"Enlever un doigt\"\nCHORD C05   xxx98A 000213/- \"Barrer en 8 sur 2 cordes\"\nCHORD C06\t  xxx988 000211/8 \"Enlever un doigt\"\nCHORD C07\t  xxx778 000112/7 \"Barrer en 7 sur 3 cordes\"\nCHORD C08\t  xxx777 000111/7 \"Enlever un doigt\"\nCHORD C09\t  xxx557 000113/5 \"Barrer en 5 sur 3 cordes\"\nCHORD C10\t  xxx555 000111/5 \"Enlever un doigt\"\nCHORD C11\t  xxx435 000213/3 \"Barrer en 3 sur 2 cordes\"\nCHORD C12\t  xxx433 000211/3 \"Enlever un doigt\"\nCHORD C13\t  x0x213 000213/-\nCHORD C14\t  2xx212 T00213/- \"Fretter la corde E avc le pouce\"\nCHORD C15\t  0xx002 000003/- \"Enlever tous les doigts sauf le 3ème\"\nCHORD C16\t  0xx000 000000/- \"Tout à vide\"\nCHORD C17\t  0x425x 003140/- \"On peut aussi jouer le corde e à vide au lieu de la corde B, ce qui permet de placer le doigt 2 sur la corde B pour C20A\"\nCHORD C18   x5423x 043120/- \"On peut ignorer le petit doigt (i.e. ne pas jouer la basse) ou la jouer sur la corde D à vide\"\nCHORD C18b\txx421x 003210/- \"Ca passe aussi si on reste sur C20A\"\nCHORD C18c\txx420x 003200/- \"Enlever un doigt, soit l'index si on vient de C20B soit le doigt 2 si on vient de C20A\"\n\n###########\n# RHYTHMS #\n###########\n\nRHYTHM R1 \":8   (1)(2)(3)  (1)(2)(3)  (1)(2)(3)  (1)(2)(3)\"\nRHYTHM R2\t\":8  (B1)(2)(3)  (1)(2)(3)  (1)(2)(3)  (1)(2)(3)\"\nRHYTHM R3\t\":8  (B2)(3)(4)  (2)(3)(4)  (2)(3)(4)  (2)(3)(4)\"\n\n#########\n# PARTS #\n#########\n\nPART \"Intro\" [R2*C01] %\nPART \"Verse\"\n\n[R1*C01] [R1*C02] [R1*C03] [R1*C04]\n[R1*C05] [R1*C06] [R1*C07] [R1*C08]\n[R1*C09] [R1*C10] [R1*C11] [R1*C12]\n\n[R2*C13] [R2*C14] [R2*C15] [R2*C16]\n[R3*C17] [R3*C18::::::C18b:::C18c]\n         [R2*0xx002:::::::::xxx003]\n         [R2*0xx002:::xxx000:::xxx003:::xxx007]\n\n#############\n# STRUCTURE #\n#############\n\nSTRUCTURE\n\n\"Intro\" \"\"\n\n\"Verse\" \"La marée je l'ai dans le cœur|\nQui me remonte comme un signe|\nJe meurs de ma petite sœur|\nDe mon enfant et de mon cygne|\nUn bateau ça dépend comment|\nOn l'arrime au port de justesse|\nIl pleure de mon firmament|\nDes années-lumière et j'en laisse|\nJe suis le fantôme Jersey|\nCelui qui vient les soirs de frime|\nTe lancer la brume en baisers|\nEt te ramasser dans ses rimes|\nComme le trémail de juillet|\nOù luisait le loup solitaire|\nCelui que je voyais briller |\n||\nAux doigts du sable de la te-|-rre|\"\n\n\"Verse\" \"Rappelle-toi ce chien de mer|\nQue nous libérions sur parole|\nEt qui gueule dans le désert|\nDes goémons de nécropole|\nJe suis sûr que la vie est là|\nAvec ses poumons de flanelle|\nQuand il pleure de ces temps-là|\nLe froid tout gris qui nous appelle|\nJe me souviens des soirs là-bas|\nEt des sprints gagnés sur l'écume|\nCette bave des chevaux ras|\nAu ras des rocs qui se consument|\nô l'ange des plaisirs perdus|\nô rumeurs d'une autre habitude|\nMes désirs dès lors ne sont plus|\n||\nQu'un chagrin de ma solitu-|-de|\"\n\n\"Verse\" \"Et le diable des soirs conquis|\nAvec ses pâleurs de rescousse|\nEt le squale des paradis|\nDans le milieu mouillé de mousse|\nReviens fille verte des fjords|\nReviens violon des violonades|\nDans le port fanfarent les cors|\nPour le retour des camarades|\nô parfum rare des salants|\nDans le poivre feu des gerçures|\nQuand j'allais géométrisant|\nMon âme au creux de ta blessure|\nDans le désordre de ton cul|\nPoissé dans les draps d'aube fine|\nJe voyais un vitrail de plus|\n||\nEt toi fille verte mon|spleen|\"\n\n\"Verse\" \"Les coquillages figurants|\nSous les sunlights cassés liquides|\nJouent de la castagnette tant|\nQu'on dirait l'Espagne livide|\nDieu des granits ayez pitié|\nDe leur vocation de parure|\nQuand le couteau vient s'immiscer|\nDans leur castagnette figure|\nEt je voyais ce qu'on pressent|\nQuand on pressent l'entrevoyure|\nEntre les persiennes du sang|\nEt que les globules figurent|\nUne mathématique bleue|\nDans cette mer jamais étale|\nD'où nous remonte peu à peu|\n||\nCette mémoire des ét-|-oiles|\"\n\n\"Verse\" \"Cette rumeur qui vient de là|\nSous l'arc copain où je m'aveugle|\nCes mains qui me font du flafla|\nCes mains ruminantes qui meuglent|\nCette rumeur me suit longtemps|\nComme un mendiant sous l'anathème|\nComme l'ombre qui perd son temps|\nà dessiner mon théorème|\nEt sur mon maquillage roux|\nS'en vient battre comme une porte|\nCette rumeur qui va debout|\nDans la rue aux musiques mortes|\nC'est fini la mer c'est fini|\nSur la plage le sable bêle|\nComme des moutons d'infini|\n||\nQuand la mer bergère m'ap-|pelle|\"\n"
  },
  {
    "artist": "Alain Bashung",
    "title": "La nuit je mens",
    "year": 1998,
    "difficulty": 3,
    "video": "",
    "tutorial": "",
    "comment": "Deux ryhtmiques principales.\nPlus une variante de chaque ryhtmique pour commencer une partie.\nPlus une ryhtmique pour terminer une partie.\nTrois accords barrés.",
    "tuning": "standard",
    "capo": 0,
    "signature": {
      "key": "C",
      "time": {"beatsPerBar": "4", "beatDuration": ":q", "symbol": "4/4"},
      "tempo": 80,
      "shuffle": ""
    },
    "chords": [
      {
        "id": 1,
        "name": "G",
        "tablature": "320003",
        "fingering": "210003/-",
        "comment": "G à 3 doigts"
      },
      {
        "id": 2,
        "name": "Em",
        "tablature": "022000",
        "fingering": "023000/-",
        "comment": ""
      },
      {
        "id": 3,
        "name": "Bm",
        "tablature": "x24432",
        "fingering": "013421/2",
        "comment": "Forme de Am barré en 2"
      },
      {
        "id": 4,
        "name": "Bsus2",
        "tablature": "x24422",
        "fingering": "013411/2",
        "comment": "Bm sans le majeur"
      },
      {
        "id": 5,
        "name": "Asus2",
        "tablature": "x02200",
        "fingering": "001200/-",
        "comment": "Am sans l'index"
      },
      {
        "id": 6,
        "name": "Asus4",
        "tablature": "x02230",
        "fingering": "001240/-",
        "comment": "Am avec petit doigt en case 3 de corde B"
      },
      {
        "id": 7,
        "name": "G/F#",
        "tablature": "2x0003",
        "fingering": "100003/-",
        "comment": "Etouffer corde A avec l'index qui frette la corde E"
      },
      {
        "id": 8,
        "name": "A",
        "tablature": "x0222x",
        "fingering": "001230/-",
        "comment": "A avec corde e étoufée (pas hyper important)"
      },
      {
        "id": 9,
        "name": "F#m",
        "tablature": "244222",
        "fingering": "134111/2",
        "comment": "Forme de Em barré en 2"
      },
      {
        "id": 10,
        "name": "G'",
        "tablature": "355433",
        "fingering": "134211/3",
        "comment": "Forme de E barré en 3"
      }
    ],
    "rhythms": [
      {
        "id": 1,
        "name": "R1",
        "score": ":8()d:16()d()u :8()d:16()d()u :8()d:16()d()u :16()d()u()d()u"
      },
      {
        "id": 2,
        "name": "R2",
        "score": ":8()d:16()d()u :8()d:16()d()u :16T():8()u:16()u :16()d()u()d()u"
      },
      {
        "id": 3,
        "name": "R3",
        "score": ":8()d:16()d()u :16()d()u:8()d :8()d:16()d()u :16()d()u:8()d"
      },
      {
        "id": 4,
        "name": "R1B",
        "score": ":q()d> :8()d:16()d()u :8()d:16()d()u :16()d()u()d()u"
      },
      {
        "id": 5,
        "name": "R2B",
        "score": ":q()d> :8()d:16()d()u :16T():8()u:16()u :16()d()u()d()u"
      }
    ],
    "parts": [
      {
        "id": 1,
        "name": "Intro",
        "phrases": [
          {"bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 2, "chords": [1]}]}
        ]
      },
      {
        "id": 2,
        "name": "Verse A",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 2]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 5]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [6, 6, 6, 6, 6, 6, 5]},
              {"rhythm": 2, "chords": [1]},
              {"rhythm": 2, "chords": [1]}
            ]
          },
          {
            "bars": [
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [1]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 3, "chords": [2, 2, 2, 2, 2, 2, 5]}
            ]
          }
        ]
      },
      {
        "id": 3,
        "name": "Chorus B",
        "phrases": [
          {
            "bars": [
              {"rhythm": 5, "chords": [3]},
              {"rhythm": 2, "chords": [10]},
              {"rhythm": 2, "chords": [3]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 1, 1, 1, 7]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 3, "chords": [1, 1, 1, 1, 1, 1, 2]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]}
            ]
          }
        ]
      },
      {
        "id": 4,
        "name": "Verse C",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 2]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 2]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [8]},
              {"rhythm": 2, "chords": [8]},
              {"rhythm": 2, "chords": [9]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [8]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 1, 1, 1, 7]},
              {"rhythm": 2, "chords": [8]},
              {"rhythm": 2, "chords": [2]}
            ]
          }
        ]
      },
      {
        "id": 5,
        "name": "Verse A'",
        "phrases": [
          {
            "bars": [
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 2]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 5]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [6, 6, 6, 6, 6, 6, 5]},
              {"rhythm": 2, "chords": [1]},
              {"rhythm": 2, "chords": [1]}
            ]
          }
        ]
      },
      {
        "id": 6,
        "name": "Chorus B'",
        "phrases": [
          {
            "bars": [
              {"rhythm": 5, "chords": [3]},
              {"rhythm": 2, "chords": [10]},
              {"rhythm": 2, "chords": [3]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 1, 1, 1, 7]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [2]}
            ]
          },
          {
            "bars": [
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [1]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]},
              {"rhythm": 2, "chords": [1]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [8]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [2]}
            ]
          },
          {
            "bars": [
              {"rhythm": 5, "chords": [3]},
              {"rhythm": 2, "chords": [10]},
              {"rhythm": 2, "chords": [3]},
              {"rhythm": 1, "chords": [1, 1, 1, 1, 1, 1, 1, 1, 1, 7]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [2]},
              {"rhythm": 2, "chords": [5]},
              {"rhythm": 2, "chords": [3, 3, 3, 3, 3, 4, 4, 3]}
            ]
          }
        ]
      }
    ],
    "structure": [
      {"part": 1, "lyrics": ""},
      {"part": 2, "lyrics": ""},
      {"part": 3, "lyrics": ""},
      {"part": 4, "lyrics": ""},
      {"part": 3, "lyrics": ""},
      {"part": 5, "lyrics": ""},
      {"part": 6, "lyrics": ""}
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"Alain Bashung\"\nTITLE \"La nuit je mens\"\nYEAR 1998\nDIFFICULTY 3\nVIDEO \"\"\nTUTORIAL \"\"\nCOMMENT \"Deux ryhtmiques principales.\nPlus une variante de chaque ryhtmique pour commencer une partie.\nPlus une ryhtmique pour terminer une partie.\nTrois accords barrés.\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 0\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY C\nTIME 4/4 4 :q\nTEMPO 80\nSHUFFLE \"\"\n\n##########\n# CHORDS #\n##########\n\nCHORD G     320003 210003/- \"G à 3 doigts\"\nCHORD Em    022000 023000/-\nCHORD Bm    x24432 013421/2 \"Forme de Am barré en 2\"\nCHORD Bsus2 x24422 013411/2 \"Bm sans le majeur\"\nCHORD Asus2\tx02200 001200/- \"Am sans l'index\"\nCHORD Asus4\tx02230 001240/- \"Am avec petit doigt en case 3 de corde B\"\nCHORD G/F#\t2x0003 100003/- \"Etouffer corde A avec l'index qui frette la corde E\"\nCHORD A     x0222x 001230/- \"A avec corde e étoufée (pas hyper important)\"\nCHORD F#m   244222 134111/2 \"Forme de Em barré en 2\"\nCHORD G'    355433 134211/3 \"Forme de E barré en 3\"\n\n###########\n# RHYTHMS #\n###########\n\nRHYTHM R1\t\":8()d:16()d()u :8()d:16()d()u :8()d:16()d()u :16()d()u()d()u\"\nRHYTHM R2\t\":8()d:16()d()u :8()d:16()d()u :16T():8()u:16()u :16()d()u()d()u\"\nRHYTHM R3\t\":8()d:16()d()u :16()d()u:8()d :8()d:16()d()u :16()d()u:8()d\"\nRHYTHM R1B\t\":q()d> :8()d:16()d()u :8()d:16()d()u :16()d()u()d()u\"\nRHYTHM R2B\t\":q()d> :8()d:16()d()u :16T():8()u:16()u :16()d()u()d()u\"\n\n#########\n# PARTS #\n#########\n\nBLOCK Bm*\t[R2*Bm:::::Bsus2::Bm]\nBLOCK A1\t[R1*G::::::Em] Bm* [R1*G::::::Asus2] Bm* [R2*Asus2] [R2*Asus4::::::Asus2] [R2*G] %\nBLOCK A2\t[R2*Asus2] % [R2*G] Bm* [R2*Asus2] [R2*Em] [R3*Em::::::Asus2]\nBLOCK B1\t[R2B*Bm] [R2*G'] [R2*Bm] [R1*G:::::::::G/F#] [R2*Em] [R2*Asus2] [R2*Em] %\nBLOCK B2\t[R3*G::::::Em] Bm*\nBLOCK B3\tBm* [R2*G] Bm* [R2*G] [R2*Em] [R2*A] [R2*Em] %\nBLOCK B4\t[R2*Asus2] Bm*\nBLOCK C1\t[R1*G::::::Em] Bm* [R1*G::::::Em] Bm* [R2*A] % [R2*F#m] Bm* [R2*A] Bm* [R2*Em] [R1*G:::::::::G/F#] [R2*A] [R2*Em]\n\nPART \"Intro\" \t\t[R1*G] [R2*G]\nPART \"Verse A\"\t\tA1 || A2\nPART \"Chorus B\"\t\tB1 B2\nPART \"Verse C\"\t\tC1\nPART \"Verse A'\"\t\tA1\nPART \"Chorus B'\"\tB1 || B3 || B1 B4\n\n#############\n# STRUCTURE #\n#############\n\nSTRUCTURE\n\"Intro\" \"\"\n\"Verse A\" \"\"\n\"Chorus B\" \"\"\n\"Verse C\" \"\"\n\"Chorus B\" \"\"\n\"Verse A'\" \"\"\n\"Chorus B'\" \"\"\n"
  },
  {
    "artist": "Bob Marley",
    "title": "Who The Cap Fit",
    "year": 1900,
    "difficulty": 3,
    "video": "",
    "tutorial": "",
    "comment": "",
    "tuning": "standard",
    "capo": 0,
    "signature": {
      "key": "C",
      "time": {"beatsPerBar": "4", "beatDuration": ":q", "symbol": "4/4"},
      "tempo": 85,
      "shuffle": ""
    },
    "chords": [
      {
        "id": 1,
        "name": "G",
        "tablature": "320033",
        "fingering": "210034/-",
        "comment": ""
      },
      {
        "id": 2,
        "name": "Am",
        "tablature": "x02210",
        "fingering": "T02310/-",
        "comment": ""
      },
      {
        "id": 3,
        "name": "C",
        "tablature": "x32010",
        "fingering": "T32010/-",
        "comment": ""
      },
      {
        "id": 4,
        "name": "D",
        "tablature": "xx0232",
        "fingering": "T00132/-",
        "comment": ""
      },
      {
        "id": 5,
        "name": "Em",
        "tablature": "022000",
        "fingering": "023000/-",
        "comment": ""
      }
    ],
    "rhythms": [
      {"id": 1, "name": "R1", "score": ":8 (#) ()u (#) ()u (#) ()u (#) ()u"}
    ],
    "parts": [
      {
        "id": 1,
        "name": "Verse A",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]
          },
          {"bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]}
        ]
      },
      {
        "id": 2,
        "name": "Verse B",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [3]}, {"rhythm": 1, "chords": [4]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [3]}, {"rhythm": 1, "chords": [4]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [3]}, {"rhythm": 1, "chords": [4]}]
          },
          {"bars": [{"rhythm": 1, "chords": [3]}, {"rhythm": 1, "chords": [4]}]}
        ]
      },
      {
        "id": 3,
        "name": "Chorus",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [5]}, {"rhythm": 1, "chords": [2]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [5]}, {"rhythm": 1, "chords": [2]}]
          },
          {
            "bars": [{"rhythm": 1, "chords": [5]}, {"rhythm": 1, "chords": [2]}]
          },
          {"bars": [{"rhythm": 1, "chords": [5]}, {"rhythm": 1, "chords": [2]}]}
        ]
      },
      {
        "id": 4,
        "name": "Interlude",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]
          },
          {"bars": [{"rhythm": 1, "chords": [1]}, {"rhythm": 1, "chords": [2]}]}
        ]
      },
      {
        "id": 5,
        "name": "Outro",
        "phrases": [
          {
            "bars": [{"rhythm": 1, "chords": [5]}, {"rhythm": 1, "chords": [2]}]
          },
          {"bars": [{"rhythm": 1, "chords": [5]}, {"rhythm": 1, "chords": [2]}]}
        ]
      }
    ],
    "structure": [
      {"part": 1, "lyrics": ""},
      {"part": 2, "lyrics": ""},
      {"part": 3, "lyrics": ""},
      {"part": 1, "lyrics": ""},
      {"part": 2, "lyrics": ""},
      {"part": 3, "lyrics": ""},
      {"part": 4, "lyrics": ""},
      {"part": 2, "lyrics": ""},
      {"part": 3, "lyrics": ""},
      {"part": 5, "lyrics": ""}
    ],
    "source": "#################\n# SONG METADATA #\n#################\n\nARTIST \"Bob Marley\"\nTITLE \"Who The Cap Fit\"\nYEAR 1900\nDIFFICULTY 3\nVIDEO \"\"\nTUTORIAL \"\"\nCOMMENT \"\"\n\n################\n# GUITAR SETUP #\n################\n\nTUNING standard\nCAPO 0\n\n##########################\n# KEY AND TIME SIGNATURE #\n##########################\n\nKEY C\nTIME 4/4 4 :q\nTEMPO 85\nSHUFFLE \"\"\n\n##########\n# CHORDS #\n##########\n\nCHORD G   320033 210034/-\nCHORD Am\tx02210 T02310/-\nCHORD C\t  x32010 T32010/-\nCHORD D\t  xx0232 T00132/-\nCHORD Em\t022000 023000/-\n\n###########\n# RHYTHMS #\n###########\n\nRHYTHM R1\t\":8 (#) ()u (#) ()u (#) ()u (#) ()u\"\n\n#########\n# PARTS #\n#########\n\nBLOCK A [R1*G]  [R1*Am]\nBLOCK B [R1*C]  [R1*D]\nBLOCK C [R1*Em] [R1*Am]\n\nPART \"Verse A\"  A || A\nPART \"Verse B\"  B || B || B || B\nPART \"Chorus\"   C || C || C || C\nPART \"Interlude\"  A || A\nPART \"Outro\"   C || C\n\n#############\n# STRUCTURE #\n#############\n\nSTRUCTURE\n\n\"Verse A\" \"\"\n\"Verse B\" \"\"\n\"Chorus\" \"\"\n\n\"Verse A\" \"\"\n\"Verse B\" \"\"\n\"Chorus\" \"\"\n\n\"Interlude\" \"\"\n\"Verse B\" \"\"\n\"Chorus\" \"\"\n\"Outro\" \"\"\n"
  }
];

// https://github.com/rollup/rollup/issues/1803/
// import $ from 'jQuery'
let $ = window.jQuery;

// https://github.com/rollup/rollup/issues/1803/
// import { VexTab, Artist, Vex } from 'vextab'
let VexTab$$1 = window.VexTab;
let Artist = window.Artist;
let Vex = window.Vex;

Artist.NOLOGO = true;

// get a random sample songcheat and compile it
let sample = samples[Math.floor(Math.random() * samples.length)];
let compiler = new Compiler(sample, 0);
let songcheat = compiler.scc;
$('body>h1').html(`${songcheat.title} (${songcheat.artist}, ${songcheat.year})`);

// parse lyrics and show warnings if any
for (let unit of songcheat.structure) {
  let warnings = compiler.parseLyrics(unit);
  if (warnings.length > 0) $('body').append($('<p>').html('Parse warnings for unit ' + unit.name + ':\n - ' + warnings.join('\n- ')).css('color', 'red'));
}

// parse and render rhythms with vextab
for (let rhythm of songcheat.rhythms) {
  let $divRhythm = $('<div>');
  $('canvas').before($divRhythm);

  try {
    console.info('Converting rhythm to vextab score...');
    let score = 'options tempo=' + songcheat.signature.tempo + ' player=false tab-stems=false tab-stem-direction=up\n';
    score += VexTab$1.Notes2Stave(songcheat, 0, rhythm.compiledScore, true, 'top', 'Rhythm ' + (rhythm.name || rhythm.id), 1, true, false) + ' options space=20';
    console.info('Parsing score...');
    let artist = new Artist(10, 10, 600, { scale: 1.0 });
    let vextab = new VexTab$$1(artist);
    vextab.parse(score);
    console.info('Rendering score...');
    artist.render(new Vex.Flow.Renderer($divRhythm[0], Vex.Flow.Renderer.Backends.SVG));
    console.info('Score done!');
  } catch (e) {
    $divRhythm.html(e.message).css('color', 'red');
    console.error(e);
  }
}

// parse and render full song score with vextab
try {
  console.info('Converting songcheat to vextab score...');
  let score = VexTab$1.Songcheat2VexTab(songcheat);
  console.info('Parsing score...');
  let artist = new Artist(10, 10, 1200, {scale: 1.0});
  let vextab = new VexTab$$1(artist);
  vextab.parse(score);
  console.info('Rendering score...');
  artist.render(new Vex.Flow.Renderer($('canvas')[0], Vex.Flow.Renderer.Backends.CANVAS));
  console.info('Score done!');
} catch (e) {
  $('body').append($('<p>').html(e.message).css('color', 'red'));
  console.error(e);
}

})));
//# sourceMappingURL=test.vextab.umd.js.map
