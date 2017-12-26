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

export default [{
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
      exclude: ['node_modules/**'] // only transpile our source code
    })
  ]
},
{
  input: 'test/vextab.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/test.vextab.esm.js',
    format: 'es'
  },
  {
    file: 'dist/test.vextab.umd.js',
    format: 'umd'
  }],
  external: ['jQuery'],
  globals: {'jQuery': '$'},
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
},
{
  input: 'test/chords.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/test.chords.esm.js',
    format: 'es'
  },
  {
    file: 'dist/test.chords.umd.js',
    format: 'umd'
  }],
  external: ['jQuery'],
  globals: {'jQuery': '$'},
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
},
{
  input: 'test/player.js',
  sourcemap: true,
  banner: BANNER,
  output: [{
    file: 'dist/test.player.esm.js',
    format: 'es'
  },
  {
    file: 'dist/test.player.umd.js',
    format: 'umd'
  }],
  external: ['jQuery'],
  globals: {'jQuery': '$'},
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
}
]
