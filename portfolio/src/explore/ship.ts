import * as THREE from 'three';

export interface Ship {
    root: THREE.Group;
    hull: THREE.Group;
    flames: THREE.Sprite[];
    plumes: THREE.Mesh[];
    exhausts: THREE.Vector3[];
}

export function createShip(glow: THREE.Texture): Ship {
    const root = new THREE.Group();
    const hull = new THREE.Group();
    root.add(hull);

    const armor = new THREE.MeshStandardMaterial({color: 0x2b2d45, metalness: 0.6, roughness: 0.35, flatShading: true});
    const plating = new THREE.MeshStandardMaterial({color: 0xc9cdf2, metalness: 0.3, roughness: 0.45, flatShading: true});
    const neon = new THREE.MeshStandardMaterial({color: 0x8f9bff, emissive: 0x8a7dff, emissiveIntensity: 1.4});
    const glass = new THREE.MeshStandardMaterial({
        color: 0x14142a, emissive: 0x7a6cff, emissiveIntensity: 0.55, metalness: 0.9, roughness: 0.08,
    });

    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, setup?: (m: THREE.Mesh) => void) => {
        const mesh = new THREE.Mesh(geometry, material);
        setup?.(mesh);
        hull.add(mesh);
        return mesh;
    };

    add(new THREE.CylinderGeometry(0.24, 0.7, 3.6, 6), armor, m => {
        m.rotation.x = -Math.PI / 2;
        m.scale.z = 0.55;
        m.position.z = 0.2;
    });
    add(new THREE.ConeGeometry(0.24, 1.5, 6), plating, m => {
        m.rotation.x = -Math.PI / 2;
        m.scale.z = 0.55;
        m.position.z = -2.35;
    });
    add(new THREE.SphereGeometry(0.38, 8, 6), glass, m => {
        m.scale.set(0.75, 0.6, 2.1);
        m.position.set(0, 0.27, -0.85);
    });
    add(new THREE.BoxGeometry(0.06, 0.04, 1.8), neon, m => m.position.set(0, 0.36, 0.75));

    const outline = new THREE.Shape([
        new THREE.Vector2(0.4, 0.6),
        new THREE.Vector2(3.2, -1.1),
        new THREE.Vector2(3.35, -1.65),
        new THREE.Vector2(0.4, -1.95),
    ]);
    const wingGeometry = new THREE.ExtrudeGeometry(outline, {depth: 0.08, bevelEnabled: false});
    wingGeometry.rotateX(-Math.PI / 2);

    const sweep = Math.atan2(1.7, 2.8);
    for (const side of [-1, 1]) {
        add(wingGeometry, plating, m => {
            m.scale.x = side;
            m.position.y = -0.15;
        });

        add(new THREE.BoxGeometry(2.5, 0.03, 0.1), neon, m => {
            m.position.set(side * 1.85, -0.055, 0.45);
            m.rotation.y = -side * sweep;
        });

        add(new THREE.BoxGeometry(0.3, 0.3, 0.8), armor, m => m.position.set(side * 0.62, -0.05, 0.1));

        add(new THREE.CylinderGeometry(0.08, 0.06, 2.1, 6), armor, m => {
            m.rotation.x = Math.PI / 2;
            m.position.set(side * 3.28, -0.1, 0.15);
        });
        const light = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glow, color: side < 0 ? 0xffb3c8 : 0x9ff0c4, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        light.position.set(side * 3.28, -0.1, -0.95);
        light.scale.setScalar(0.6);
        hull.add(light);

        add(new THREE.BoxGeometry(0.07, 0.95, 0.85), plating, m => {
            m.position.set(side * 0.5, 0.48, 1.35);
            m.rotation.set(0.35, 0, -side * 0.38);
        });
        add(new THREE.BoxGeometry(0.075, 0.6, 0.06), neon, m => {
            m.position.set(side * 0.56, 0.5, 1.03);
            m.rotation.set(0.35, 0, -side * 0.38);
        });
    }

    const flames: THREE.Sprite[] = [];
    const plumes: THREE.Mesh[] = [];
    const exhausts: THREE.Vector3[] = [];
    const nozzle = new THREE.MeshBasicMaterial({color: 0xd7d0ff});
    const plumeGeometry = new THREE.ConeGeometry(0.24, 1.6, 8, 1, true);
    plumeGeometry.rotateX(Math.PI);
    plumeGeometry.translate(0, -0.8, 0);

    for (const side of [-1, 1]) {
        const x = side * 0.42;
        add(new THREE.CylinderGeometry(0.28, 0.34, 1.1, 8), armor, m => {
            m.rotation.x = Math.PI / 2;
            m.position.set(x, 0, 1.5);
        });
        add(new THREE.CircleGeometry(0.25, 8), nozzle, m => m.position.set(x, 0, 2.06));

        plumes.push(add(plumeGeometry, new THREE.MeshBasicMaterial({
            color: 0xa99cff, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        }), m => {
            m.rotation.x = -Math.PI / 2;
            m.position.set(x, 0, 2.07);
        }));

        const flame = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glow, color: 0xb9b0ff, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        flame.position.set(x, 0, 2.25);
        hull.add(flame);
        flames.push(flame);

        exhausts.push(new THREE.Vector3(x, 0, 2.3));
    }

    return {root, hull, flames, plumes, exhausts};
}
