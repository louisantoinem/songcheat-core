export class TokenizerException extends Error {
  constructor (line, message) {
    super('Parser error at line ' + line + ': ' + message)
  }
  toString () {
    return this.message
  }
}

export class Tokenizer {
  static tokenize (text) {
    let tokens = []
    let currentToken = ''
    let inQuotes = false
    let inComment = false
    let lastChar = null
    let lineNumber = 1

    for (let char of [...text]) {
      // ignore DOS newlines
      if (char === '\r') continue

      // ignore all characters coming after a "#" up to end of line
      if (char === '\n') {
        lineNumber++
        inComment = false
      }
      if (inComment) continue

      if (char === '"') {
        // escaped quote: replace final \ by "
        if (lastChar === '\\') currentToken = currentToken.replace(/\\$/, '"')
        // non escaped quote: set or clear inQuotes
        else inQuotes = inQuotes ? false : lineNumber
      } else if (inQuotes) {
        // character enclosed in quotes
        currentToken += char
      } else if (char.match(/\s/)) {
        // (non consecutive) space (i.e. space, tab or newline) : register previous token
        if (lastChar && !lastChar.match(/\s/)) tokens.push({ value: currentToken, line: lineNumber })
        currentToken = ''
      } else if (char === '#' && (lastChar === null || lastChar.match(/\s/))) {
        // hashtag at start of line or after a space: start comment
        inComment = true
        continue
      } else {
        // normal character : append to current token
        currentToken += char
      }

      lastChar = char
    }

    if (inQuotes) throw new TokenizerException(inQuotes, `Unmatched quote`)

    // register last token
    if (lastChar && !lastChar.match(/\s/)) tokens.push({ value: currentToken, line: lineNumber })

    return tokens
  }
}
