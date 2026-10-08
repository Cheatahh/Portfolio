import type {CSSProperties} from 'react';
import type {Star} from 'portfolioContent';
import {data} from '../data.ts';
import {ArrowRight, Close, LinkIcon} from '../components/Icons.tsx';
import {colorOf, constellationById, map} from './galaxyData.ts';

interface Props {
    star: Star;
    onClose(): void;
    onNext(): void;
    onRead(): void;
}

export function StarPanel({star, onClose, onNext, onRead}: Props) {
    const constellation = constellationById.get(star.constellation);
    const isHome = star.id === map.home;

    return (
        <aside className="gx-panel" style={{'--c': colorOf(star)} as CSSProperties} aria-live="polite">
            <button className="gx-icon-btn gx-panel-close" onClick={onClose} aria-label="Close">
                <Close/>
            </button>

            <p className="gx-kicker"><span className="gx-dot"/>{constellation?.name}</p>
            <h2>{star.title}</h2>
            <p className="gx-panel-sub">{star.subtitle}</p>
            {star.meta && <p className="gx-panel-meta">{star.meta}</p>}

            <div className="gx-panel-body">
                {star.description.map((paragraph, i) => <p key={i}>{paragraph}</p>)}

                {star.points.length > 0 && (
                    <ul className="bullets">
                        {star.points.map(point => <li key={point}>{point}</li>)}
                    </ul>
                )}

                {star.tags.length > 0 && (
                    <div className="tags">
                        {star.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                    </div>
                )}

                {isHome && (
                    <div className="gx-panel-links">
                        {data.profile.links.map(link => (
                            <a key={link.url} className="btn btn-ghost" href={link.url} target="_blank" rel="noreferrer">
                                <LinkIcon kind={link.kind}/> {link.label}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <footer className="gx-panel-actions">
                <button className="btn btn-ghost" onClick={onRead}>Read on the page</button>
                <button className="btn btn-primary" onClick={onNext}>
                    Next stop <ArrowRight/>
                </button>
            </footer>
        </aside>
    );
}
