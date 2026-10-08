import * as THREE from 'three';

export interface Body {
    object: THREE.Object3D;
    update(time: number): void;
}

function hash(text: string): number {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function seeded(seed: number): () => number {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const hsl = (h: number, s: number, l: number) => new THREE.Color().setHSL(((h % 1) + 1) % 1, s, l);

type PlanetKind = 'terran' | 'rocky' | 'gas';

export function createPlanet(id: string, radius: number, accent: THREE.Color, glow: THREE.Texture): Body {
    const random = seeded(hash(id));
    const {h: accentHue} = accent.getHSL({h: 0, s: 0, l: 0});
    const hue = accentHue + (random() - 0.5) * 0.3;
    const kind: PlanetKind = radius >= 3.4 && random() < 0.45 ? 'gas' : random() < 0.55 ? 'terran' : 'rocky';

    const root = new THREE.Group();
    const tilted = new THREE.Group();
    tilted.rotation.set((random() - 0.5) * 0.5, 0, (random() - 0.5) * 0.9);
    root.add(tilted);

    const surface = new THREE.Mesh(
        planetGeometry(radius, kind, hue, random),
        new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: true,
            roughness: 0.85,
            metalness: 0.05,
            emissive: hsl(hue, 0.5, 0.06),
        }),
    );
    tilted.add(surface);

    const atmosphere = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow,
        color: hsl(kind === 'terran' ? hue + 0.45 : hue, 0.7, 0.7),
        transparent: true,
        opacity: kind === 'terran' ? 0.4 : 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }));
    atmosphere.scale.setScalar(radius * 3.6);
    root.add(atmosphere);

    if (radius >= 2.4 && random() < (kind === 'gas' ? 0.75 : 0.3)) {
        tilted.add(createRings(radius, hue, random));
    }

    let moonPivot: THREE.Group | null = null;
    if (radius >= 3 && random() < 0.5) {
        moonPivot = new THREE.Group();
        const moon = new THREE.Mesh(
            new THREE.IcosahedronGeometry(radius * 0.22, 0),
            new THREE.MeshStandardMaterial({color: hsl(hue + 0.5, 0.15, 0.75), flatShading: true, roughness: 1}),
        );
        moon.position.x = radius * 2.6;
        moonPivot.add(moon);
        moonPivot.rotation.z = (random() - 0.5) * 0.6;
        root.add(moonPivot);
    }

    const spin = (0.08 + random() * 0.15) * (random() < 0.5 ? -1 : 1);
    const moonSpeed = 0.25 + random() * 0.3;
    const phase = random() * Math.PI * 2;

    return {
        object: root,
        update(time) {
            surface.rotation.y = phase + time * spin;
            if (moonPivot) moonPivot.rotation.y = phase + time * moonSpeed;
        },
    };
}

function planetGeometry(radius: number, kind: PlanetKind, hue: number, random: () => number) {
    const geometry = new THREE.IcosahedronGeometry(radius, radius >= 3 ? 2 : 1);
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;

    const waves = Array.from({length: 5}, () => ({
        direction: new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize(),
        frequency: 1.5 + random() * 3.5,
        phase: random() * Math.PI * 2,
        amplitude: 0.4 + random() * 0.6,
    }));
    const total = waves.reduce((sum, w) => sum + w.amplitude, 0);
    const noise = (v: THREE.Vector3) =>
        waves.reduce((sum, w) => sum + Math.sin(v.dot(w.direction) * w.frequency + w.phase) * w.amplitude, 0) / total;

    const seaLevel = kind === 'terran' ? -0.05 + random() * 0.2 : -Infinity;
    const bumpiness = kind === 'gas' ? 0 : kind === 'rocky' ? 0.16 : 0.1;

    const heights: number[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i).normalize();
        const height = noise(v);
        heights.push(height);
        v.multiplyScalar(radius * (1 + Math.max(height, seaLevel) * bumpiness));
        position.setXYZ(i, v.x, v.y, v.z);
    }

    const palette = {
        terran: [hsl(hue + 0.45, 0.6, 0.38), hsl(hue + 0.45, 0.55, 0.52), hsl(hue, 0.5, 0.56), hsl(hue + 0.06, 0.4, 0.4), hsl(hue, 0.25, 0.9)],
        rocky: [hsl(hue, 0.35, 0.32), hsl(hue + 0.03, 0.45, 0.46), hsl(hue + 0.07, 0.5, 0.6), hsl(hue + 0.1, 0.45, 0.72), hsl(hue, 0.2, 0.9)],
        gas: [hsl(hue, 0.5, 0.6), hsl(hue + 0.07, 0.45, 0.74), hsl(hue - 0.05, 0.5, 0.48), hsl(hue + 0.12, 0.35, 0.84)],
    }[kind];

    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    const center = new THREE.Vector3();
    for (let face = 0; face < position.count; face += 3) {
        const height = (heights[face] + heights[face + 1] + heights[face + 2]) / 3;
        center.set(0, 0, 0);
        for (let k = 0; k < 3; k++) center.add(v.fromBufferAttribute(position, face + k));
        center.divideScalar(3 * radius);

        if (kind === 'gas') {
            const band = Math.floor((center.y + height * 0.12 + 1) * 4.5);
            color.copy(palette[((band % palette.length) + palette.length) % palette.length]);
        } else if (height < seaLevel) {
            color.copy(height < seaLevel - 0.25 ? palette[0] : palette[1]);
        } else {
            const land = kind === 'terran' ? (height - seaLevel) / (1 - seaLevel) : (height + 1) / 2;
            color.copy(land < 0.3 ? palette[2] : land < 0.55 ? palette[3] : palette[4]);
            if (kind === 'rocky') color.copy(palette[Math.min(4, Math.floor(land * 5))]);
        }
        color.offsetHSL(0, 0, (random() - 0.5) * 0.05);
        for (let k = 0; k < 3; k++) color.toArray(colors, (face + k) * 3);
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
}

