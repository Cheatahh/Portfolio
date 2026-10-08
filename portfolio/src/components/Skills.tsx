import './Skills.css';

import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {SectionHead} from './SectionHead.tsx';

const STRONGEST = new Set([
    'Kotlin', 'C++',
    'Android', 'OutSystems',
    'ASM',
    'SQL performance tuning',
    'OpenGL',
    'Authentication', 'Cybersecurity',
    'IT lead', 'Tech lead'
]);

export function Skills() {
    return (
        <section id="skills" className="section">
            <div className="container">
                <SectionHead number="03" name="Skills"
                             title={<>The <span className="gradient-text">toolbox</span></>}
                             lead="Kotlin is home base. Over the years I've also picked up native mobile, low-code, compilers, AI, graphics and security."/>
                <div className="skills-grid">
                    {data.skills.map((group, i) => (
                        <div key={group.name} className="skill-group card reveal" style={delay(i * 60)}>
                            <h3>
                                <span className="skill-index">{String(i + 1).padStart(2, '0')}</span>
                                {group.name}
                            </h3>
                            <ul className="skill-list">
                                {group.skills.map(skill => (
                                    <li key={skill} className={STRONGEST.has(skill) ? 'strong' : ''}>{skill}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
