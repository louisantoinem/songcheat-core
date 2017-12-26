import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'

import pkg from './package.json'

var BANNER = '/**\n' +
  ' * SongCheat Core ' + pkg.version + ' built on ' + new Date().toString() + '.\n ' +
  ' * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>\n' +
  ' *\n' +
  ' * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-core\n' +
  ' */\n'

export default {
  input: 'src/main.js',
  banner: BANNER,
  sourcemap: true,
  output: [{
    file: 'dist/songcheat-core.cjs.js',
    format: 'cjs'
  },
  {
    file: 'dist/songcheat-core.esm.js',
    format: 'es'
  }],
  plugins: [
    resolve({}),
    commonjs({}),
    json({}),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  ]
}
