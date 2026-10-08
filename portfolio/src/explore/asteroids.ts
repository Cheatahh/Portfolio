import * as THREE from 'three';

export interface Obstacle {
    position: THREE.Vector3;
    radius: number;
}

interface Asteroid {
    mesh: THREE.Mesh;
    radius: number;
    velocity: THREE.Vector3;
    axis: THREE.Vector3;
    spin: number;
    age: number;
}

interface Shard {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    axis: THREE.Vector3;
    spin: number;
    size: number;
}

interface Burst {
    shards: Shard[];
    material: THREE.MeshStandardMaterial;
    flash: THREE.Sprite;
    flashSize: number;
    age: number;
    life: number;
}

const COUNT = 110;
const ROCK_VARIANTS = 8;
const SHARD_VARIANTS = 4;
const SHIP_RADIUS = 1.7;
const SPAWN_CLEARANCE = 90;
const GROW_TIME = 1.6;
const BURST_LIFE = 1.5;
const RESTITUTION = 0.85;
const CEILING = 40;

const segmentDirection = new THREE.Vector3();
const segmentOffset = new THREE.Vector3();

export function segmentSphere(from: THREE.Vector3, to: THREE.Vector3, center: THREE.Vector3, radius: number): number | null {
    const d = segmentDirection.subVectors(to, from);
    const f = segmentOffset.subVectors(from, center);
    const c = f.dot(f) - radius * radius;
    if (c <= 0) return 0;
    const a = d.dot(d);
    const b = 2 * f.dot(d);
    const discriminant = b * b - 4 * a * c;
    if (a < 1e-9 || discriminant < 0) return null;
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    return t >= 0 && t <= 1 ? t : null;
}

const smoothstep = (t: number) => {
    const x = THREE.MathUtils.clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
};

function jitter(geometry: THREE.BufferGeometry, amount: number) {
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const offsets = new Map<string, number>();
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i);
        const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
        let scale = offsets.get(key);
        if (scale === undefined) {
            scale = 1 + (Math.random() - 0.5) * amount;
            offsets.set(key, scale);
        }
        v.multiplyScalar(scale);
        position.setXYZ(i, v.x, v.y, v.z);
    }
}

