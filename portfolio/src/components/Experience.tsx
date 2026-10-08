import './Experience.css';

import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {SectionHead} from './SectionHead.tsx';

export function Experience() {
    return (
        <section id="experience" className="section">
            <div className="container">
                <SectionHead number="02" name="Experience"
                             title={<>Six years, <span className="gradient-text">one company</span></>}
                             lead="My career started in a dual study program at Fresenius, with a new department every year. Today I lead digitalization projects for manufacturing sites around the world."/>
                <ol className="timeline">
                    {data.experience.map((job, i) => (
                        <li key={job.role + job.period}
                            className={`timeline-item reveal ${job.current ? 'current' : ''}`}
                            style={delay(i * 60)}>
                            <span className="timeline-dot" aria-hidden="true"/>
                            <article className="card timeline-card">
                                <header>
                                    <div>
                                        <h3>{job.role}</h3>
                                        <p className="timeline-company">{job.company}</p>
                                        <p className="timeline-dept">{job.department}</p>
                                    </div>
                                    <div className="timeline-when">
                                        {job.current && <span className="timeline-now">Now</span>}
                                        <time>{job.period}</time>
                                        <span>{job.location}</span>
                                    </div>
                                </header>
                                {job.points.length > 0 && (
                                    <ul className="bullets">
                                        {job.points.map(p => <li key={p}>{p}</li>)}
                                    </ul>
                                )}
                                {job.rotations.length > 0 && (
                                    <ol className="rotations">
                                        {job.rotations.map(r => (
                                            <li key={r.period} className="rotation">
                                                <time>{r.period}</time>
                                                <div>
                                                    <h4>{r.role} <span>{r.department}</span></h4>
                                                    <p>{r.summary}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                                <div className="tags">
                                    {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
                                </div>
                            </article>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
