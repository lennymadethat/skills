// Scroll World · Technique B: live Three.js camera rail + mesh highlighting.
// Vanilla Three.js (no react-three-fiber needed). Works in a plain <script type="module">
// or imported into React (mount in useEffect, guard for SSR-less Vite builds).
//
// Contract: a GLB whose mesh NAMES are the API — e.g. "chest", "bicep_l", "veins".
// Shots array = the storyboard: camera pose + which mesh glows + copy element id.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* ---------- storyboard: one entry per scroll beat ---------- */
// pos/look = camera keyframe. highlight = mesh name(s) to light. copy = element id to fade in.
export const SHOTS = [
  { at: 0.00, pos: [0, 1.5, 4.2], look: [0, 1.2, 0], highlight: [],          copy: null },
  { at: 0.18, pos: [0.6, 1.6, 2.2], look: [0, 1.45, 0], highlight: ['chest'], copy: 'beat-chest' },
  { at: 0.40, pos: [-1.2, 1.5, 1.8], look: [-0.25, 1.5, 0], highlight: ['delt_l', 'bicep_l'], copy: 'beat-arms' },
  { at: 0.62, pos: [0, 1.1, 1.6], look: [0, 1.15, 0], highlight: ['abs'],    copy: 'beat-core' },
  { at: 0.84, pos: [0.4, 0.7, 2.4], look: [0, 0.8, 0], highlight: ['quad_l', 'quad_r'], copy: 'beat-legs' },
  { at: 1.00, pos: [0, 1.4, 5.0], look: [0, 1.2, 0], highlight: [],          copy: 'beat-cta' },
];

const HIGHLIGHT = new THREE.Color('#2ee6c5');
const INJURY = new THREE.Color('#ff4d4d');

export function mountScrollWorld({ canvas, sectionEl, glbUrl, shots = SHOTS, injuries = [] }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  // dark-studio rig: key, rim, fill — reads great on near-black pages
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6ea8ff, 1.4); rim.position.set(-3, 2, -3); scene.add(rim);

  const meshes = new Map(); // name -> mesh (unique materials so recolors don't bleed)
  const baseEmissive = new Map();

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  loader.load(glbUrl, (gltf) => {
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();               // per-mesh material = per-mesh recolor
      meshes.set(o.name, o);
      baseEmissive.set(o.name, o.material.emissive?.clone() ?? new THREE.Color(0));
    });
    scene.add(gltf.scene);
    // standing injury glows (severity 0..1 → emissive intensity)
    for (const { mesh, severity } of injuries) setGlow(mesh, INJURY, 0.4 + severity * 0.6);
  });

  function setGlow(name, color, intensity = 1) {
    const m = meshes.get(name); if (!m?.material?.emissive) return;
    m.material.emissive.copy(color);
    m.material.emissiveIntensity = intensity;
  }
  function clearGlow(name) {
    const m = meshes.get(name); if (!m?.material?.emissive) return;
    m.material.emissive.copy(baseEmissive.get(name));
    m.material.emissiveIntensity = 1;
  }

  /* ---------- scroll → camera lerp between shot keyframes ---------- */
  const v = { pos: new THREE.Vector3(), look: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() };
  const ease = (t) => t * t * (3 - 2 * t); // smoothstep between shots
  let lit = new Set();

  function apply(p) {
    let i = 0;
    while (i < shots.length - 1 && shots[i + 1].at <= p) i++;
    const A = shots[i], B = shots[Math.min(i + 1, shots.length - 1)];
    const t = A === B ? 0 : ease((p - A.at) / Math.max(1e-6, B.at - A.at));
    camera.position.copy(v.a.fromArray(A.pos).lerp(v.b.fromArray(B.pos), t));
    camera.lookAt(v.look.fromArray(A.look).lerp(v.pos.fromArray(B.look), t));

    // highlight = the NEXT shot's target as we approach it (feels anticipatory)
    const want = new Set(t > 0.5 ? B.highlight : A.highlight);
    for (const name of lit) if (!want.has(name)) clearGlow(name);
    for (const name of want) if (!lit.has(name)) setGlow(name, HIGHLIGHT, 0.9);
    lit = want;

    // copy blocks
    document.querySelectorAll('[data-beat]').forEach((el) => {
      const active = (t > 0.5 ? B : A).copy === el.id;
      el.style.opacity = active ? 1 : 0;
      el.style.transform = active ? 'none' : 'translateY(20px)';
    });
  }

  const progress = () => {
    const r = sectionEl.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  };
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  addEventListener('resize', size, { passive: true }); size();

  let raf;
  (function tick() {
    apply(progress());
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  })();

  return {
    setGlow, clearGlow, meshes,
    destroy: () => { cancelAnimationFrame(raf); renderer.dispose(); },
  };
}
