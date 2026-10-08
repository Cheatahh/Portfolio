// noinspection HtmlUnknownAnchorTarget

import './Hero.css';

import {data} from '../data.ts';
import {delay} from '../utils.ts';
import {CodeEditor} from './CodeEditor.tsx';
import {EXPLORE_HASH} from '../hooks/useExploreRoute.ts';
import {ArrowRight, LinkIcon, MapPin, Rocket} from './Icons.tsx';

export function Hero() {
    const {profile} = data;
    const [first, ...rest] = profile.name.split(' ');
    return (
        <section id="top" className="hero">
            <div className="container hero-grid">
                <div className="hero-copy">
                    <div className="hero-badge reveal">
                        <span className="hero-badge-dot"/>
                        {profile.availability}
                    </div>
                    <h1 className="hero-title reveal" style={delay(80)}>
                        {first} <span className="gradient-text">{rest.join(' ')}</span>
                    </h1>
                    <p className="hero-role reveal" style={delay(140)}>
                        {profile.role}
                        {profile.focus.map(f => <span key={f}><i aria-hidden="true">/</i>{f}</span>)}
                    </p>
                    <p className="hero-tagline reveal" style={delay(200)}>
                        {profile.tagline}
                    </p>
                    <div className="hero-actions reveal" style={delay(260)}>
                        <a className="btn btn-primary" href="#experience">
                            See my work <ArrowRight/>
                        </a>
                        <a className="btn btn-ghost" href="#contact">Get in touch</a>
                        <a className="btn btn-ghost hero-explore" href={EXPLORE_HASH}>
                            <Rocket/> Explore in 3D
                        </a>
                    </div>
                    <div className="hero-meta reveal" style={delay(320)}>
                        <span><MapPin/> {profile.location}</span>
                        {profile.links.map(link => (
                            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                                <LinkIcon kind={link.kind}/> {link.label}
                            </a>
                        ))}
                    </div>
                </div>
                <div className="hero-visual reveal" style={delay(200)}>
                    <CodeEditor/>
                </div>
            </div>
            <div className="container">
                <ul className="hero-stats">
                    {profile.stats.map((stat, i) => (
                        <li key={stat.label} className="reveal"
                            style={delay(380 + i * 70)}>
                            <strong className="gradient-text">{stat.value}</strong>
                            <span>{stat.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
