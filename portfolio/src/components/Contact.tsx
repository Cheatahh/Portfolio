import './Contact.css';

import {data} from '../data.ts';
import {ArrowUpRight, LinkIcon, Mail} from './Icons.tsx';

export function Contact() {
    const {profile} = data;
    const primary = profile.links[0];
    return (
        <section id="contact" className="section">
            <div className="container">
                <div className="contact card reveal">
                    <h2 className="eyebrow"><span><span aria-hidden="true">07 · </span>Contact</span></h2>
                    <p className="contact-title">
                        <span className="gradient-text">Let's talk.</span>
                    </p>
                    <p className="contact-lead">
                        I'm interested in software engineering, tech lead and IT roles, ideally hybrid. If you think
                        I'd be a good fit, or you just want to talk about Kotlin, compilers, graphics or self-hosted AI,
                        get in touch.
                    </p>
                    <div className="contact-actions">
                        {profile.email ? (
                            <a className="btn btn-primary" href={`mailto:${profile.email}`}>
                                <Mail/> {profile.email}
                            </a>
                        ) : primary && (
                            <a className="btn btn-primary" href={primary.url} target="_blank" rel="noreferrer">
                                <LinkIcon kind={primary.kind}/> Message me on {primary.label}
                            </a>
                        )}
                        {profile.links.slice(profile.email ? 0 : 1).map(link => (
                            <a key={link.url} className="btn btn-ghost" href={link.url} target="_blank"
                               rel="noreferrer">
                                <LinkIcon kind={link.kind}/> {link.label} <ArrowUpRight/>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
