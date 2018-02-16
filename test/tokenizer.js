let { Tokenizer, Utils } = require('..')
const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile);

(async function () {
  const source = await readFile('template/template.txt', 'utf8')
  let tokens = Utils.BM('Tokenizing template', () => { return Tokenizer.tokenize(source) })
  for (let token of tokens) console.log(`[TOKEN@L${token.line}] ${token.value}`)
})()
