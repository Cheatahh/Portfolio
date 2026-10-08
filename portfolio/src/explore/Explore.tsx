import './Explore.css';

import {type CSSProperties, useCallback, useEffect, useRef, useState} from 'react';
import {useMediaQuery} from '../hooks/useMediaQuery.ts';
import {ArrowLeft, ArrowRight, Close} from '../components/Icons.tsx';
import {GalaxyScene, type HudState} from './GalaxyScene.ts';
import {FLIGHT_KEYS, Input} from './input.ts';
import {colorOf, constellationById, loadDiscovered, map, nextStop, saveDiscovered, starById} from './galaxyData.ts';
import {StarPanel} from './StarPanel.tsx';
import {StarChart} from './StarChart.tsx';
import {TouchControls} from './TouchControls.tsx';

const TOTAL = map.stars.length;

const COMPACT_QUERY = '(max-width: 860px), (pointer: coarse)';

const KEYS: [string, string][] = [
    ['W / S', 'Thrust & brake'],
    ['A / D', 'Steer'],
    ['↑ / ↓', 'Tilt nose down / up'],
    ['← / →', 'Bank left / right'],
    ['E / Space', 'Climb'],
    ['Q / Ctrl', 'Descend'],
    ['Shift', 'Boost'],
    ['M', 'Star chart'],
    ['N', 'Next stop'],
];

interface Props {
    onExit(section?: string): void;
}

