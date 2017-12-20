import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

import pkg from './package.json'

var BANNER = '/**\n' +
  ' * SongCheat Core ' + pkg.version + ' built on ' + new Date().toString() + '.\n ' +
  ' * Copyright (c) 2017 Louis Antoine <louisantoinem@gmail.com>\n' +
  ' *\n' +
  ' * http://www.songcheat.io  http://github.com/louisantoinem/songcheat-core\n' +
  ' */\n'

export default {
  input: 'src/main.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/songcheat-core.esm.js',
    format: 'es'
  },
  {
    file: 'dist/songcheat-core.umd.js',
    format: 'umd'
  }
  ],
  name: 'songcheatCore',
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
}
