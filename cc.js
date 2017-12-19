const { Utils, Parser, ParserException, Compiler, CompilerException } = require('.')
const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const stringify = require('json-stringify-pretty-compact')

let outputFile = process.argv.pop()
let inputFiles = process.argv.slice(2)

if (inputFiles.length === 0) {
  console.warn('Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' <file1> <file2> ... <samples output file>')
  process.exit(-1)
}

// capture console.log
var log = []
console.log = function () {
  for (let a of arguments) log.push(a.toString())
}

// create parser and compiler
let parser = new Parser()
let compiler = new Compiler(null, 1);

(async function () {
  const samples = []

  // for each file: load then compile
  for (const file of inputFiles) {
    try {
      // reset log
      log = []

      // parse source and write JSON file
      const source = await readFile(file, 'utf8')
      let songcheat = parser.parse(source)
      samples.push(songcheat)
      fs.writeFileSync(file.replace(/(\.[^.]*)$/, '$1') + '.json', stringify(songcheat))
      console.info('[' + file + '] JSON file written successfully')

      // compile songcheat
      let lyrics = []
      compiler.set(songcheat)

      // parse lyrics and show warnings if any
      for (let unit of compiler.scc.structure) {
        let warnings = compiler.parseLyrics(unit)
        if (warnings.length > 0) lyrics.push('Parse warnings for unit ' + unit.name + ':\n - ' + warnings.join('\n- '))
      }

      // get lyrics text in various styles
      lyrics.push(Utils.title('Split as entered / Compact'))
      for (let unit of compiler.scc.structure) lyrics.push('[' + unit.name + ']', compiler.getUnitText(unit, 1, 0, 'rhythm', false))
      lyrics.push(Utils.title('Split as entered / Respect durations'))
      for (let unit of compiler.scc.structure) lyrics.push('[' + unit.name + ']', compiler.getUnitText(unit, 0, 0, 'rhythm', true))
      lyrics.push(Utils.title('Split by 2 bars / Compact'))
      for (let unit of compiler.scc.structure) lyrics.push('[' + unit.name + ']', compiler.getUnitText(unit, 1, 2, 'rhythm', false))
      lyrics.push(Utils.title('Split by 2 bars / Respect durations'))
      for (let unit of compiler.scc.structure) lyrics.push('[' + unit.name + ']', compiler.getUnitText(unit, 0, 2, 'rhythm', true))

      fs.writeFileSync(file.replace(/(\.[^.]*)$/, '$1') + '.lyrics', lyrics.join('\n\n'))
      console.info('[' + file + '] LYRICS file written successfully')

      fs.writeFileSync(file.replace(/(\.[^.]*)$/, '$1') + '.log', log.join('\n'))
      console.info('[' + file + '] LOG file written successfully')
    } catch (e) {
      console.error('[' + file + '] ' + e.toString())
      if (!(e instanceof ParserException) && !(e instanceof CompilerException)) console.log(e)
    }
  }

  // write samples for web prototype
  fs.writeFileSync(outputFile, 'var samples = ' + stringify(samples))
  console.info(outputFile + ' written successfully')
})()
