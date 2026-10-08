import './CodeEditor.css';

import {useMemo, useState} from 'react';
import type {KeyboardEvent} from 'react';
import {tokenizeKotlin} from 'portfolioContent';

const INITIAL_SOURCE = `@JsExport
data class Engineer(
    val name: String = "Florian Stach",
    val stack: List<String> = listOf("Kotlin", "Android", "OutSystems"),
    val roles: Set<Role> = setOf(Role.IT_LEAD, Role.TECH_LEAD),
)

fun Engineer.solve(problem: Problem): Solution = when {
    problem.isHard -> deepDive(problem) // the fun part
    else -> ship(problem)
}

// Edit me: highlighted live by a lexer written in Kotlin
println("Hi, I'm \${Engineer().name}!")
`;

export function CodeEditor() {
    const [source, setSource] = useState(INITIAL_SOURCE);
    const {tokens, millis} = useMemo(() => {
        const start = performance.now();
        const tokens = tokenizeKotlin(source);
        return {tokens, millis: performance.now() - start};
    }, [source]);
    const lineCount = source.split('\n').length;
    const significant = tokens.filter(t => t.kind !== 'whitespace').length;
    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Tab' || e.shiftKey) return;
        e.preventDefault();
        const el = e.currentTarget;
        const {selectionStart, selectionEnd} = el;
        const next = source.slice(0, selectionStart) + '    ' + source.slice(selectionEnd);
        setSource(next);
        requestAnimationFrame(() => el.setSelectionRange(selectionStart + 4, selectionStart + 4));
    };
    return (
        <div className="editor">
            <div className="editor-bar">
                <span className="editor-dots" aria-hidden="true"><i/><i/><i/></span>
                <span className="editor-file">Engineer.kt</span>
                <button className="editor-reset"
                        onClick={() => setSource(INITIAL_SOURCE)}
                        disabled={source === INITIAL_SOURCE}>
                    reset
                </button>
            </div>
            <div className="editor-body">
                <div className="editor-gutter" aria-hidden="true">
                    {Array.from({length: lineCount}, (_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                <div className="editor-code">
                    <pre aria-hidden="true">
                        {tokens.map((t, i) => <span key={i} className={`tok-${t.kind}`}>{t.text}</span>)}
                        {source.endsWith('\n') ? ' ' : null}
                    </pre>
                    <textarea value={source}
                              onChange={e => setSource(e.target.value)}
                              onKeyDown={onKeyDown}
                              wrap="off"
                              spellCheck={false}
                              autoCapitalize="off"
                              autoComplete="off"
                              autoCorrect="off"
                              aria-label="Editable Kotlin code sample"/>
                </div>
            </div>
            <div className="editor-status">
                <span><span className="editor-live"/> Kotlin → JS lexer</span>
                <span>{significant} tokens · {millis < 0.1 ? '<0.1' : millis.toFixed(1)} ms</span>
            </div>
        </div>
    );
}
