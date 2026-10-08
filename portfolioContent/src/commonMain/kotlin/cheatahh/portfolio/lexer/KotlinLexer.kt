@file:OptIn(ExperimentalJsExport::class)

package cheatahh.portfolio.lexer

import kotlin.js.JsExport

@JsExport
class Token(
    val kind: String,
    val text: String,
)

object TokenKind {
    const val KEYWORD = "keyword"
    const val TYPE = "type"
    const val FUNCTION = "function"
    const val IDENTIFIER = "identifier"
    const val STRING = "string"
    const val TEMPLATE = "template"
    const val NUMBER = "number"
    const val COMMENT = "comment"
    const val ANNOTATION = "annotation"
    const val OPERATOR = "operator"
    const val PUNCTUATION = "punctuation"
    const val WHITESPACE = "whitespace"
}

@JsExport
fun tokenizeKotlin(source: String): Array<Token> = KotlinLexer(source).tokenize()

private val KEYWORDS = setOf(
    "abstract", "actual", "annotation", "as", "break", "by", "catch", "class", "companion", "const",
    "constructor", "continue", "data", "do", "else", "enum", "expect", "false", "finally", "for", "fun",
    "if", "import", "in", "infix", "init", "inline", "interface", "internal", "is", "lateinit", "null",
    "object", "open", "operator", "out", "override", "package", "private", "protected", "public",
    "reified", "return", "sealed", "super", "suspend", "this", "throw", "true", "try", "typealias",
    "val", "value", "var", "vararg", "when", "where", "while",
)

private val TYPE_INTRODUCERS = setOf("class", "interface", "object", "typealias")

private val OPERATORS = listOf(
    "===", "!==", "..<", "?:", "?.", "::", "..", "->", "==", "!=", "<=", ">=", "&&", "||",
    "++", "--", "+=", "-=", "*=", "/=", "%=", "!!",
    "+", "-", "*", "/", "%", "=", "<", ">", "!", "?", "&", "|", "^", "~",
)

private const val PUNCTUATION = "{}()[],;.:"

private fun Char.isIdentStart() = isLetter() || this == '_'
private fun Char.isIdentPart() = isLetterOrDigit() || this == '_'

private class KotlinLexer(private val src: String) {
    private var pos = 0
    private val tokens = ArrayList<Token>()
    private var previous: Token? = null

    fun tokenize(): Array<Token> {
        while (pos < src.length) scan()
        return tokens.toTypedArray()
    }

    private fun peek(offset: Int = 0): Char =
        if (pos + offset < src.length) src[pos + offset] else '\u0000'

    private fun emit(kind: String, start: Int, end: Int = pos) {
        if (end <= start) return
        val token = Token(kind, src.substring(start, end))
        tokens += token
        if (kind != TokenKind.WHITESPACE && kind != TokenKind.COMMENT) previous = token
    }

    private inline fun advanceWhile(predicate: (Char) -> Boolean) {
        while (pos < src.length && predicate(src[pos])) pos++
    }

    private fun scan() {
        val start = pos
        val c = peek()
        when {
            c.isWhitespace() -> {
                advanceWhile { it.isWhitespace() }
                emit(TokenKind.WHITESPACE, start)
            }
            c == '/' && peek(1) == '/' -> {
                advanceWhile { it != '\n' }
                emit(TokenKind.COMMENT, start)
            }
            c == '/' && peek(1) == '*' -> {
                val close = src.indexOf("*/", pos + 2)
                pos = if (close < 0) src.length else close + 2
                emit(TokenKind.COMMENT, start)
            }
            c == '"' -> string()
            c == '\'' -> char()
            c.isDigit() -> number()
            c == '@' && peek(1).isIdentStart() -> {
                pos++
                advanceWhile { it.isIdentPart() }
                emit(TokenKind.ANNOTATION, start)
            }
            c == '`' -> {
                val close = src.indexOf('`', pos + 1)
                pos = if (close < 0 || src.substring(pos, close).contains('\n')) pos + 1 else close + 1
                emit(TokenKind.IDENTIFIER, start)
            }
            c.isIdentStart() -> identifier()
            else -> operatorOrPunctuation()
        }
    }

    private fun identifier() {
        val start = pos
        advanceWhile { it.isIdentPart() }
        val text = src.substring(start, pos)
        val prev = previous?.text
        val kind = when {
            text in KEYWORDS -> TokenKind.KEYWORD
            prev in TYPE_INTRODUCERS -> TokenKind.TYPE
            prev == "fun" || nextNonWhitespace() == '(' -> TokenKind.FUNCTION
            text[0].isUpperCase() -> TokenKind.TYPE
            else -> TokenKind.IDENTIFIER
        }
        emit(kind, start)
    }

    private fun nextNonWhitespace(): Char {
        var i = pos
        while (i < src.length && src[i] == ' ') i++
        return if (i < src.length) src[i] else '\u0000'
    }

    private fun number() {
        val start = pos
        if (peek() == '0' && (peek(1) == 'x' || peek(1) == 'X' || peek(1) == 'b' || peek(1) == 'B')) pos += 2
        advanceWhile { it.isLetterOrDigit() || it == '_' }
        if (peek() == '.' && peek(1).isDigit()) {
            pos++
            advanceWhile { it.isLetterOrDigit() || it == '_' }
        }
        emit(TokenKind.NUMBER, start)
    }

    private fun char() {
        val start = pos
        pos++
        if (peek() == '\\') pos += 2 else if (peek() != '\n') pos++
        if (peek() == '\'') pos++
        pos = minOf(pos, src.length)
        emit(TokenKind.STRING, start)
    }

    private fun string() {
        val raw = src.startsWith("\"\"\"", pos)
        val delimiter = if (raw) "\"\"\"" else "\""
        var segment = pos
        pos += delimiter.length
        while (pos < src.length) {
            if (src.startsWith(delimiter, pos)) {
                pos += delimiter.length
                break
            }
            val c = peek()
            when {
                !raw && c == '\n' -> break
                !raw && c == '\\' -> pos = minOf(pos + 2, src.length)
                c == '$' && peek(1) == '{' -> {
                    emit(TokenKind.STRING, segment)
                    val entry = pos
                    pos += 2
                    var depth = 1
                    while (pos < src.length && depth > 0) {
                        when (src[pos]) {
                            '{' -> depth++
                            '}' -> depth--
                        }
                        pos++
                    }
                    emit(TokenKind.TEMPLATE, entry)
                    segment = pos
                }
                c == '$' && peek(1).isIdentStart() -> {
                    emit(TokenKind.STRING, segment)
                    val entry = pos
                    pos++
                    advanceWhile { it.isIdentPart() }
                    emit(TokenKind.TEMPLATE, entry)
                    segment = pos
                }
                else -> pos++
            }
        }
        emit(TokenKind.STRING, segment)
    }

    private fun operatorOrPunctuation() {
        val start = pos
        val op = OPERATORS.firstOrNull { src.startsWith(it, pos) }
        when {
            op != null -> {
                pos += op.length
                emit(TokenKind.OPERATOR, start)
            }
            peek() in PUNCTUATION -> {
                pos++
                emit(TokenKind.PUNCTUATION, start)
            }
            else -> {
                pos++
                emit(TokenKind.IDENTIFIER, start)
            }
        }
    }
}
