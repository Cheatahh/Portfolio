import {type PointerEvent, useRef, useState} from 'react';
import type {Input} from './input.ts';

const DEAD_ZONE = 0.12;

export function TouchControls({input}: { input: Input }) {
    const padRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const [knob, setKnob] = useState({x: 0, y: 0});

    const move = (e: PointerEvent) => {
        const rect = padRef.current!.getBoundingClientRect();
        const radius = rect.width / 2;
        let x = (e.clientX - rect.left - radius) / radius;
        let y = (e.clientY - rect.top - radius) / radius;
        const length = Math.hypot(x, y);
        if (length > 1) {
            x /= length;
            y /= length;
        }
        input.stick.x = Math.abs(x) < DEAD_ZONE ? 0 : x;
        input.stick.y = Math.abs(y) < DEAD_ZONE ? 0 : y;
        setKnob({x, y});
    };

    const release = () => {
        dragging.current = false;
        input.stick.x = 0;
        input.stick.y = 0;
        setKnob({x: 0, y: 0});
    };

    const lift = (value: number) => ({
        onPointerDown: () => {
            input.lift = value;
        },
        onPointerUp: () => {
            input.lift = 0;
        },
        onPointerLeave: () => {
            input.lift = 0;
        },
        onPointerCancel: () => {
            input.lift = 0;
        },
    });

    const trigger = (value: boolean) => () => {
        input.trigger = value;
    };

    return (
        <div className="gx-touch">
            <div ref={padRef}
                 className="gx-stick"
                 aria-label="Flight stick"
                 onPointerDown={e => {
                     e.currentTarget.setPointerCapture(e.pointerId);
                     dragging.current = true;
                     move(e);
                 }}
                 onPointerMove={e => dragging.current && move(e)}
                 onPointerUp={release}
                 onPointerCancel={release}>
                <span className="gx-stick-knob"
                      style={{transform: `translate(${knob.x * 34}px, ${knob.y * 34}px)`}}/>
            </div>

            <div className="gx-controls-right">
                <button className="gx-fire"
                        aria-label="Fire lasers"
                        onPointerDown={trigger(true)}
                        onPointerUp={trigger(false)}
                        onPointerLeave={trigger(false)}
                        onPointerCancel={trigger(false)}>✦</button>
                <div className="gx-lift">
                    <button aria-label="Climb" {...lift(1)}>▲</button>
                    <button aria-label="Descend" {...lift(-1)}>▼</button>
                </div>
            </div>
        </div>
    );
}
