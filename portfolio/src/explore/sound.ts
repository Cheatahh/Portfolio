const STORAGE_KEY = 'gx-muted';
const VOLUME = 0.8;

function loadMuted(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function saveMuted(muted: boolean) {
    try {
        localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
        return;
    }
}

export class SoundBoard {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private noise: AudioBuffer | null = null;
    private listeners = new Set<(muted: boolean) => void>();
    muted = loadMuted();

    constructor() {
        window.addEventListener('pointerdown', this.unlock, true);
        window.addEventListener('keydown', this.unlock, true);
        document.addEventListener('visibilitychange', this.onVisibility);
    }

    subscribe(listener: (muted: boolean) => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    setMuted(muted: boolean) {
        this.muted = muted;
        saveMuted(muted);
        if (this.context && this.master) {
            this.master.gain.setTargetAtTime(muted ? 0 : VOLUME, this.context.currentTime, 0.05);
        }
        this.listeners.forEach(listener => listener(muted));
    }

    toggle() {
        this.setMuted(!this.muted);
    }

    laser(pan: number) {
        const context = this.live();
        if (!context) return;
        const t = context.currentTime;
        const out = this.output(context, pan);

        const osc = context.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1050 + Math.random() * 150, t);
        osc.frequency.exponentialRampToValueAtTime(130, t + 0.16);

        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, t);
        filter.frequency.exponentialRampToValueAtTime(650, t + 0.16);

        const gain = this.envelope(context, t, 0.07, 0.004, 0.18);
        osc.connect(filter).connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    explosion(size: number, volume: number, pan: number) {
        const context = this.live();
        if (!context || volume < 0.02) return;
        const t = context.currentTime;
        const duration = 0.45 + size * 0.25;
        const out = this.output(context, pan);

        const noise = this.noiseSource(context);
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600 + Math.random() * 800, t);
        filter.frequency.exponentialRampToValueAtTime(140, t + duration);
        const crackle = this.envelope(context, t, 0.35 * volume, 0.006, duration);
        noise.connect(filter).connect(crackle).connect(out);
        noise.start(t, Math.random() * 1.5);
        noise.stop(t + duration + 0.05);

        const thump = context.createOscillator();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(120 - size * 20, t);
        thump.frequency.exponentialRampToValueAtTime(32, t + 0.35);
        const body = this.envelope(context, t, 0.45 * volume, 0.005, 0.4);
        thump.connect(body).connect(out);
        thump.start(t);
        thump.stop(t + 0.45);
    }

    bump(strength: number) {
        const context = this.live();
        if (!context) return;
        const t = context.currentTime;
        const volume = Math.min(1, 0.35 + strength);
        const out = this.output(context, 0);

        const thud = context.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(90, t);
        thud.frequency.exponentialRampToValueAtTime(28, t + 0.3);
        const gain = this.envelope(context, t, 0.6 * volume, 0.004, 0.35);
        thud.connect(gain).connect(out);
        thud.start(t);
        thud.stop(t + 0.4);

        const noise = this.noiseSource(context);
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        const scrape = this.envelope(context, t, 0.25 * volume, 0.004, 0.25);
        noise.connect(filter).connect(scrape).connect(out);
        noise.start(t, Math.random());
        noise.stop(t + 0.3);
    }

    chime() {
        const context = this.live();
        if (!context) return;
        const t = context.currentTime;
        const out = this.output(context, 0);
        [659.25, 987.77, 1318.5].forEach((frequency, i) => {
            const start = t + i * 0.09;
            const osc = context.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = frequency;
            const gain = this.envelope(context, start, 0.06, 0.01, 0.9);
            osc.connect(gain).connect(out);
            osc.start(start);
            osc.stop(start + 1);
        });
    }

    blip() {
        const context = this.live();
        if (!context) return;
        const t = context.currentTime;
        const osc = context.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(1040, t + 0.1);
        const gain = this.envelope(context, t, 0.08, 0.005, 0.16);
        osc.connect(gain).connect(this.output(context, 0));
        osc.start(t);
        osc.stop(t + 0.2);
    }

    dispose() {
        window.removeEventListener('pointerdown', this.unlock, true);
        window.removeEventListener('keydown', this.unlock, true);
        document.removeEventListener('visibilitychange', this.onVisibility);
        this.listeners.clear();
        void this.context?.close();
        this.context = null;
        this.master = null;
    }

    private live(): AudioContext | null {
        const context = this.context;
        if (!context || this.muted || context.state !== 'running') return null;
        return context;
    }

    private output(context: AudioContext, pan: number): AudioNode {
        if (!pan) return this.master!;
        const panner = context.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        panner.connect(this.master!);
        return panner;
    }

    private envelope(context: AudioContext, start: number, peak: number, attack: number, release: number) {
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peak, start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + release);
        return gain;
    }

    private noiseSource(context: AudioContext) {
        const source = context.createBufferSource();
        source.buffer = this.noise;
        return source;
    }

    private unlock = () => {
        if (!this.context) {
            try {
                this.create();
            } catch {
                this.dispose();
                return;
            }
        }
        if (this.context?.state === 'suspended' && !document.hidden) void this.context.resume();
    };

    private create() {
        const context = new AudioContext();
        this.context = context;

        const master = context.createGain();
        master.gain.value = this.muted ? 0 : VOLUME;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -10;
        limiter.ratio.value = 8;
        master.connect(limiter).connect(context.destination);
        this.master = master;

        const length = context.sampleRate * 2;
        const noise = context.createBuffer(1, length, context.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        this.noise = noise;
    }

    private onVisibility = () => {
        if (!this.context) return;
        if (document.hidden) void this.context.suspend();
        else void this.context.resume();
    };
}
