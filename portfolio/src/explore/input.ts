const clamp = (v: number) => Math.max(-1, Math.min(1, v));

const FORWARD = ['KeyW'];
const BACKWARD = ['KeyS'];
const LEFT = ['KeyA'];
const RIGHT = ['KeyD'];
const UP = ['KeyE'];
const DOWN = ['KeyQ', 'KeyC', 'ControlLeft', 'ControlRight'];
const FIRE = ['Space'];

const NOSE_DOWN = ['Numpad8', 'ArrowUp'];
const NOSE_UP = ['Numpad5', 'ArrowDown'];
const BANK_LEFT = ['Numpad4', 'ArrowLeft'];
const BANK_RIGHT = ['Numpad6', 'ArrowRight'];

export const FLIGHT_KEYS: ReadonlySet<string> = new Set([
    ...FORWARD, ...BACKWARD, ...LEFT, ...RIGHT, ...UP, ...DOWN, ...NOSE_DOWN, ...NOSE_UP, ...BANK_LEFT, ...BANK_RIGHT, ...FIRE,
]);

const isCtrl = (code: string) => code === 'ControlLeft' || code === 'ControlRight';

export class Input {
    private readonly keys = new Set<string>();
    readonly stick = {x: 0, y: 0};
    lift = 0;
    trigger = false;

    constructor() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
    }

    get steer(): number {
        return clamp(this.axis(RIGHT) - this.axis(LEFT) + this.stick.x);
    }

    get thrust(): number {
        return clamp(this.axis(FORWARD) - this.axis(BACKWARD) - this.stick.y);
    }

    get climb(): number {
        return clamp(this.axis(UP) - this.axis(DOWN) + this.lift);
    }

    get pitch(): number {
        return this.axis(NOSE_UP) - this.axis(NOSE_DOWN);
    }

    get roll(): number {
        return this.axis(BANK_RIGHT) - this.axis(BANK_LEFT);
    }

    get firing(): boolean {
        return this.trigger || this.axis(FIRE) === 1;
    }

    get boost(): boolean {
        return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    }

    get active(): boolean {
        return this.steer !== 0 || this.thrust !== 0 || this.climb !== 0 || this.pitch !== 0 || this.roll !== 0;
    }

    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
        window.removeEventListener('beforeunload', this.guardUnload);
    }

    private axis(codes: readonly string[]) {
        return codes.some(code => this.keys.has(code)) ? 1 : 0;
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (e.metaKey || e.altKey) return;
        if (FLIGHT_KEYS.has(e.code)) e.preventDefault();
        this.keys.add(e.code);
        if (isCtrl(e.code)) window.addEventListener('beforeunload', this.guardUnload);
    };

    private onKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.code);
        if (!this.keys.has('ControlLeft') && !this.keys.has('ControlRight')) {
            window.removeEventListener('beforeunload', this.guardUnload);
        }
    };

    private onBlur = () => {
        this.keys.clear();
        window.removeEventListener('beforeunload', this.guardUnload);
    };

    private guardUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
    };
}