export default function Explore({onExit}: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    const minimapRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<GalaxyScene | null>(null);

    const [input, setInput] = useState<Input | null>(null);
    const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches);
    const [failed, setFailed] = useState(false);
    const [hud, setHud] = useState<HudState>({speed: 0, throttle: 0, autopilot: null, nearest: null});
    const [orbit, setOrbit] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState<string | null>(null);
    const [discovered, setDiscovered] = useState(loadDiscovered);
    const [chartOpen, setChartOpen] = useState(false);
    const [intro, setIntro] = useState(true);
    const [celebrate, setCelebrate] = useState(false);
    const compact = useMediaQuery(COMPACT_QUERY);
    const [reading, setReading] = useState<string | null>(null);

    const panelOpen = !!orbit && (compact ? reading === orbit : orbit !== dismissed);
    const panelStar = panelOpen ? starById.get(orbit!) : undefined;
    const closePanel = () => (compact ? setReading(null) : setDismissed(orbit));

    const latest = useRef({orbit, autopilot: hud.autopilot, discovered, chartOpen, intro, panelOpen: !!panelStar});
    latest.current = {orbit, autopilot: hud.autopilot, discovered, chartOpen, intro, panelOpen: !!panelStar};

    const flyTo = useCallback((id: string) => {
        sceneRef.current?.flyTo(id);
        setDismissed(null);
        setReading(null);
        setChartOpen(false);
        setIntro(false);
    }, []);

    const goNext = useCallback(() => {
        const {orbit, autopilot, discovered} = latest.current;
        flyTo(nextStop(autopilot ?? orbit, discovered).id);
    }, [flyTo]);

    useEffect(() => {
        const flightInput = new Input();
        let scene: GalaxyScene | null = null;
        try {
            scene = new GalaxyScene({
                container: stageRef.current!,
                minimap: minimapRef.current,
                galaxy: map,
                input: flightInput,
                callbacks: {onHud: setHud, onOrbit: setOrbit, onPick: flyTo},
            });
        } catch (error) {
            console.error(error);
            flightInput.dispose();
            setFailed(true);
            return;
        }
        const created = scene;
        sceneRef.current = created;
        setInput(flightInput);
        return () => {
            created.dispose();
            flightInput.dispose();
            sceneRef.current = null;
        };
    }, [flyTo]);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    useEffect(() => {
        setReading(null);
        if (!orbit) {
            setDismissed(null);
            return;
        }
        setIntro(false);
        if (discovered.has(orbit)) return;
        const next = new Set(discovered).add(orbit);
        setDiscovered(next);
        saveDiscovered(next);
        if (next.size === TOTAL) setCelebrate(true);
    }, [orbit]);

    useEffect(() => {
        sceneRef.current?.setDiscovered(discovered);
    }, [discovered, input]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
            const state = latest.current;
            switch (e.code) {
                case 'KeyM':
                    setChartOpen(open => !open);
                    break;
                case 'KeyN':
                    goNext();
                    break;
                case 'Escape':
                    if (state.chartOpen) setChartOpen(false);
                    else if (state.intro) setIntro(false);
                    else if (state.panelOpen) {
                        setDismissed(state.orbit);
                        setReading(null);
                    }
                    break;
                default:
                    if (state.intro && FLIGHT_KEYS.has(e.code)) setIntro(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext]);

    const resetProgress = () => {
        const empty = new Set<string>();
        setDiscovered(empty);
        saveDiscovered(empty);
        setCelebrate(false);
    };

    return (
        <div className={`gx ${compact ? 'compact' : ''}`} role="application" aria-label="3D portfolio explorer">
            <div className="gx-stage" ref={stageRef}/>

            <header className="gx-top">
                <button className="gx-btn" onClick={() => onExit()}>
                    <ArrowLeft/> <span>Back to page</span>
                </button>
                <button className={`gx-btn ${chartOpen ? 'active' : ''}`} onClick={() => setChartOpen(o => !o)}>
                    Star chart {!touch && <kbd>M</kbd>}
                </button>
                <button className="gx-btn" onClick={goNext}>
                    Next stop {!touch && <kbd>N</kbd>}
                </button>
                <button className="gx-btn gx-btn-square" onClick={() => setIntro(true)} aria-label="How to fly">?</button>
            </header>

            <aside className="gx-radar">
                <div className="gx-progress">
                    <span>Stars charted</span>
                    <strong>{discovered.size}<small>/{TOTAL}</small></strong>
                </div>
                <div className="gx-progress-bar">
                    <span style={{width: `${(discovered.size / TOTAL) * 100}%`}}/>
                </div>
                <canvas ref={minimapRef} className="gx-minimap" aria-label="Minimap. Click a star to fly there."/>
            </aside>

            <div className="gx-status">
                <div className="gx-speed" aria-hidden="true">
                    <span style={{width: `${hud.throttle * 100}%`}}/>
                </div>
                <Status hud={hud}
                        orbit={orbit}
                        onFly={flyTo}
                        onCancel={() => sceneRef.current?.cancelAutopilot()}
                        onRead={compact && !panelOpen ? setReading : undefined}/>
            </div>

            {touch && input && <TouchControls input={input}/>}

            <StarChart open={chartOpen}
                       discovered={discovered}
                       orbit={orbit}
                       target={hud.autopilot}
                       onClose={() => setChartOpen(false)}
                       onSelect={flyTo}/>

            {panelStar && (
                <StarPanel key={panelStar.id}
                           star={panelStar}
                           onClose={closePanel}
                           onNext={goNext}
                           onRead={() => onExit(panelStar.section)}/>
            )}

            {intro && !failed && (
                <div className="gx-intro">
                    <div className="gx-intro-card">
                        <p className="gx-kicker">Explore mode</p>
                        <h2>Fly through my <span className="gradient-text">career</span></h2>
                        <p>
                            Every star is a stop in my CV: roles, degrees, research, projects and skills.
                            Fly close to a star to read about it, or tap one to let the autopilot take you there.
                        </p>

                        {touch ? (
                            <ul className="gx-keys">
                                <li><kbd>Left pad</kbd> Steer & thrust</li>
                                <li><kbd>▲ ▼</kbd> Climb & descend</li>
                                <li><kbd>Tap</kbd> a star to fly there</li>
                            </ul>
                        ) : (
                            <ul className="gx-keys">
                                {KEYS.map(([key, action]) => <li key={key}><kbd>{key}</kbd> {action}</li>)}
                            </ul>
                        )}

                        <div className="gx-intro-actions">
                            <button className="btn btn-primary" onClick={() => flyTo(nextStop(null, discovered).id)}>
                                {discovered.size > 0 ? 'Continue the tour' : 'Start the guided tour'} <ArrowRight/>
                            </button>
                            <button className="btn btn-ghost" onClick={() => setIntro(false)}>Fly freely</button>
                        </div>
                    </div>
                </div>
            )}

            {celebrate && (
                <div className="gx-toast" role="status">
                    <button className="gx-icon-btn" onClick={() => setCelebrate(false)} aria-label="Close">
                        <Close/>
                    </button>
                    <strong>All {TOTAL} stars charted ✦</strong>
                    <p>Thanks for flying by. If you liked the trip, let's talk.</p>
                    <div className="gx-toast-actions">
                        <button className="btn btn-primary" onClick={() => onExit('contact')}>Get in touch</button>
                        <button className="btn btn-ghost" onClick={resetProgress}>Reset chart</button>
                    </div>
                </div>
            )}

            {failed && (
                <div className="gx-intro">
                    <div className="gx-intro-card">
                        <p className="gx-kicker">Engines offline</p>
                        <h2>Your browser can't run 3D right now</h2>
                        <p>WebGL isn't available on this device, so the galaxy can't be rendered. The page has everything too.</p>
                        <div className="gx-intro-actions">
                            <button className="btn btn-primary" onClick={() => onExit()}>
                                <ArrowLeft/> Back to the page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface StatusProps {
    hud: HudState;
    orbit: string | null;
    onFly(id: string): void;
    onCancel(): void;
    onRead?: (id: string) => void;
}

function Status({hud, orbit, onFly, onCancel, onRead}: StatusProps) {
    if (hud.autopilot) {
        return (
            <p>
                Autopilot <ArrowRight/> <strong>{starById.get(hud.autopilot)?.label}</strong>
                <button className="gx-link" onClick={onCancel}>Take over</button>
            </p>
        );
    }
    if (orbit) {
        const star = starById.get(orbit)!;
        if (onRead) {
            return (
                <button key={orbit}
                        className="gx-peek"
                        style={{'--c': colorOf(star)} as CSSProperties}
                        onClick={() => onRead(orbit)}>
                    <span className="gx-dot"/>
                    <span className="gx-peek-text">
                        <small>In orbit · {constellationById.get(star.constellation)?.name}</small>
                        <strong>{star.label}</strong>
                    </span>
                    <span className="gx-peek-action">Read <ArrowRight/></span>
                </button>
            );
        }
        return <p>In orbit around <strong>{star.label}</strong></p>;
    }
    if (hud.nearest) {
        const star = starById.get(hud.nearest.id);
        return (
            <p>
                Nearest uncharted:{' '}
                <button className="gx-link" onClick={() => onFly(hud.nearest!.id)}>{star?.label}</button>
                <span className="gx-distance">{Math.round(hud.nearest.distance)} ly</span>
            </p>
        );
    }
    return <p>Every star charted. Fly wherever you like.</p>;
}
