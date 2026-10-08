import * as THREE from 'three';
import {CSS2DObject, CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type {Galaxy, Star} from 'portfolioContent';
import {glowTexture, rayTexture} from './textures.ts';
import {type Body, createPlanet, createSun} from './bodies.ts';
import {createShip, type Ship} from './ship.ts';
import {AsteroidField} from './asteroids.ts';
import {LaserBattery} from './lasers.ts';
import type {Input} from './input.ts';
import type {SoundBoard} from './sound.ts';

export interface HudState {
    speed: number;
    throttle: number;
    autopilot: string | null;
    nearest: { id: string; distance: number } | null;
}

export interface SceneCallbacks {
    onHud(state: HudState): void;
    onOrbit(starId: string | null): void;
    onPick(starId: string): void;
}

interface Options {
    container: HTMLElement;
    minimap: HTMLCanvasElement | null;
    galaxy: Galaxy;
    input: Input;
    sound: SoundBoard;
    callbacks: SceneCallbacks;
}

interface StarNode {
    star: Star;
    color: THREE.Color;
    css: string;
    position: THREE.Vector3;
    body: Body;
    label: HTMLDivElement;
}

const MAX_SPEED = 42;
const BOOST_SPEED = 95;
const AUTOPILOT_SPEED = 80;
const ACCELERATION = 30;
const TURN_RATE = 1.7;
const CLIMB_SPEED = 22;
const MAX_PITCH = 0.55;
const MAX_ROLL = 0.85;
const WORLD_RADIUS = 420;
const TRAIL_LENGTH = 48;
const BACKGROUND = 0x08080f;

const orbitRadius = (star: Star) => star.radius * 2 + 9;

const collisionRadius = (star: Star) => star.radius * 1.2 + 1.8;

const damp = (current: number, target: number, lambda: number, dt: number) =>
    THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export class GalaxyScene {
    private readonly renderer: THREE.WebGLRenderer;
    private readonly labels = new CSS2DRenderer();
    private readonly scene = new THREE.Scene();
    private readonly camera = new THREE.PerspectiveCamera(62, 1, 0.1, 3000);
    private readonly clock = new THREE.Clock();
    private readonly raycaster = new THREE.Raycaster();
    private readonly resizeObserver: ResizeObserver;
    private readonly glow = glowTexture();
    private readonly ray = rayTexture();

    private readonly nodes: StarNode[] = [];
    private readonly byId = new Map<string, StarNode>();
    private readonly hitTargets: THREE.Mesh[] = [];
    private readonly marker: THREE.Mesh;
    private readonly ship: Ship;
    private readonly trails: { line: THREE.Line; points: THREE.Vector3[] }[];
    private readonly asteroids: AsteroidField;
    private readonly lasers: LaserBattery;

    private readonly position = new THREE.Vector3(0, 4, 36);
    private readonly previous = new THREE.Vector3();
    private readonly velocity = new THREE.Vector3();
    private yaw = 0;
    private speed = 0;
    private verticalSpeed = 0;
    private steerSmoothed = 0;
    private pitch = 0;
    private roll = 0;
    private readonly knockback = new THREE.Vector3();
    private yawImpulse = 0;
    private shake = 0;
    private autopilot: StarNode | null = null;

    private discovered: ReadonlySet<string> = new Set();
    private orbit: string | null = null;
    private frame = 0;
    private hudTimer = 0;
    private cameraReady = false;
    private pointerDown: { x: number; y: number } | null = null;
    private minimapExtent = 1;

    constructor(private readonly options: Options) {
        const {container, galaxy} = options;

        this.renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(BACKGROUND);
        this.renderer.domElement.className = 'gx-canvas';
        container.appendChild(this.renderer.domElement);

        this.labels.domElement.className = 'gx-labels';
        container.appendChild(this.labels.domElement);

        this.scene.background = new THREE.Color(BACKGROUND);
        this.scene.fog = new THREE.FogExp2(BACKGROUND, 0.0021);

        this.scene.add(new THREE.AmbientLight(0x8a88c0, 0.55));
        const fill = new THREE.DirectionalLight(0xd4d0ff, 0.6);
        fill.position.set(30, 60, 20);
        this.scene.add(fill);
        this.scene.add(new THREE.PointLight(0xffe2b8, 2.2, 0, 0));

        this.addSky();
        this.addDust();

        const colors = new Map(galaxy.constellations.map(c => [c.id, c.color]));
        for (const star of galaxy.stars) this.addStar(star, colors.get(star.constellation) ?? '#ffffff');
        this.addLanes();

        this.marker = new THREE.Mesh(
            new THREE.RingGeometry(1, 1.035, 96),
            new THREE.MeshBasicMaterial({
                transparent: true, opacity: 0.55, side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending, depthWrite: false,
            }),
        );
        this.marker.rotation.x = -Math.PI / 2;
        this.marker.visible = false;
        this.scene.add(this.marker);

        this.ship = createShip(this.glow);
        this.scene.add(this.ship.root);

        this.trails = this.ship.exhausts.map(() => this.createTrail());
        this.trails.forEach(t => this.scene.add(t.line));

        const obstacles = this.nodes.map(node => ({position: node.position, radius: node.star.radius * 1.15}));
        this.asteroids = new AsteroidField(
            this.scene,
            obstacles,
            WORLD_RADIUS,
            this.glow,
            this.position,
            (position, radius) => this.options.sound.explosion(radius, this.loudness(position), this.panOf(position)),
        );
        this.lasers = new LaserBattery(
            this.scene, this.ship.hull, this.asteroids, obstacles, this.glow,
            side => this.options.sound.laser(side * 0.35),
        );

        const canvas = this.renderer.domElement;
        canvas.addEventListener('pointerdown', this.onPointerDown);
        canvas.addEventListener('pointerup', this.onPointerUp);
        options.minimap?.addEventListener('click', this.onMinimapClick);

        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(container);
        this.resize();

        this.computeMinimapExtent();
        this.renderer.setAnimationLoop(this.tick);
    }

    flyTo(id: string) {
        const node = this.byId.get(id);
        if (!node) return;
        this.autopilot = node;
        this.knockback.set(0, 0, 0);
        this.yawImpulse = 0;
        this.options.sound.blip();
        this.emitHud();
    }

    cancelAutopilot() {
        this.autopilot = null;
        this.emitHud();
    }

    setDiscovered(ids: ReadonlySet<string>) {
        this.discovered = ids;
        for (const node of this.nodes) node.label.classList.toggle('discovered', ids.has(node.star.id));
        this.emitHud();
    }

    dispose() {
        this.renderer.setAnimationLoop(null);
        this.resizeObserver.disconnect();
        const canvas = this.renderer.domElement;
        canvas.removeEventListener('pointerdown', this.onPointerDown);
        canvas.removeEventListener('pointerup', this.onPointerUp);
        this.options.minimap?.removeEventListener('click', this.onMinimapClick);

        this.lasers.dispose();
        this.asteroids.dispose();
        this.scene.traverse(object => {
            if (object instanceof THREE.Sprite) {
                object.material.dispose();
            } else if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
                object.geometry.dispose();
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(m => m.dispose());
            }
        });
        this.glow.dispose();
        this.ray.dispose();
        this.renderer.dispose();
        canvas.remove();
        this.labels.domElement.remove();
    }

    private addSky() {
        const count = 4500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const palette = [0xffffff, 0xd8dcff, 0xc7aaff, 0xa9b4ff, 0xffe9f5].map(c => new THREE.Color(c));
        const v = new THREE.Vector3();
        for (let i = 0; i < count; i++) {
            v.randomDirection().multiplyScalar(900 + Math.random() * 600);
            v.toArray(positions, i * 3);
            const c = palette[i % palette.length].clone().multiplyScalar(0.35 + Math.random() * 0.65);
            c.toArray(colors, i * 3);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 2.4, sizeAttenuation: false, map: this.glow, vertexColors: true, transparent: true,
            depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
        })));

        const nebulae = [0x6d7dff, 0x9a6dff, 0x5a4fd6, 0xb06dd8, 0x4f7bd6, 0x8a7dff, 0x6a4fb0];
        nebulae.forEach((color, i) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.glow, color, transparent: true, opacity: 0.09 + (i % 3) * 0.025,
                blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
            }));
            const angle = (i / nebulae.length) * Math.PI * 2 + 0.4;
            sprite.position.set(Math.cos(angle) * 1000, (i % 2 ? 1 : -1) * 120 + i * 20, Math.sin(angle) * 1000);
            sprite.scale.setScalar(800 + (i % 3) * 250);
            this.scene.add(sprite);
        });
    }

    private addDust() {
        const count = 2400;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = Math.sqrt(Math.random()) * WORLD_RADIUS;
            const a = Math.random() * Math.PI * 2;
            const y = (Math.random() + Math.random() + Math.random() - 1.5) * 30;
            positions.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 0.9, color: 0xb3adff, map: this.glow, transparent: true, opacity: 0.55,
            depthWrite: false, blending: THREE.AdditiveBlending,
        })));
    }

    private addStar(star: Star, css: string) {
        const color = new THREE.Color(css);
        const position = new THREE.Vector3(star.position.x, star.position.y, star.position.z);
        const group = new THREE.Group();
        group.position.copy(position);

        const body = star.id === this.options.galaxy.home
            ? createSun(star.radius, this.glow, this.ray)
            : createPlanet(star.id, star.radius, color, this.glow);
        group.add(body.object);

        const hit = new THREE.Mesh(
            new THREE.SphereGeometry(Math.max(star.radius * 2.2, 4), 12, 8),
            new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false, colorWrite: false}),
        );
        hit.userData.starId = star.id;
        group.add(hit);
        this.hitTargets.push(hit);

        const label = document.createElement('div');
        label.className = 'gx-label';
        label.style.setProperty('--c', css);
        label.innerHTML = '<span class="gx-label-dot"></span>';
        label.append(star.label);
        label.addEventListener('click', () => this.options.callbacks.onPick(star.id));
        const labelObject = new CSS2DObject(label);
        labelObject.position.set(0, star.radius + 2.4, 0);
        labelObject.center.set(0.5, 1);
        group.add(labelObject);

        this.scene.add(group);
        const node: StarNode = {star, color, css, position, body, label};
        this.nodes.push(node);
        this.byId.set(star.id, node);
    }

    private addLanes() {
        const lanes = this.options.galaxy.lanes;
        const positions = new Float32Array(lanes.length * 6);
        const colors = new Float32Array(lanes.length * 6);
        lanes.forEach((lane, i) => {
            const from = this.byId.get(lane.from);
            const to = this.byId.get(lane.to);
            if (!from || !to) return;
            from.position.toArray(positions, i * 6);
            to.position.toArray(positions, i * 6 + 3);
            from.color.clone().multiplyScalar(0.25).toArray(colors, i * 6);
            to.color.clone().multiplyScalar(0.4).toArray(colors, i * 6 + 3);
        });
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.scene.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        })));
    }

    private createTrail() {
        const positions = new Float32Array(TRAIL_LENGTH * 3);
        const colors = new Float32Array(TRAIL_LENGTH * 3);
        const head = new THREE.Color(0xb9b0ff);
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < TRAIL_LENGTH; i++) {
            head.clone().multiplyScalar((1 - i / TRAIL_LENGTH) ** 2).toArray(colors, i * 3);
            points.push(this.position.clone());
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        line.frustumCulled = false;
        return {line, points};
    }

    private tick = () => {
        const dt = Math.min(this.clock.getDelta(), 0.05);
        const time = this.clock.elapsedTime;

        this.previous.copy(this.position);
        this.fly(dt);
        this.velocity.subVectors(this.position, this.previous).divideScalar(Math.max(dt, 1e-3));
        this.collide(this.asteroids.update(dt, this.position, this.velocity));
        this.updateShip(dt, time);
        this.lasers.update(dt, this.options.input.firing, this.velocity);
        this.updateCamera(dt);
        this.updateStars(time);
        this.updateOrbit();

        this.renderer.render(this.scene, this.camera);
        this.labels.render(this.scene, this.camera);

        if (this.frame++ % 2 === 0) this.drawMinimap();
        this.hudTimer += dt;
        if (this.hudTimer > 0.1) {
            this.hudTimer = 0;
            this.emitHud();
        }
    };

    private fly(dt: number) {
        const input = this.options.input;
        if (input.active) this.autopilot = null;

        let steer: number;
        let targetVertical: number;

        if (this.autopilot) {
            const destination = this.parkingSpot(this.autopilot);
            const target = this.avoidObstacles(destination, this.autopilot);
            const dx = target.x - this.position.x;
            const dz = target.z - this.position.z;
            const horizontal = Math.hypot(destination.x - this.position.x, destination.z - this.position.z);
            const distance = destination.distanceTo(this.position);
            const heading = wrapAngle(Math.atan2(-dx, -dz) - this.yaw);

            steer = THREE.MathUtils.clamp(-heading * 3, -1, 1);
            const facing = Math.max(0, Math.cos(heading));
            const cap = 10 + this.surfaceDistance(this.autopilot) * 1.6;
            const wanted = Math.min(AUTOPILOT_SPEED, horizontal * 1.1 + 2, cap) * facing ** 2;
            this.speed = damp(this.speed, wanted, 2.2, dt);
            targetVertical = THREE.MathUtils.clamp((target.y - this.position.y) * 1.4, -CLIMB_SPEED, CLIMB_SPEED);

            if (distance < 2) {
                this.autopilot = null;
                this.emitHud();
            }
        } else {
            steer = input.steer;
            const max = input.boost ? BOOST_SPEED : MAX_SPEED;
            if (input.thrust > 0) this.speed += ACCELERATION * input.thrust * (input.boost ? 1.8 : 1) * dt;
            else if (input.thrust < 0) this.speed += ACCELERATION * 1.4 * input.thrust * dt;
            else this.speed *= Math.exp(-0.55 * dt);
            if (this.speed > max) this.speed = damp(this.speed, max, 2, dt);
            this.speed = Math.max(this.speed, -12);
            targetVertical = input.climb * CLIMB_SPEED;
        }

        this.pitch = damp(this.pitch, input.pitch * MAX_PITCH, input.pitch ? 2.5 : 1.8, dt);
        this.roll = damp(this.roll, input.roll * MAX_ROLL, input.roll ? 2.5 : 1.8, dt);
        const bankGrip = THREE.MathUtils.clamp(Math.abs(this.speed) / 20, 0.25, 1);
        this.yaw -= (this.roll / MAX_ROLL) * TURN_RATE * bankGrip * dt;
        targetVertical = THREE.MathUtils.clamp(
            targetVertical + Math.sin(this.pitch) * this.speed, -CLIMB_SPEED * 1.6, CLIMB_SPEED * 1.6,
        );

        this.steerSmoothed = damp(this.steerSmoothed, steer, 8, dt);
        this.yaw -= this.steerSmoothed * TURN_RATE * (this.autopilot ? 1.4 : 1) * dt;
        this.yaw += this.yawImpulse * dt;
        this.yawImpulse *= Math.exp(-3 * dt);
        this.verticalSpeed = damp(this.verticalSpeed, targetVertical, 4, dt);

        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        this.position.addScaledVector(forward, this.speed * dt);
        this.position.y += this.verticalSpeed * dt;
        this.position.addScaledVector(this.knockback, dt);
        this.knockback.multiplyScalar(Math.exp(-2.5 * dt));

        this.bounce(forward);

        const horizontal = Math.hypot(this.position.x, this.position.z);
        if (horizontal > WORLD_RADIUS) {
            const scale = WORLD_RADIUS / horizontal;
            this.position.x *= scale;
            this.position.z *= scale;
        }
        this.position.y = THREE.MathUtils.clamp(this.position.y, -80, 80);
    }

    private bounce(forward: THREE.Vector3) {
        for (const node of this.nodes) {
            const min = collisionRadius(node.star);
            const normal = this.position.clone().sub(node.position);
            const distance = normal.length();
            if (distance >= min) continue;
            if (distance < 1e-6) normal.set(0, 1, 0);
            else normal.divideScalar(distance);
            this.position.copy(node.position).addScaledVector(normal, min);

            if (this.autopilot) continue;

            const velocity = forward.clone().multiplyScalar(this.speed).add(this.knockback);
            velocity.y += this.verticalSpeed;
            const into = velocity.dot(normal);
            if (into >= 0) continue;

            this.knockback.addScaledVector(normal, -into * 1.4 + 4);
            this.speed *= 0.25;
            this.verticalSpeed *= 0.25;
            const side = forward.z * normal.x - forward.x * normal.z;
            this.yawImpulse = (side >= 0 ? 1 : -1) * 2.8;
            this.shake = Math.min(1, 0.3 - into / 40);
            this.options.sound.bump(-into / 40);
        }
    }

    private collide(impact: number) {
        if (impact <= 0) return;
        this.shake = Math.max(this.shake, Math.min(0.6, 0.18 + impact / 120));
        if (!this.autopilot) this.speed *= 0.92;
    }

    private loudness(position: THREE.Vector3) {
        return 1 / (1 + position.distanceTo(this.position) / 30);
    }

    private panOf(position: THREE.Vector3) {
        const local = position.clone().applyMatrix4(this.camera.matrixWorldInverse);
        return THREE.MathUtils.clamp(local.x / Math.max(local.length(), 1), -0.8, 0.8);
    }

    private avoidObstacles(destination: THREE.Vector3, target: StarNode): THREE.Vector3 {
        const direction = destination.clone().sub(this.position);
        const length = direction.length();
        if (length < 1e-3) return destination;
        direction.divideScalar(length);

        let waypoint: THREE.Vector3 | null = null;
        let nearest = Infinity;
        for (const node of this.nodes) {
            if (node === target) continue;
            const clearance = collisionRadius(node.star) + 6;
            const along = node.position.clone().sub(this.position).dot(direction);
            if (along <= 0 || along > length + clearance || along >= nearest) continue;

            const closest = this.position.clone().addScaledVector(direction, THREE.MathUtils.clamp(along, 0, length));
            const offset = closest.sub(node.position);
            if (offset.length() >= clearance) continue;

            if (offset.lengthSq() < 0.25) offset.set(-direction.z, 0, direction.x);
            waypoint = node.position.clone().addScaledVector(offset.normalize(), clearance + 4);
            nearest = along;
        }
        return waypoint ?? destination;
    }

    private parkingSpot(node: StarNode) {
        const direction = this.position.clone().sub(node.position);
        if (direction.lengthSq() < 1e-6) direction.set(0, 0, 1);
        direction.y *= 0.3;
        const distance = Math.max(node.star.radius * 2 + 4, collisionRadius(node.star) + 6);
        return node.position.clone().addScaledVector(direction.normalize(), distance);
    }

    private surfaceDistance(except: StarNode) {
        let closest = Infinity;
        for (const node of this.nodes) {
            if (node === except) continue;
            closest = Math.min(closest, this.position.distanceTo(node.position) - collisionRadius(node.star));
        }
        return Math.max(closest, 0);
    }

    private updateShip(dt: number, time: number) {
        const {root, hull, flames, plumes, exhausts} = this.ship;
        root.position.copy(this.position);
        root.rotation.y = this.yaw;
        hull.rotation.z = damp(hull.rotation.z, -(this.steerSmoothed - this.yawImpulse / TURN_RATE) * 0.55 - this.roll, 6, dt);
        const climbTilt = (this.verticalSpeed / CLIMB_SPEED) * 0.35 * (1 - Math.abs(this.pitch) / MAX_PITCH);
        hull.rotation.x = damp(hull.rotation.x, this.pitch + climbTilt, 6, dt);
        hull.position.y = Math.sin(time * 1.6) * 0.08;

        const throttle = Math.min(Math.abs(this.speed) / MAX_SPEED, 2);
        flames.forEach((flame, i) => {
            const flicker = Math.sin(time * 40 + i * 2) * 0.08;
            flame.scale.setScalar((0.7 + throttle * 0.6) * (1 + flicker));
        });
        plumes.forEach((plume, i) => {
            const flicker = Math.sin(time * 33 + i * 3) * 0.1;
            plume.scale.set(1, 0.25 + throttle * 1.1 + flicker, 1);
            (plume.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.min(throttle, 1) * 0.5;
        });

        root.updateMatrixWorld();
        exhausts.forEach((exhaust, i) => {
            const {line, points} = this.trails[i];
            points.pop();
            points.unshift(hull.localToWorld(exhaust.clone()));
            const attribute = line.geometry.getAttribute('position') as THREE.BufferAttribute;
            points.forEach((p, j) => attribute.setXYZ(j, p.x, p.y, p.z));
            attribute.needsUpdate = true;
            (line.material as THREE.LineBasicMaterial).opacity = Math.min(1, throttle);
        });
    }

    private updateCamera(dt: number) {
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const desired = this.position.clone().addScaledVector(forward, -14).add(new THREE.Vector3(0, 4.8, 0));
        const lookAt = this.position.clone().addScaledVector(forward, 6).add(new THREE.Vector3(0, 1.2, 0));

        if (this.cameraReady) this.camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
        else {
            this.camera.position.copy(desired);
            this.cameraReady = true;
        }
        this.camera.lookAt(lookAt);

        if (this.shake > 0) {
            const s = this.shake * 0.5;
            this.camera.position.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(s));
            this.shake = Math.max(0, this.shake - dt * 2.5);
        }

        const fov = 62 + 12 * THREE.MathUtils.clamp(this.speed / BOOST_SPEED, 0, 1);
        if (Math.abs(this.camera.fov - fov) > 0.05) {
            this.camera.fov = damp(this.camera.fov, fov, 3, dt);
            this.camera.updateProjectionMatrix();
        }
    }

    private updateStars(time: number) {
        for (const node of this.nodes) {
            node.body.update(time);

            const distance = this.camera.position.distanceTo(node.position);
            const far = node.star.radius < 2 ? 90 : 230;
            const opacity = THREE.MathUtils.clamp(1 - (distance - far) / 80, 0, 1);
            node.label.style.opacity = opacity.toFixed(2);
            node.label.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
        }

        const focus = this.autopilot ?? (this.orbit ? this.byId.get(this.orbit)! : null);
        this.marker.visible = focus !== null;
        if (focus) {
            this.marker.position.copy(focus.position);
            this.marker.scale.setScalar(orbitRadius(focus.star));
            this.marker.rotation.z = time * 0.2;
            (this.marker.material as THREE.MeshBasicMaterial).color.copy(focus.color);
        }
    }

    private updateOrbit() {
        let closest: StarNode | null = null;
        let closestDistance = Infinity;
        for (const node of this.nodes) {
            const d = this.position.distanceTo(node.position);
            if (d < orbitRadius(node.star) && d < closestDistance) {
                closest = node;
                closestDistance = d;
            }
        }
        const id = closest?.star.id ?? null;
        if (id !== this.orbit) {
            if (this.orbit) this.byId.get(this.orbit)?.label.classList.remove('orbit');
            closest?.label.classList.add('orbit');
            this.orbit = id;
            this.options.callbacks.onOrbit(id);
            if (id) this.options.sound.chime();
        }
    }

    private emitHud() {
        let nearest: HudState['nearest'] = null;
        for (const node of this.nodes) {
            if (this.discovered.has(node.star.id)) continue;
            const distance = this.position.distanceTo(node.position);
            if (!nearest || distance < nearest.distance) nearest = {id: node.star.id, distance};
        }
        const speed = Math.abs(this.speed);
        this.options.callbacks.onHud({
            speed,
            throttle: Math.min(speed / BOOST_SPEED, 1),
            autopilot: this.autopilot?.star.id ?? null,
            nearest,
        });
    }

    private computeMinimapExtent() {
        let extent = 0;
        for (const node of this.nodes) {
            extent = Math.max(extent, Math.abs(node.position.x), Math.abs(node.position.z));
        }
        this.minimapExtent = extent + 30;
    }

    private toMinimap(x: number, z: number, size: number) {
        const scale = size / 2 / this.minimapExtent;
        return {x: size / 2 + x * scale, y: size / 2 + z * scale};
    }

    private drawMinimap() {
        const canvas = this.options.minimap;
        if (!canvas || canvas.clientWidth === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = canvas.width;
        const dpr = size / Math.max(canvas.clientWidth, 1);
        ctx.clearRect(0, 0, size, size);

        ctx.lineWidth = dpr;
        ctx.strokeStyle = 'rgba(169, 180, 255, 0.14)';
        ctx.beginPath();
        for (const lane of this.options.galaxy.lanes) {
            const a = this.byId.get(lane.from);
            const b = this.byId.get(lane.to);
            if (!a || !b) continue;
            const p = this.toMinimap(a.position.x, a.position.z, size);
            const q = this.toMinimap(b.position.x, b.position.z, size);
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();

        for (const node of this.nodes) {
            const p = this.toMinimap(node.position.x, node.position.z, size);
            ctx.globalAlpha = this.discovered.has(node.star.id) ? 1 : 0.4;
            ctx.fillStyle = node.css;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1.5, Math.min(node.star.radius * 0.6, 4)) * dpr, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (this.autopilot) {
            const p = this.toMinimap(this.autopilot.position.x, this.autopilot.position.z, size);
            ctx.strokeStyle = this.autopilot.css;
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7 * dpr, 0, Math.PI * 2);
            ctx.stroke();
        }

        const ship = this.toMinimap(this.position.x, this.position.z, size);
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(-this.yaw);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#a9b4ff';
        ctx.shadowBlur = 8 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, -7 * dpr);
        ctx.lineTo(4.5 * dpr, 5 * dpr);
        ctx.lineTo(0, 2.5 * dpr);
        ctx.lineTo(-4.5 * dpr, 5 * dpr);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    private resize = () => {
        const {container, minimap} = this.options;
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.renderer.setSize(width, height);
        this.labels.setSize(width, height);
        this.camera.aspect = width / Math.max(height, 1);
        this.camera.updateProjectionMatrix();

        if (minimap) {
            const px = Math.round(minimap.clientWidth * Math.min(window.devicePixelRatio, 2));
            minimap.width = minimap.height = px;
        }
    };

    private onPointerDown = (e: PointerEvent) => {
        this.pointerDown = {x: e.clientX, y: e.clientY};
    };

    private onPointerUp = (e: PointerEvent) => {
        const start = this.pointerDown;
        this.pointerDown = null;
        if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        this.raycaster.setFromCamera(pointer, this.camera);
        const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0];
        if (hit) this.options.callbacks.onPick(hit.object.userData.starId as string);
    };

    private onMinimapClick = (e: MouseEvent) => {
        const canvas = this.options.minimap;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let best: StarNode | null = null;
        let bestDistance = 14;
        for (const node of this.nodes) {
            const p = this.toMinimap(node.position.x, node.position.z, rect.width);
            const d = Math.hypot(p.x - x, p.y - y);
            if (d < bestDistance) {
                best = node;
                bestDistance = d;
            }
        }
        if (best) this.options.callbacks.onPick(best.star.id);
    };
}
