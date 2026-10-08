import './Projects.css';

import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {SectionHead} from './SectionHead.tsx';

function GraphArt() {
    const nodes = [
        {x: 150, y: 110, r: 16, label: 'LLM'},
        {x: 60, y: 50, r: 9, label: 'rdf'},
        {x: 250, y: 46, r: 10, label: 'docs'},
        {x: 46, y: 176, r: 8, label: 'room'},
        {x: 262, y: 170, r: 11, label: 'voice'},
        {x: 150, y: 210, r: 8, label: 'vpn'},
        {x: 140, y: 22, r: 6, label: 'sensors'},
    ];
    const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [2, 6], [3, 5], [4, 2], [1, 3]];
    return (
        <svg className="graph-art" viewBox="0 0 310 240" aria-hidden="true">
            <defs>
                <linearGradient id="graph-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#9db4ff"/>
                    <stop offset="1" stopColor="#cfa9ff"/>
                </linearGradient>
            </defs>
            {edges.map(([a, b], i) => (
                <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
                      className="graph-edge" style={delay(i * 300)}/>
            ))}
            {nodes.map((n, i) => (
                <g key={i}>
                    <circle cx={n.x} cy={n.y} r={n.r} className={i === 0 ? 'graph-core' : 'graph-node'}/>
                    {n.label && i !== 0 && (
                        <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" className="graph-label">{n.label}</text>
                    )}
                </g>
            ))}
            <text x={150} y={114} textAnchor="middle" className="graph-core-label">AI</text>
        </svg>
    );
}

export function Projects() {
    const [featured, ...others] = data.projects;
    return (
        <section id="projects" className="section">
            <div className="container">
                <SectionHead number="04" name="Projects"
                             title={<>Things I've <span className="gradient-text">built</span></>}
                             lead="Some of it at work, some of it at home, usually because I wanted something that didn't exist yet or I'm really bored."/>
                <article className="project-featured card reveal">
                    <div className="project-featured-body">
                        <span className="project-kind">{featured.kind}</span>
                        <h3>{featured.title}</h3>
                        <p className="project-desc">{featured.description}</p>
                        <ul className="bullets">
                            {featured.points.map(p => <li key={p}>{p}</li>)}
                        </ul>
                        <div className="tags">
                            {featured.tags.map(t => <span key={t} className="tag">{t}</span>)}
                        </div>
                    </div>
                    <div className="project-featured-art">
                        <GraphArt/>
                    </div>
                </article>
                <div className="project-grid">
                    {others.map((project, i) => (
                        <article key={project.title} className="project card reveal" style={delay(i * 80)}>
                            <span className="project-kind">{project.kind}</span>
                            <h3>{project.title}</h3>
                            <p className="project-desc">{project.description}</p>
                            <ul className="bullets">
                                {project.points.map(p => <li key={p}>{p}</li>)}
                            </ul>
                            <div className="tags">
                                {project.tags.map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
