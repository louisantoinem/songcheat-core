import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/songcheat-core.cjs.js',
    format: 'cjs'
  },
  plugins: [
    resolve({}),
    commonjs({}),
    json({})
  ]
}
