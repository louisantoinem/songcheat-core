export default {
  input: 'src/main.js',
  output: [{
    file: 'dist/songcheat-core.esm.js',
    format: 'es'
  },
  {
    file: 'dist/songcheat-core.umd.js',
    format: 'umd'
  }
  ],
  name: 'songcheatCore'
}