function paint(geometry: THREE.BufferGeometry) {
    const count = geometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    const hue = 0.66 + Math.random() * 0.1;
    for (let face = 0; face < count; face += 3) {
        color.setHSL(hue + (Math.random() - 0.5) * 0.04, 0.1 + Math.random() * 0.12, 0.3 + Math.random() * 0.22);
        for (let k = 0; k < 3; k++) color.toArray(colors, (face + k) * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function rockGeometry(detail: number) {
    const geometry = new THREE.IcosahedronGeometry(1, detail);
    jitter(geometry, detail ? 0.35 : 0.55);
    geometry.scale(1, 0.65 + Math.random() * 0.35, 0.75 + Math.random() * 0.3);
    paint(geometry);
    geometry.computeVertexNormals();
    return geometry;
}

function shardGeometry() {
    const geometry = new THREE.TetrahedronGeometry(1, 0);
    jitter(geometry, 0.7);
    geometry.scale(1, 0.5 + Math.random() * 0.5, 0.7 + Math.random() * 0.6);
    paint(geometry);
    geometry.computeVertexNormals();
    return geometry;
}

export class AsteroidField {
    private readonly group = new THREE.Group();
    private readonly rocks = Array.from({length: ROCK_VARIANTS}, (_, i) => rockGeometry(i % 3 === 0 ? 1 : 0));
    private readonly shardGeometries = Array.from({length: SHARD_VARIANTS}, shardGeometry);
    private readonly material = new THREE.MeshStandardMaterial({
        vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.05, emissive: 0x16132b,
    });
    private readonly asteroids: Asteroid[] = [];
    private readonly bursts: Burst[] = [];
    private readonly normal = new THREE.Vector3();
    private readonly ship = new THREE.Vector3();
    private readonly push = new THREE.Vector3();

    constructor(
        scene: THREE.Scene,
        private readonly obstacles: readonly Obstacle[],
        private readonly bounds: number,
        private readonly glow: THREE.Texture,
        start: THREE.Vector3,
        private readonly onShatter: (position: THREE.Vector3, radius: number) => void,
    ) {
        scene.add(this.group);
        for (let i = 0; i < COUNT; i++) this.spawn(start, true);
    }

    update(dt: number, ship: THREE.Vector3, shipVelocity: THREE.Vector3): number {
        this.ship.copy(ship);
        let impact = 0;
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            const {mesh, velocity} = asteroid;
            asteroid.age += dt;
            mesh.position.addScaledVector(velocity, dt);
            mesh.rotateOnAxis(asteroid.axis, asteroid.spin * dt);
            const size = asteroid.radius * smoothstep(asteroid.age / GROW_TIME);
            mesh.scale.setScalar(Math.max(size, 1e-3));
            this.bounce(asteroid);

            if (mesh.position.distanceTo(ship) >= size + SHIP_RADIUS) continue;
            impact = Math.max(impact, this.normal.subVectors(shipVelocity, velocity).length());
            this.destroy(i, this.push.subVectors(shipVelocity, velocity).multiplyScalar(0.35));
        }
        this.updateBursts(dt);
        return impact;
    }

    strike(from: THREE.Vector3, to: THREE.Vector3, direction: THREE.Vector3): THREE.Vector3 | null {
        let index = -1;
        let nearest = Infinity;
        this.asteroids.forEach((asteroid, i) => {
            const t = segmentSphere(from, to, asteroid.mesh.position, asteroid.mesh.scale.x + 0.3);
            if (t !== null && t < nearest) {
                nearest = t;
                index = i;
            }
        });
        if (index < 0) return null;
        const point = from.clone().lerp(to, nearest);
        this.destroy(index, this.push.copy(direction).multiplyScalar(6));
        return point;
    }

    dispose() {
        this.group.removeFromParent();
        for (const burst of this.bursts) {
            burst.material.dispose();
            burst.flash.material.dispose();
        }
        this.rocks.forEach(g => g.dispose());
        this.shardGeometries.forEach(g => g.dispose());
        this.material.dispose();
    }

    private destroy(index: number, push: THREE.Vector3) {
        const asteroid = this.asteroids[index];
        this.shatter(asteroid, push);
        this.onShatter(asteroid.mesh.position, asteroid.radius);
        this.group.remove(asteroid.mesh);
        this.asteroids.splice(index, 1);
        this.spawn(this.ship, false);
    }

    private spawn(avoid: THREE.Vector3, grown: boolean) {
        const radius = 0.5 + Math.random() ** 2 * 1.7;
        const position = new THREE.Vector3();
        for (let attempt = 0; attempt < 30; attempt++) {
            const r = Math.sqrt(Math.random()) * this.bounds * 0.95;
            const angle = Math.random() * Math.PI * 2;
            position.set(Math.cos(angle) * r, (Math.random() + Math.random() - 1) * 25, Math.sin(angle) * r);
            if (position.distanceTo(avoid) < SPAWN_CLEARANCE) continue;
            if (this.obstacles.some(o => position.distanceTo(o.position) < o.radius + radius + 4)) continue;
            break;
        }

        const heading = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        const velocity = new THREE.Vector3(Math.cos(heading) * speed, (Math.random() - 0.5) * 1.2, Math.sin(heading) * speed);

        const mesh = new THREE.Mesh(this.rocks[Math.floor(Math.random() * this.rocks.length)], this.material);
        mesh.position.copy(position);
        mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        mesh.scale.setScalar(grown ? radius : 1e-3);
        this.group.add(mesh);

        this.asteroids.push({
            mesh,
            radius,
            velocity,
            axis: new THREE.Vector3().randomDirection(),
            spin: (Math.random() - 0.5) * 1.6,
            age: grown ? GROW_TIME : 0,
        });
    }

    private bounce(asteroid: Asteroid) {
        const {mesh, velocity, radius} = asteroid;
        const position = mesh.position;
        const normal = this.normal;

        for (const obstacle of this.obstacles) {
            const min = obstacle.radius + radius;
            normal.subVectors(position, obstacle.position);
            const distance = normal.length();
            if (distance >= min) continue;
            if (distance < 1e-6) normal.set(0, 1, 0);
            else normal.divideScalar(distance);
            position.copy(obstacle.position).addScaledVector(normal, min);
            const into = velocity.dot(normal);
            if (into < 0) {
                velocity.addScaledVector(normal, -into * (1 + RESTITUTION));
                asteroid.axis.randomDirection();
                asteroid.spin = THREE.MathUtils.clamp(asteroid.spin + (Math.random() - 0.5) * 2, -2.5, 2.5);
            }
        }

        const horizontal = Math.hypot(position.x, position.z);
        if (horizontal > this.bounds) {
            normal.set(position.x / horizontal, 0, position.z / horizontal);
            position.x = normal.x * this.bounds;
            position.z = normal.z * this.bounds;
            const out = velocity.dot(normal);
            if (out > 0) velocity.addScaledVector(normal, -out * 2);
        }
        if (Math.abs(position.y) > CEILING) {
            position.y = Math.sign(position.y) * CEILING;
            if (velocity.y * position.y > 0) velocity.y = -velocity.y;
        }
    }

    private shatter(asteroid: Asteroid, push: THREE.Vector3) {
        const origin = asteroid.mesh.position;
        const radius = asteroid.radius;
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true, flatShading: true, roughness: 0.9, transparent: true,
            emissive: 0xffa264, emissiveIntensity: 1.4,
        });
        const carry = asteroid.velocity.clone().add(push);

        const shards: Shard[] = [];
        const count = 6 + Math.round(radius * 5);
        for (let i = 0; i < count; i++) {
            const direction = new THREE.Vector3().randomDirection();
            const size = radius * (0.18 + Math.random() * 0.24);
            const mesh = new THREE.Mesh(
                this.shardGeometries[Math.floor(Math.random() * this.shardGeometries.length)], material,
            );
            mesh.position.copy(origin).addScaledVector(direction, radius * 0.6 * Math.random());
            mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            mesh.scale.setScalar(size);
            this.group.add(mesh);
            shards.push({
                mesh,
                velocity: carry.clone().addScaledVector(direction, 4 + Math.random() * 10),
                axis: new THREE.Vector3().randomDirection(),
                spin: (Math.random() - 0.5) * 14,
                size,
            });
        }

        const flash = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.glow, color: 0xffc89a, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        const flashSize = radius * 6;
        flash.position.copy(origin);
        flash.scale.setScalar(flashSize);
        this.group.add(flash);

        this.bursts.push({shards, material, flash, flashSize, age: 0, life: BURST_LIFE * (0.8 + Math.random() * 0.4)});
    }

    private updateBursts(dt: number) {
        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const burst = this.bursts[i];
            burst.age += dt;
            const t = burst.age / burst.life;

            if (t >= 1) {
                burst.shards.forEach(s => this.group.remove(s.mesh));
                this.group.remove(burst.flash);
                burst.material.dispose();
                burst.flash.material.dispose();
                this.bursts.splice(i, 1);
                continue;
            }

            const drag = Math.exp(-0.9 * dt);
            for (const shard of burst.shards) {
                shard.mesh.position.addScaledVector(shard.velocity, dt);
                shard.velocity.multiplyScalar(drag);
                shard.mesh.rotateOnAxis(shard.axis, shard.spin * dt);
                shard.mesh.scale.setScalar(shard.size * (1 - t * 0.6));
            }
            burst.material.opacity = 1 - t * t;
            burst.material.emissiveIntensity = 1.4 * Math.max(0, 1 - t * 3);
            burst.flash.material.opacity = Math.max(0, 1 - t * 5);
            burst.flash.scale.setScalar(burst.flashSize * (1 + t * 2));
        }
    }
}
