import './Education.css';

import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {SectionHead} from './SectionHead.tsx';

export function Education() {
    return (
        <section id="education" className="section section-tight">
            <div className="container">
                <SectionHead number="04" name="Education"
                             title={<>Learning <span className="gradient-text">while shipping</span></>}/>
                <div className="edu-grid">
                    {data.education.map((edu, i) => (
                        <article key={edu.degree} className="edu card reveal" style={delay(i * 80)}>
                            <div className="edu-top">
                                <time>{edu.period}</time>
                                <span className="tag">{edu.status}</span>
                            </div>
                            <h3>{edu.degree}</h3>
                            <p className="edu-school">{edu.school} · {edu.location}</p>
                            <ul className="bullets">
                                {edu.points.map(p => <li key={p}>{p}</li>)}
                            </ul>
                        </article>
                    ))}
                    <article className="edu edu-lang card reveal" style={delay(data.education.length * 80)}>
                        <h3>Languages</h3>
                        <ul>
                            {data.languages.map(l => (
                                <li key={l.name}>
                                    <span>{l.name}</span>
                                    <span className="edu-level">{l.level}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                </div>
            </div>
        </section>
    );
}
