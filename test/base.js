let { Utils, Chord, Note, Duration, Time, Interval, Pitch, Tuning, Fretboard, Score, ScoreParser, Rhythm, Group, GroupParser } = require('..')

function T (s) {
  console.log(Utils.title(s))
}

function L (o) {
  for (let k in o) console.log(`[${k}] ${o[k]}`)
}

T('Duration')
let triolet16 = new Duration(':16', 3, 2)
let beat = new Duration(':q')
let bar = new Duration(':w')

L({
  beat,
  bar,
  triolet16
})

T('Time')
let time = new Time(beat, 4, '4/4')

L({
  time
})

T('Note')
let quarter = new Note(new Duration(':q'))
let eigth = new Note(new Duration(':8'))
triolet16 = new Note(new Duration(':16', 3, 2))

L({
  quarter,
  eigth,
  triolet16
})

T('Interval')
let empty = new Interval(time)
let interval = empty.add(new Duration(':q'))
interval = interval.add(new Duration(':16', 3, 2))
let intervalExtendedToBeat = interval.extendToBeat()
let intervalExtendedToBar = interval.extendToBar()

L({
  empty,
  interval,
  intervalExtendedToBeat,
  intervalExtendedToBar,
  selfCompareSelf: interval.compare(interval),
  selfCompareBeat: interval.compare(intervalExtendedToBeat),
  beatCompareSelf: intervalExtendedToBeat.compare(interval)
})

T('Score')
empty = new Score(time)
let score = new Score(time)
for (let bar = 1; bar <= 2; bar++) {
  score.addNote(eigth)
  score.addNote(eigth)
  score.addNote(triolet16)
  score.addNote(triolet16)
  score.addNote(triolet16)
  score.addNote(eigth)
  score.addNote(quarter)
  score.addNote(eigth)
  score.addNote(eigth)
}
let intervalAlignedOnNextNote = score.alignOnNextNote(interval)

L({
  empty,
  score,
  length: score.length,
  intervalAlignedOnNextNote
})

T('ScoreParser')

let parser = new ScoreParser(time)
let scoreParsed = parser.parse(':8()():16()()()^3:8():q():8()():8()():16()()()^3:8():q():8()()')

L({
  score: scoreParsed,
  length: scoreParsed.length
})

T('Group')
empty = new Group('', new Interval(time))
let group = new Group('Test one bar from interval', interval, new Interval(time, bar))

L({
  empty,
  group
})

T('GroupList')

let groupParser = new GroupParser(score, beat, bar)

// let textGroups = groupParser.parse('')
// let textGroups = groupParser.parse(':Hello,,my:love, ,,,,,,,,,,,,,Is:it me:')
// let textGroups = groupParser.parse('Hello,,my:love, ,,,,,,,,,,,,,Is:it me')
// let textGroups = groupParser.parse(':Hello,,my|love,')
let textGroups = groupParser.parse("Hello:Is it:me|You're:looking:for?")
let chordGroups = groupParser.parse('Am|Em')

L({
  textGroups,
  chordGroups
})

console.log('Text group at first beat: ' + textGroups.groupAt(new Interval(time, beat)))
console.log('Text group at interval ' + textGroups.groupAt(interval))
console.log('Text group at first bar: ' + textGroups.groupAt(new Interval(time, bar)))

console.log('Chord group at first beat: ' + chordGroups.groupAt(new Interval(time, beat)))
console.log('Chord group at interval ' + chordGroups.groupAt(interval))
console.log('Chord group at first bar: ' + chordGroups.groupAt(new Interval(time, bar)))

console.log('Text groups starting in Am: ' + textGroups.groupsStartingIn(chordGroups.groupAt(new Interval(time, beat))))
console.log('Text groups starting in Em: ' + textGroups.groupsStartingIn(chordGroups.groupAt(new Interval(time, bar))))

T('Rhythm')

let chords = [
  {
    'name': 'A/E',
    'tablature': '00022x',
    'fingering': '000111/2',
    'comment': ''
  },
  {
    'name': 'E/G#',
    'tablature': '400450',
    'fingering': 'T00130',
    'comment': 'Doigté à la Clapton'
  }]
let Chords = []
for (let chord of chords) Chords.push(new Chord(chord.name, chord.tablature, chord.fingering, chord.comment, chord.inline))

