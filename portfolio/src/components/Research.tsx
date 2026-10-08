// noinspection HtmlUnknownAnchorTarget

import './Research.css';

import {Fragment} from 'react';
import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {SectionHead} from './SectionHead.tsx';

export function Research() {
    const {thesis} = data;

    return (
        <section id="research" className="section">
            <div className="container">
                <SectionHead number="05" name="Research"
                             title={<>Compiling lexers <span className="gradient-text">ahead of time</span></>}
                             lead={thesis.degree}/>
                <div className="research card reveal">
                    <h3 className="research-title">{thesis.title}</h3>
                    <p className="research-summary">{thesis.summary}</p>
                    <div className="pipeline" aria-label="Generator pipeline">
                        {thesis.pipeline.map((stage, i) => (
                            <Fragment key={stage}>
                                {i > 0 && <span className="pipeline-arrow" aria-hidden="true"/>}
                                <span className="pipeline-stage" style={delay(i * 120)}>
                                    <small>{String(i + 1).padStart(2, '0')}</small>
                                    {stage}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                    <div className="research-columns">
                        <div>
                            <h4>Codegen backends</h4>
                            <div className="tags">
                                {thesis.backends.map(b => <span key={b} className="tag">{b}</span>)}
                            </div>
                        </div>
                        <div>
                            <h4>Benchmarked against</h4>
                            <div className="tags">
                                {thesis.baselines.map(b => <span key={b} className="tag">{b}</span>)}
                            </div>
                        </div>
                        <div className="research-methods">
                            <h4>Methodology</h4>
                            <ul className="bullets">
                                {thesis.methods.map(m => <li key={m}>{m}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="rq-grid">
                    {thesis.questions.map((q, i) => (
                        <article key={q.id} className="rq card reveal" style={delay(i * 70)}>
                            <div className="rq-head">
                                <span className="rq-id">{q.id}</span>
                                <span className="rq-topic">{q.topic}</span>
                            </div>
                            <p>{q.question}</p>
                        </article>
                    ))}
                    <aside className="rq rq-note reveal" style={delay(thesis.questions.length * 70)}>
                        <p>
                            The editor at the top of this page runs a small hand-written Kotlin lexer, compiled to
                            JavaScript. My thesis is about <em>generating</em> lexers like that one and making them fast.
                        </p>
                        <a href="#top">Try the editor ↑</a>
                    </aside>
                </div>
            </div>
        </section>
    );
}
