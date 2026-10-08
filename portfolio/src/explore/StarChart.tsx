import type {CSSProperties} from 'react';
import {Close} from '../components/Icons.tsx';
import {map} from './galaxyData.ts';

interface Props {
    open: boolean;
    discovered: ReadonlySet<string>;
    orbit: string | null;
    target: string | null;
    onClose(): void;
    onSelect(id: string): void;
}

export function StarChart({open, discovered, orbit, target, onClose, onSelect}: Props) {
    const focusable = open ? 0 : -1;

    return (
        <nav className={`gx-chart ${open ? 'open' : ''}`} aria-label="Star chart" aria-hidden={!open}>
            <header className="gx-chart-head">
                <div>
                    <p className="gx-kicker">Navigation</p>
                    <h2>Star chart</h2>
                </div>
                <button className="gx-icon-btn" onClick={onClose} aria-label="Close star chart" tabIndex={focusable}>
                    <Close/>
                </button>
            </header>

            <div className="gx-chart-scroll">
                {map.constellations.map(constellation => {
                    const stars = map.stars.filter(s => s.constellation === constellation.id);
                    const charted = stars.filter(s => discovered.has(s.id)).length;
                    return (
                        <section key={constellation.id} style={{'--c': constellation.color} as CSSProperties}>
                            <h3>
                                <span className="gx-dot"/>
                                {constellation.name}
                                <small>{charted}/{stars.length}</small>
                            </h3>
                            <p>{constellation.description}</p>
                            <ul>
                                {stars.map(star => (
                                    <li key={star.id}>
                                        <button className={discovered.has(star.id) ? 'charted' : ''}
                                                onClick={() => onSelect(star.id)}
                                                tabIndex={focusable}>
                                            <span className="gx-check" aria-hidden="true"/>
                                            <span className="gx-chart-label">{star.label}</span>
                                            {orbit === star.id && <em>in orbit</em>}
                                            {target === star.id && <em>en route</em>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </nav>
    );
}