function createRings(radius: number, hue: number, random: () => number) {
    const geometry = new THREE.RingGeometry(radius * 1.45, radius * 2.15, 28, 3);
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const inner = hsl(hue + 0.1, 0.4, 0.78);
    const outer = hsl(hue - 0.05, 0.45, 0.6);
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        const t = (v.fromBufferAttribute(position, i).length() / radius - 1.45) / 0.7;
        inner.clone().lerp(outer, t).toArray(colors, i * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const rings = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        roughness: 1,
        depthWrite: false,
    }));
    rings.rotation.x = -Math.PI / 2 + (random() - 0.5) * 0.3;
    return rings;
}

export function createSun(radius: number, glow: THREE.Texture, ray: THREE.Texture): Body {
    const root = new THREE.Group();
    const random = seeded(7);

    const coreGeometry = new THREE.IcosahedronGeometry(radius, 3);
    const count = coreGeometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let face = 0; face < count; face += 3) {
        color.setHSL(0.09 + random() * 0.05, 1, 0.58 + random() * 0.22);
        for (let k = 0; k < 3; k++) color.toArray(colors, (face + k) * 3);
    }
    coreGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const core = new THREE.Mesh(coreGeometry, new THREE.MeshBasicMaterial({vertexColors: true}));
    root.add(core);

    const plasma = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * 1.07, 1),
        new THREE.MeshBasicMaterial({
            color: 0xff9a3c, transparent: true, opacity: 0.22,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }),
    );
    root.add(plasma);

    const sprite = (map: THREE.Texture, color: number, scale: number, opacity: number) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
            map, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        s.scale.setScalar(radius * scale);
        root.add(s);
        return s;
    };
    const inner = sprite(glow, 0xfff2cc, 3.2, 1);
    const corona = sprite(glow, 0xff9d4a, 9, 0.75);
    const rays = createRays(root, radius, ray, random);

    return {
        object: root,
        update(time) {
            core.rotation.y = time * 0.05;
            plasma.rotation.set(time * 0.07, -time * 0.09, 0);
            plasma.scale.setScalar(1 + Math.sin(time * 1.7) * 0.02);
            inner.scale.setScalar(radius * 3.2 * (1 + Math.sin(time * 2.3) * 0.03));
            corona.scale.setScalar(radius * 9 * (1 + Math.sin(time * 0.9) * 0.05));
            for (const r of rays) {
                r.sprite.material.rotation = r.angle + time * r.speed;
                r.sprite.scale.set(r.width, r.length * (1 + Math.sin(time * 0.8 + r.phase) * 0.18), 1);
                r.sprite.material.opacity = r.opacity * (0.8 + Math.sin(time * 1.3 + r.phase * 2) * 0.2);
            }
        },
    };
}

const RAY_COUNT = 18;

function createRays(root: THREE.Group, radius: number, texture: THREE.Texture, random: () => number) {
    return Array.from({length: RAY_COUNT}, (_, i) => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            color: i % 2 ? 0xffb36b : 0xffd38a,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        sprite.center.set(0.5, 0);
        root.add(sprite);
        return {
            sprite,
            angle: (i / RAY_COUNT) * Math.PI * 2 + (random() - 0.5) * 0.3,
            speed: (i % 2 ? -1 : 1) * (0.02 + random() * 0.03),
            length: radius * (2.4 + random() * 2.8),
            width: radius * (0.3 + random() * 0.35),
            opacity: 0.35 + random() * 0.35,
            phase: random() * Math.PI * 2,
        };
    });
}
