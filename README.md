SongCheat Core
--------------

Base classes for handling songcheat files.
Can be used both in Node and in browser.

###### Internal utility classes

* `Utils`

  Some general static utility methods around strings, arrays, numbers as well as a benchmark function.

###### Internal classes representing base types as immutable value objects

Methods in these classes are either read-only or return a new object. They all implement an ad-hoc toString function so that these objects can easily be included in a string (debug messages etc.).

* `Duration`

  Represents a duration that can expressed with one code (:w :h :q :8 :16 or :32, with an additional 'd' for dotted). It can thus represent the duration of a note, rest, beat or bar. Beyond its nominal code, a duration can be part of a tuplet which will apply the corresponding ratio to the actual duration (expressed in 'units').

* `Time`

  Represents a time signature: duration of a beat (Duration) and number of beats in a bar.

* `Interval`

  Represents an arbitrary duration, in the context of the (mandatory) time signature given in the constructor.

  An interval is built by adding or subtracting a duration or another interval (`add`, `sub`). An interval can also be extended to the next multiple of the given duration (`extendToMultipleOf`) and we can check if an interval is a multiple of the given duration (`multipleOf`). An interval can be compared with another interval (`compare`) and static `min` and `max` comparison methods are also provided.

  The time signature is considered when displaying the interval (`codes`, `toString`), since we'll use the codes representing the beat and the bar (as defined the signature) to represent the interval; only if the interval is not a whole number of beats, other codes will be used to represent the remaining part of the interval. The time signature also allows implementing shortcut methods for `multipleOf` (`bar`, `beat`) and extendToMultipleOf (`extendToBar`, `extendToBeat`).

* `Pitch`

  Represents the pitch of a note such as A4, E2, C#5, Bb3, etc. Each code corresponds to a specific frequency in Hz.

  Pitch.transpose(halfTones): transpose an existing Pitch by a given number of half tones (positive or negative), providing a new Pitch instance.

* `Tuning`

  Represents the tuning of a guitar, i.e. one pitch for each string (starting from 6th string), e.g. new Tuning('E2,A2,D3,G3,B3,E4'). The following predefined names can also be used to create a Tuning instance: 'standard', 'guitalele', 'dropdb', 'eb'. One can also add '+n' or '-n' to transpose the tuning by n halftones, e.g. 'standard+5' is equivalent to 'guitalele'.

  Tuning.transpose(halfTones): transpose an existing Tuning by a given number of half tones (positive or negative), providing a new Tuning instance.

* `Fretboard`

  Represents a guitar fretboard, i.e. a tuning and a capo.

  Fretboard.pitch(string, fret): get the pitch corresponding to any fret on any string.

  Fretboard.chordPitches(chord): return the list of pitches used by the given Chord instance.

* `Chord`

  A chord is made of a name and a tablature (mandatory) as well as of a fingering and comment (optional).
  The constructor ensures that the tablature and fingering (if any) have a valid value (a ChordException is otherwise thrown).

* `Note`

  A note:
  - can be a `rest` (boolean)
  - has a `duration` (Duration)
  - can be `tied` (false or char chosen among [Tsbhpt])
  - has a `strings` pattern indicating which string should be played
  - has optional `flags` ({key: value} object)
  - has an optional `chord` (Chord)

  The actual structure of the `flags` object is not enforced at this stage. The `toString` method will display all flags as-is.

  The `playedStrings` method allows to apply our strings pattern on our chord. It returns an array with one { string, fret, mute } object for each string that is to be played. This method is used by Player for playing the string frequencies and by VexTab for drawing the tablature.

###### Internal classes representing SongCheat (mutable) objects

These classes are used by the compile process to convert the POJO returned by `Parser` into structured objects with useful methods. These classes also implement an ad-hoc toString function so that these objects can easily be included in a string (debug messages etc.).

* `Score`, `ScoreParser`

  A score is made of a time signature (Time) and a collection of notes ([Note]).
  You can add a note with `addNote` or a whole other score with `append`.
  The `length` property (Interval) can be used to get the current score length.
  The `start` method can be used to get an empty interval (zero offset) using the same time signature as the score.  

  The `alignOnNextNote` method takes an offset (Interval) and return this offset aligned on score's next note (i.e. the offset of the first note starting after the given offset).

  `ScoreParser` is used to convert a text score (i.e. a rhythm score in a SongCheat text file) into a `Score` object.
  See ... for a complete documentation of the syntax to use for such a rhythm score.

* `Group`, `GroupList`, `GroupParser`

  A group is a `text` (string) with optional `data` (object) at a given `offset` and with a given `length` (Interval). It represents some item (text and data) that is positioned somewhere on a score (offset) and with a given length, i.e. a chord change or a lyrics word group.

  A group list is simply of collection of such groups, built by adding groups (`add`) or another group list (`append`).

  The `groupAt` method takes an offset (Interval) and returns the last group starting before or at the given offset. This will be used by Rhythm.chordedScore to get the chord to use on each note.

  The `groupsStartingIn` method takes a group (which is not part of this group list) and returns a new `GroupList` instance keeping from our groups only the ones that start after or at the same offset as the given group and end before given group does. This will be used by Compiler.compileUnit to get the chord changes related to each lyrics group.

  `GroupParser` is used to convert a string using a well defined syntax into a `GroupList` object. See ... for a complete documentation of the syntax to use, both for lyrics as for chord changes in a bar. Such a group parser operates w.r.t. a given score, which will be used to interpret the "," instruction meaning "go to next note". Warnings will be issued when the parsed string results into groups that span beyond the related score.

* `Rhythm`

  A rhythm is made of a name and a score (`Score`). Notes in this score have no chord, except when inline tablature columns have been used in the rhythm text score.

  The `chordGroups` method uses `GroupParser` to parse given string into a `GroupList` w.r.t. our score, then assigns an actual `Chord` object as the `data` property in each group.

  The `chordedScore` method takes the resulting chord groups and uses it to create a chorded version of our score (notes created from an inline tablature column are not impacted as they already have a chord). Note that `chordGroups` and `chordedScore` are kept separate as `Compiler` also needs the chord groups in order to display them above lyrics (VexTab and Ascii).

###### Classes that can be used to create a SongCheat app

* `Parser`

  Parses a SongCheat text file into a POJO that can be stored to a JSON file if wanted and further compiled.

* `Compiler`

  Creates a 'compiled' version of the SongCheat POJO using classes described above (Chord, Rhythm, Score, GroupList).

* `ChordPix`

  Containing two static methods:
  - parse: parses a ChordPix URL into a `Chord` object
  - url: returns the ChordPix URL corresponding to the given `Chord` object

* `VexTab`

  Allows converting a SongCheat to a VexTab string.
  This class can be used both in Node and in browser, but actually displaying the generated VexTab requires a browser).

* `Ascii`

  Creates a configurable ascii string mixing lyrics and chord changes for a unit or part.

* `Player`

  Plays a Score through the web audio API.
  This class can be used in browser only (no Audio API available in Node yet).
