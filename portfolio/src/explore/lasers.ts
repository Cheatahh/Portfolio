import * as THREE from 'three';
import {type AsteroidField, type Obstacle, segmentSphere} from './asteroids.ts';

interface Bolt {
    group: THREE.Group;
    direction: THREE.Vector3;
    velocity: THREE.Vector3;
    target: THREE.Object3D | null;
    age: number;
}

interface Spark {
    sprite: THREE.Sprite;
    age: number;
}

const SPEED = 220;
const LIFE = 1.1;
const COOLDOWN = 0.14;
const LENGTH = 3.2;
const SPARK_LIFE = 0.25;
const COLOR = 0xff8ad8;
const MUZZLES = [new THREE.Vector3(-3.28, -0.1, -1.3), new THREE.Vector3(3.28, -0.1, -1.3)];
const AXIS = new THREE.Vector3(0, 0, -1);
const AIM_RANGE = 40;
const AIM_CONE = Math.cos(THREE.MathUtils.degToRad(28));
const AIM_TURN_RATE = 50;

export class LaserBattery {
    private readonly group = new THREE.Group();
    private readonly core = new THREE.CylinderGeometry(0.05, 0.05, LENGTH, 6).rotateX(Math.PI / 2);
    private readonly halo = new THREE.CylinderGeometry(0.16, 0.16, LENGTH * 1.15, 8).rotateX(Math.PI / 2);
    private readonly coreMaterial = new THREE.MeshBasicMaterial({color: 0xfff0fb, fog: false});
    private readonly haloMaterial = new THREE.MeshBasicMaterial({
        color: COLOR, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    });
    private readonly muzzleFlashes: THREE.Sprite[];
    private readonly bolts: Bolt[] = [];
    private readonly sparks: Spark[] = [];
    private readonly from = new THREE.Vector3();
    private readonly to = new THREE.Vector3();
    private cooldown = 0;
    private gun = 0;

    constructor(
        scene: THREE.Scene,
        private readonly hull: THREE.Object3D,
        private readonly asteroids: AsteroidField,
        private readonly obstacles: readonly Obstacle[],
        private readonly glow: THREE.Texture,
        private readonly onFire: (side: number) => void,
    ) {
        scene.add(this.group);
        this.muzzleFlashes = MUZZLES.map(muzzle => {
            const flash = new THREE.Sprite(new THREE.SpriteMaterial({
                map: glow, color: COLOR, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending, depthWrite: false,
            }));
            flash.position.copy(muzzle);
            flash.scale.setScalar(1.6);
            hull.add(flash);
            return flash;
        });
    }

    update(dt: number, firing: boolean, shipVelocity: THREE.Vector3) {
        this.cooldown -= dt;
        if (firing && this.cooldown <= 0) {
            this.fire(shipVelocity);
            this.cooldown = COOLDOWN;
        }

        for (const flash of this.muzzleFlashes) {
            flash.material.opacity = Math.max(0, flash.material.opacity - dt * 9);
        }

        for (let i = this.bolts.length - 1; i >= 0; i--) {
            const bolt = this.bolts[i];
            bolt.age += dt;
            this.home(bolt, dt);
            this.from.copy(bolt.group.position);
            this.to.copy(this.from).addScaledVector(bolt.velocity, dt);

            const hit = this.asteroids.strike(this.from, this.to, bolt.direction) ?? this.hitObstacle();
            if (hit) {
                this.spark(hit);
                this.removeBolt(i);
                continue;
            }
            bolt.group.position.copy(this.to);
            if (bolt.age > LIFE) this.removeBolt(i);
        }

        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            spark.age += dt;
            const t = spark.age / SPARK_LIFE;
            if (t >= 1) {
                this.group.remove(spark.sprite);
                spark.sprite.material.dispose();
                this.sparks.splice(i, 1);
                continue;
            }
            spark.sprite.material.opacity = 1 - t;
            spark.sprite.scale.setScalar(1.5 + t * 3);
        }
    }

    dispose() {
        this.group.removeFromParent();
        this.muzzleFlashes.forEach(flash => {
            flash.removeFromParent();
            flash.material.dispose();
        });
        this.sparks.forEach(spark => spark.sprite.material.dispose());
        this.core.dispose();
        this.halo.dispose();
        this.coreMaterial.dispose();
        this.haloMaterial.dispose();
    }

    private fire(shipVelocity: THREE.Vector3) {
        const index = this.gun;
        this.gun = (this.gun + 1) % MUZZLES.length;

        this.hull.updateWorldMatrix(true, false);
        const origin = this.hull.localToWorld(MUZZLES[index].clone());
        const direction = AXIS.clone().transformDirection(this.hull.matrixWorld);

        const group = new THREE.Group();
        group.add(new THREE.Mesh(this.core, this.coreMaterial), new THREE.Mesh(this.halo, this.haloMaterial));
        group.position.copy(origin).addScaledVector(direction, LENGTH / 2);
        group.quaternion.setFromUnitVectors(AXIS, direction);
        this.group.add(group);

        const forward = Math.max(0, shipVelocity.dot(direction));
        this.bolts.push({
            group,
            direction,
            velocity: direction.clone().multiplyScalar(SPEED + forward),
            target: null,
            age: 0,
        });
        this.muzzleFlashes[index].material.opacity = 1;
        this.onFire(Math.sign(MUZZLES[index].x));
    }

    private home(bolt: Bolt, dt: number) {
        if (bolt.target && !bolt.target.parent) bolt.target = null;
        bolt.target ??= this.asteroids.seek(bolt.group.position, bolt.direction, AIM_RANGE, AIM_CONE);
        if (!bolt.target) return;
        const desired = this.from.subVectors(bolt.target.position, bolt.group.position);
        if (desired.dot(bolt.direction) <= 0) {
            bolt.target = null;
            return;
        }
        desired.normalize();
        const speed = bolt.velocity.length();
        bolt.direction.lerp(desired, Math.min(1, AIM_TURN_RATE * dt)).normalize();
        bolt.velocity.copy(bolt.direction).multiplyScalar(speed);
        bolt.group.quaternion.setFromUnitVectors(AXIS, bolt.direction);
    }

    private hitObstacle(): THREE.Vector3 | null {
        let nearest: number | null = null;
        for (const obstacle of this.obstacles) {
            const t = segmentSphere(this.from, this.to, obstacle.position, obstacle.radius);
            if (t !== null && (nearest === null || t < nearest)) nearest = t;
        }
        return nearest === null ? null : this.from.clone().lerp(this.to, nearest);
    }

    private removeBolt(index: number) {
        this.group.remove(this.bolts[index].group);
        this.bolts.splice(index, 1);
    }

    private spark(position: THREE.Vector3) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.glow, color: COLOR, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        sprite.position.copy(position);
        sprite.scale.setScalar(1.5);
        this.group.add(sprite);
        this.sparks.push({sprite, age: 0});
    }
}
