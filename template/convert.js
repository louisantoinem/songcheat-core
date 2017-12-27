const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile);

(async function () {
  for (const file of ['template.txt']) {
    try {
      // read source and write JSON file
      const source = await readFile('template/' + file, 'utf8')
      fs.writeFileSync('dist/' + file.replace(/(\.[^.]*)$/, '.json'), JSON.stringify(source))
      console.info('[' + file + '] JSON file written successfully')
    } catch (e) {
      console.error('[' + file + '] ' + e.toString())
      console.error(e)
    }
  }
})()