empty = new Rhythm('EMPTY', time)

let rhythm = new Rhythm('R2', time, ':q(#)(#)(#):8(#) :16 {0-----}h{2-----} :8 (5) (3) :16 (2) h{----3-} p(2) ^3 :8 (3) (623) (6) (23) (623) :w (*)dd')
chordGroups = rhythm.chordGroups('A/E,,,,,,E/G#,,,20022x', Chords)
let chordedScore = rhythm.chordedScore(chordGroups)

L({
  empty,
  rhythm,
  chordGroups,
  chordedScore
})

T('Pitch')
let pitch1 = new Pitch('A2')
let pitch2 = new Pitch('D3')
let pitch3 = new Pitch('C4')
let pitch4 = new Pitch('A5')
let pitch5 = new Pitch('A#5')
let pitch6 = new Pitch('Ab5')

L({
  pitch1: pitch1.toString(true),
  pitch2: pitch2.toString(true),
  pitch3: pitch3.toString(true),
  pitch4: pitch4.toString(true),
  pitch5: pitch5.toString(true),
  pitch6: pitch6.toString(true)
})

T('Pitch (transpose)')
let pitch1AddOctaveQuinte = pitch1.transpose(19)
let pitch4SubOctaveQuarte = pitch4.transpose(-17)

L({
  pitch1AddOctaveQuinte,
  pitch4SubOctaveQuarte,
  'equal': pitch4SubOctaveQuarte.equals(pitch1AddOctaveQuinte)
})

T('Tuning')
let tuningStandard = new Tuning('standard')
let tuningGuitalele = new Tuning('guitalele')
let tuningDropd = new Tuning('dropd')
let tuningEb = new Tuning('eb')
let tuningStandardAddQuarte = new Tuning('standard+5')
let tuningStandardSubQuinte = new Tuning('standard-7')
let tuningCustom = new Tuning('E3,A3,D4,G4,B4,E5')
let tuningCustomSubHalftone = new Tuning('E3,A3,D4,G4,B4,E5-1')

L({
  tuningStandard,
  tuningGuitalele,
  tuningDropd,
  tuningEb,
  tuningStandardAddQuarte,
  tuningStandardSubQuinte,
  tuningCustom,
  tuningCustomSubHalftone
})

T('Tuning (transpose)')
tuningStandardAddQuarte = tuningStandard.transpose(5)
tuningStandardSubQuinte = tuningStandard.transpose(-7)
L({
  tuningStandardAddQuarte,
  'tuningStandardAddQuarte.equals(tuningGuitalele)': tuningStandardAddQuarte.equals(tuningGuitalele),
  tuningStandardSubQuinte,
  'tuningStandardSubQuinte.equals(tuningGuitalele)': tuningStandardSubQuinte.equals(tuningGuitalele)
})

T('Tuning (vextab)')
L({
  'tuningStandard': tuningStandard.vextab(),
  'tuningGuitalele': tuningGuitalele.vextab(),
  'tuningDropd': tuningDropd.vextab(),
  'tuningEb': tuningEb.vextab()
})

T('Fretboard')
let fretboardStandard = new Fretboard(tuningStandard, 0)
let fretboardStandardCapo12 = new Fretboard(tuningStandard, 12)
let fretboardGuitalele = new Fretboard(tuningGuitalele, 0)

L({
  fretboardStandard,
  'Em pitches standard': fretboardStandard.chordPitches(new Chord('Em', '022000')),
  'Am pitches standard': fretboardStandard.chordPitches(new Chord('Am', 'x02210')),
  'Em pitches standard capo 12': fretboardStandardCapo12.chordPitches(new Chord('Em', '022000')),
  fretboardGuitalele,
  'Em pitches guitalele (Bm shape)': fretboardGuitalele.chordPitches(new Chord('Em', 'x24432')),
  'Am pitches guitalele (Em shape)': fretboardGuitalele.chordPitches(new Chord('Am', '022000'))
})

for (let fret = 0; fret <= 3; fret++) {
  console.log('---')
  for (let string = 1; string <= 6; string++) {
    console.log(`String ${string} fret ${fret} : ${fretboardStandard.pitch(string, fret)}`)
  }
}
T('The End!')
