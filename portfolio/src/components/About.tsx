// noinspection HtmlUnknownAnchorTarget

import './About.css';

import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {SectionHead} from './SectionHead.tsx';

export function About() {
    const {profile, languages, thesis} = data;
    const facts = [
        {label: 'Based in', value: profile.location},
        {label: 'Focus', value: profile.focus.join(' · ')},
        {label: 'Favourite language', value: 'Kotlin'},
        {label: 'Currently', value: 'Writing my master\'s thesis on JVM lexer generation'},
        {label: 'Speaks', value: languages.map(l => `${l.name} (${l.level})`).join(', ')},
    ];
    return (
        <section id="about" className="section">
            <div className="container">
                <SectionHead number="01" name="About"
                             title={<>Shipping software where it <span className="gradient-text">actually runs</span></>}/>
                <div className="about-grid">
                    <div className="about-text">
                        {profile.about.map((paragraph, i) => (
                            <p key={i} className="reveal" style={delay(i * 80)}>{paragraph}</p>
                        ))}
                    </div>
                    <aside className="about-facts card reveal" style={delay(120)} aria-label="Quick facts">
                        <div className="about-facts-head">
                            <span className="about-avatar">FS</span>
                            <div>
                                <strong>{profile.name}</strong>
                                <span>{profile.role}</span>
                            </div>
                        </div>
                        <dl>
                            {facts.map(f => (
                                <div key={f.label}>
                                    <dt>{f.label}</dt>
                                    <dd>{f.value}</dd>
                                </div>
                            ))}
                        </dl>
                        <a className="about-thesis" href="#research">
                            <span>Thesis</span>
                            {thesis.title}
                        </a>
                    </aside>
                </div>
            </div>
        </section>
    );
}
