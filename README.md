SongCheat Core
--------------

Base classes for handling songcheat files. Can be used both in Node and in browser.

* Utils

* Parser

* Compiler

* ChordPix containing two static methods:
  - parse: parses a ChordPix URL into a chord object
  - url: returns the ChordPix URL corresponding to the given chord object

  Can be used both in Node and in browser.

* VexTab: allows converting a SongCheat to a VexTab string.
Can be used both in Node and in browser (but actually displaying the generated VexTab requires a browser).

* Player: plays a SongCheat through the web audio API.
Can be used in browser only (no Audio API available in Node yet).
