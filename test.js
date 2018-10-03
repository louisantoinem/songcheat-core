let { Utils } = require('.')

// modules to test can be specified as command line options
let modules = ['utils', 'base', 'scale', 'chordpix']
let args = process.argv.slice(2)
if (args.length > 0) modules = args

// test each module
for (let m of modules) {
  Utils.BM(`Running test/${m}.js`, () => require('./test/' + m))
}
