---
name: particle-forge
description: the owner's house particle system — turn any 3D model or text into GPU ember point-clouds with seven named moves (form, morph, explode, traverse, depth-rotate, react, re-materialize). Use when the user says "/particle-forge", "form the <model>", "morph X into Y", "explode the engine", "make X out of sparks/embers/particles", "particle effect for <section>", or wants any 3D-to-particles moment built or tuned. Covers the GLB→points bake pipeline, the shader recipes, budgets, fallbacks, and the screenshot-verification loop.
---

# Particle Forge — the house particle system

Born 2026-08-26/27 when the seven-beat "swarm" was rejected (1.45px scratches on cream) and
rebuilt as THE FORGE. The lesson that created this skill: **particle beauty = dark ground +
additive glow + density + depth + a pixel-target reference bar.** Never build an effect
without screenshots judged against the bar (Igloo Inc, Lusion, Exo Ape tier).

## Where the code lives
- Two `<script type="module">` files in the site repo, no build step: a hero (load-driven:
  swirl → assemble wordmark → quench → ambient) and a scrollytelling section (scatter →
  shape, lattice + pulses). three.js vendored (MIT, attribution header kept).
- Cache-bust via `?v=` when the repo uses it.
- Verification: Playwright screenshots at timeline moments, desktop 1600×900 + phone 390×844,
  JUDGE EVERY FRAME before pushing. This loop is not optional.

## The architecture (all GPU, no per-frame CPU particle loops)

One `THREE.Points` cloud. Per-particle attributes: `aStart` (vec3 spawn), `aTarget` (vec3
destination), `aSeed` (vec4 randoms: phase, speed, sizeFactor, role). Uniforms drive
everything: `uTime`, plus 0→1 phase floats (`uAssemble`, `uQuench`, `uForm`, `uRelease`,
`uScroll`, `uCalm`...) eased in the vertex shader with per-particle stagger:
`t = smoothstep(clamp((uPhase - seed.x*0.35)/0.65))`.

- Camera: `OrthographicCamera(0, W, 0, H)` — world units = CSS pixels, y-down. Alignment
  with DOM elements is then just `getBoundingClientRect()`.
- Material: `ShaderMaterial`, `transparent`, `depthWrite:false`, `AdditiveBlending`.
- Fragment = soft disc sprite: `disc = smoothstep(.5,.06,d)`, hot core
  `core = smoothstep(.24,0,d)`; color ramp deep-ember `vec3(.52,.12,.03)` → safety orange
  `vec3(.95,.34,.14)` → white-hot `vec3(1,.85,.58)` by a per-particle `vHeat`.
- Counts: desktop 25–45k, phone 12–15k. DPR capped at 2. IntersectionObserver start/stop;
  ONE canvas active per viewport (sections hand off, never stack).
- Fallbacks (all already patterned in repo): reduced-motion / no-WebGL / no-JS get the
  finished static layout. CSS gates animated form behind `html.js` +
  `:not(.is-static)`; JS adds `.is-static` on any boot failure. NEVER let content
  depend on the canvas working.

## Sources of target points

1. **Text** — draw to offscreen canvas with the element's computed font (wait
   `document.fonts.load`), scan alpha at step 2–3px (sample the title element).
2. **Procedural** — math shapes (a math shape, the "no model available" case).
3. **Models (the good way)** — bake pipeline below. Only geometry matters; textures and
   materials are irrelevant, so ugly/free models sample fine. Silhouette + surface detail
   are everything; flat boxes sample worst.

## The bake pipeline (GLB → small binary, visitors never download the model)

Node script pattern (write as `scripts/bake-points.mjs` in the site repo when first needed):
`GLTFLoader` (+`DRACOLoader` if compressed) → merge/traverse meshes →
`MeshSurfaceSampler.setWeightAttribute(null).build()` → sample N points **with normals** →
optionally record a per-point part-id (index of the source mesh) for exploded views →
write `Float32Array` positions (+ normals + partId) as `.bin` + tiny JSON manifest
(count, bbox, scale hints, license/attribution string). Loader in the page: `fetch` →
`arrayBuffer` → set as attributes. A 4M-poly model becomes ~1–2MB for 60k points; quantize
to Int16 against the bbox for ~0.4MB if needed. Keep source GLBs OUT of the public repo
(local `models-src/` folder, gitignored); commit only baked `.bin` + manifest + the credit.

Conversions: OBJ/FBX/STL → GLB via Blender CLI or `obj2gltf` if a purchase isn't GLB.
Sketchfab free downloads need a free account (browser); NIH/NASA/Smithsonian are
direct URLs. LICENSE LAW: CC0/PD best; CC-BY = record exact attribution and add to the ONE
"Model credits" footer line; never NC/ND/editorial/branded-product replicas. Keep a verified
shopping list with licences in your notes.

## The seven moves (named — the owner invokes these by name)

1. **FORM** — cloud assembles the shape. Spawn on a ring partly INSIDE the viewport
   (offscreen-only spawns made the opening read empty — learned 08-26), quadratic bezier
   with an upward-arced midpoint, staggered t, heat rises toward lock, optional quench
   flash + handoff to crisp DOM content at the end (particles scatter/fade AS the real
   element fades in — never leave particle noise sitting on readable type).
2. **MORPH** — same cloud, new `aTarget` buffer. Crossfade positions with a whip arc
   (bezier via a perpendicular-offset midpoint). Shuffle the index mapping per morph so the flow looks organic. The
   half-formed midpoint is the money shot — let it breathe ~0.3s.
3. **EXPLODE** — needs part-ids (or slice a single mesh into spatial bands along an axis).
   Per part: offset along (partCentroid − modelCenter), scroll-driven, staggered per part;
   pause at full spread for labeled captions; reverse on scroll-up.
4. **TRAVERSE** — signal packets: separate small Points set with `aFrom`/`aTo` surface
   pairs, position = arc bezier bulged outward, `u = fract(uTime*speed + phase)`,
   brightness `sin(u*PI)`. Plus optional faint `LineSegments` lattice between NEAR
   neighbor pairs (pick nearest of ~8 random candidates so the lattice reads structural,
   not chaotic). Alpha ~0.09–0.13, additive.
5. **DEPTH-ROTATE** — keep points 3D, rotate around Y in the vertex shader
   (`rb = vec3(b.x*ca + b.z*sa, b.y, -b.x*sa + b.z*ca)`), project x/y, use depth
   `(rb.z+1.4)/2.8` to scale `gl_PointSize` and alpha (back dim ~0.16, front ~0.94).
   This is what separates "expensive" from "screensaver". Drag-to-spin: pointer drag
   adds to the rotation angle with inertia.
6. **REACT** — pointer as heat: `inf = exp(-d2/8100.)` (≈90px falloff), push
   `pos.xy += normalize(dp)*inf*24.`, brighten `vHeat += inf*.9`. Variants: torch-reveal
   (raise alpha/density near pointer instead of pushing), touch-fire (spawn TRAVERSE
   pulses from the touched surface point).
7. **RE-MATERIALIZE** — same positions, different skin per beat: embers (house default),
   glyph rain (draw chars via `fillText`, green ramp — ONE beat max per page), steel dust
   (tiny grey, NormalBlending). Switch by material/draw path, not by rebuilding clouds.

## Composition rules (the taste layer)

- ONE move at a time on screen; the rest of the page stays quiet and readable.
- Dark ground always (`#0A0C0E`–`#14181B` radial), embers emit light; never particles on
  cream — that was the original sin.
- After any FORM lock, real DOM takes over (selectable, tappable, 44px targets).
- Ambient states calm down: post-quench `uCalm` ramps over ~3s, live-ember fraction ≤15%.
- Effects must MEAN the product (sparks=forge, pulses=thinking, transmit=a relay);
  if a move could be swapped onto another product unchanged, it's decoration — cut it.
- Session-replay: play a 2.1× cut when `sessionStorage` says they've seen it.

## The steal shelf (3-agent web sweep, verified 2026-08-27 — links + licenses read at source)

**LIFT-OK (copy with attribution kept):**
- `three.js examples/jsm` (MIT): `misc/GPUComputationRenderer.js` — THE FBO ping-pong harness;
  `math/MeshSurfaceSampler.js` — the GLB→points sampler. Both r169-native, take verbatim.
- `edankwan/The-Spirit` (MIT) — curl-noise GLSL + FBO-history ribbon trails; the reference
  for "expensive-looking" particle motion. Our lift-safe curl source.
- `spite/polygon-shredder` (MIT) — curl-driven dissolve/reassemble (explode-then-reform as
  simulation); second MIT curl copy.
- `stegu/webgl-noise` (MIT) — canonical ashima simplex noise 2/3/4D + psrdnoise w/ analytic
  derivatives. Vendor `src/noise3D.glsl`; everything builds on it.
- `Mamboleoo/SurfaceSampling` (MIT, Codrops) — minimal GLB→sampler→Points recipes incl.
  vertex-color sampling.
- **Codrops demo code is MIT** (verified tympanus.net/licensing) — the whole
  github.com/codrops org is quarry. Best: `JatinChopra/emissive-dissolve-effect` (noise-
  threshold dissolve + glowing edge band + edge-emitted particles + selective bloom via dual
  render pass) and "Crafting Scroll Based Animations in Three.js" (scrollY→uniform bridge).
- **Shadertoy `wl2Gzc` "Sparks from fire" (CC BY 3.0 — author-labeled)** — complete ember
  recipe: layered voronoi sparks, dual-SDF core+halo glow, turbulent smoke. Attribution line
  required. (Shadertoy EXCEPTION — see gotchas.)
- `iquilezles.org` code snippets (site states MIT): cosine palettes, smoothsteps family,
  pcurve/expStep/gain, SDFs, smin. His finished shader ARTWORKS are licensed — never those.
- `spite/THREE.MeshLine` (MIT) — width-tapered camera-facing ribbon lines → upgrade traverse
  pulses to glowing arcs. `zadvorsky/three.bas` (MIT) — GLSL easing lib + delay/stagger
  attribute patterns for the closed-form moves. `alphardex/kokomi.js` (MIT) — ergonomic
  GPUComputer wrapper reference. `Alchemist0823/three.quarks` (MIT) — trail render mode +
  batched renderer. `darkroomengineering/lenis` (MIT) + `russellsamora/scrollama` (MIT) —
  scroll spine if ever needed. `brunosimon/folio-2019` (MIT).
- Three.js Journey course CODE (terms Art.5 verified): reusable in commercial projects;
  course CONTENT is not.

**STUDY-ONLY (no license / NC — learn, re-implement clean, never paste):**
- `DGFX/codrops-dreamy-particles` repo (no LICENSE despite MIT article claim) — but it's the
  best single map of the target architecture: GPUComputationRenderer + sampler seeds +
  pointer forces + light bloom. Read first.
- `cabbibo/glsl-curl-noise` (no license — the snippet everyone copies; use The-Spirit's MIT
  curl instead). `nicoptere/FBO` (no license — clearest FBO teaching). 
- `brunoimbrizi/interactive-particles` — its **touch-texture** (pointer trail drawn to
  offscreen canvas, sampled as displacement/heat map) is the upgrade path for REACT.
- `akella/ExplodingObjects` (README grant, no resale as-is) + his streams: watch a pro
  approximate award sites; his MIT repos (webGLImageTransitions etc.) are lift-ok.
- Maxime Heckel articles — repo MIT but CONTENT CC BY-NC → study-only; clearest FBO/curl
  mental model on the web.

**License gotchas (do not slip):** Shadertoy unlabeled = CC BY-NC-SA = STUDY-ONLY always;
check each shader's header for overrides. GSAP is now 100% free for commercial use (Webflow,
verified gsap.com) but PROPRIETARY — usable as dependency, never vendorable as source; the
vanilla stack stays Lenis/scrollama/native scroll-timelines. `pmndrs/postprocessing` is Zlib
(permissive, OSI) — not on the house LIFT list; needs a one-line owner ruling before lifting
(its mipmap bloom is the lightest quality bloom around).

## Curriculum (priority order, from the verified sweep)
1. IQ cosine palettes + functions/smoothsteps (~2h, instant color/curve upgrade).
2. Book of Shaders ch. 5 (shaping), 10 (random), 11 (noise), 13 (fbm).
3. Heckel: FBO particles → Render Targets → Post-processing-as-medium (mental models).
4. Three.js Journey L40 Particles Morphing + L41 GPGPU Flow Field (+L45 post) — $95, code
   commercially reusable (a purchase call).
5. Soft particles (NVIDIA paper) + selective bloom + afterimage (three.js official examples).
6. Rauno "Invisible Details of Interaction Design" + Emil Kowalski free posts (choreography).
7. akella streams ongoing. Optional: animations.dev $249 if motion taste lags.

## Frontier shelf (3-agent sweep #2, verified 2026-08-27 — lighting, showpieces, polish)

**Material identities ("skins") — all vanilla r169, all LIFT-OK:**
- ONE Poly Haven HDRI (CC0, polyhaven.com/license) → `scene.environment` (RGBELoader +
  EquirectangularReflectionMapping; PMREM automatic in r169) = instant product-shot look.
  Studio softbox HDRIs (`studio_small_09` family); RoomEnvironment.js (ships in three) =
  zero-file fallback.
- r169 CORE MeshPhysicalMaterial already has: transmission+thickness+ior+attenuation,
  `dispersion` (r167+, rainbow refraction), iridescence, sheen, anisotropy (computeTangents),
  clearcoat. Menu: cold vault steel (black metal + env stripes + rim), museum glass
  (transmission+dispersion), oil-slick (iridescence), velvet (sheen), brushed titanium
  (anisotropy), piano lacquer (clearcoat). Official examples exist for each.
- drei MeshTransmissionMaterial (MIT) — extract the class (extends MeshPhysicalMaterial,
  onBeforeCompile + backside FBO + roughness blur + per-channel-IOR chromatic) for the
  award-site glass; core transmission first, this is the 20% upgrade.
- Matcaps: **nidorx/matcaps is UNLICENSED SCRAPED imagery — never ship.** Author our own with
  kchapelier/matcap-studio (MIT tool → outputs ours). MeshMatcapMaterial = zero lights.
- **Lit particles (the bridge trick):** bake surface NORMALS with positions in the point
  pipeline; then per-spark fresnel rim (`pow(1-dot(N,V),p)`), hemisphere tint
  (`mix(ground,sky,N.y*.5+.5)`), or MATCAP-SAMPLED sparks (`texture2D(matcap,N.xy*.5+.5)`)
  — the cloud inherits the destination object's material before forming it. Nobody does this.
- Grounding: official contact-shadows example (~80 lines, blurred depth-from-below blob);
  N8python/n8ao SSAO is **CC0**, CDN-importable, half-res mode — drop-in.
- Glow without post: ektogamat/fake-glow-material-threejs (MIT, single file, needs smooth
  normals). God rays: Ameobea/three-good-godrays (zlib) + pmndrs postprocessing (zlib) —
  **zlib: LIFT-OK** (keep the notice, mark alterations).

**Showpieces:**
- **Gaussian splats**: sparkjsdev/spark (MIT, active 2026, three.js-native, mixes splats with
  meshes, programmable splat effects — THE pick) > mkkellogg/GaussianSplats3D (MIT, weaker
  mobile, needs COOP/COEP unless sharedMemoryForWorkers:false). Capture FREE: Scaniverse
  (on-device, exports SPZ/PLY) or Luma app; clean/crop/compress with playcanvas supersplat
  (MIT, superspl.at); PLY→SOG 10-20x smaller; hero scene 3-15MB, keep <~1M splats for phone.
  INRIA reference code = non-commercial, irrelevant to this path. OpenSplat = AGPL tool,
  LOCAL-TOOL-OK output. Pitch: a photoreal scan of the real workshop or product dissolving into embers.
- Fluid: PavelDoGreat/WebGL-Fluid-Simulation (MIT, phone-proven) or WebGL-Fluid-Enhanced
  (MIT, ES-module config API); advanced: sample fluid velocity texture in our particle shader.
- Liquid chrome: three.js official MarchingCubes addon (in r169, MIT) + env map = luxury
  metaball blob, near-free. Volumetrics: leoawen/volumetric-clouds (MIT); raymarch = half-res
  buffer or desktop-only. SDF scenes: shader-park-core (MIT).
- Physics delight: rapier3d-compat (Apache-2.0, ~2MB wasm CDN-ok) or cannon-es (MIT, light,
  coasting). Audio-reactive: AnalyserNode → bass/mid/high uniforms into existing shaders
  (tgcnzn/Interactive-Particles-Music-Visualizer, MIT, is the map) — iOS needs
  gesture-gated AudioContext. HIGH brand fit (audio products).
- WebGPU: three WebGPURenderer stable since ~r171 w/ auto WebGL2 fallback; 1M+ particles.
  Migration = TSL port of shaders; do it only for a million-particle moment, not before.

**Polish layer:**
- Type in WebGL: troika-three-text (MIT, active, worker SDF from any font, curveRadius,
  per-glyph shader patching, importmap via jsDelivr /+esm). Kinetic-type: render-to-texture +
  noise mesh (marioecg/codrops-kinetic-typo MIT — port technique, deps stale).
- Transitions: gl-transitions (repo MIT, **each transition file may carry own header
  license — check per file**) glued via the official webgl_postprocessing_transition
  pattern (two render targets + mask). Single-page rule: the particle MORPH is the
  transition; texture wipes are fallback.
- Choreography: GSAP timelines → uniform `.value` tweens + ScrollTrigger scrub (free-
  commercial, proprietary — dependency, never vendor). theatre.js: core Apache-2.0 OK,
  **studio is AGPL — desk-only, strip before deploy**; frozen at 0.7.2 — author JSON, replay
  via core/GSAP. Cursor: in-scene ember trail > DOM cursor; codrops/MagneticButtons (MIT).
- Sound: howler.js (MIT, 7kb) or raw WebAudio; default OFF + persistent toggle + localStorage,
  low gain, debounced. Preloader: LoadingManager progress → smoothed uProgress → the FORM
  move builds the hero as assets load (renderer.compileAsync + document.fonts.ready gates).
- **Judging math (Awwwards, verified): Design 40 / Usability 30 / Creativity 20 / Content 10.
  Typography, rhythm, unbroken scroll outweigh effects 7:2. One move at a time; readable DOM
  after every effect; jank loses awards, not missing fireworks.**

## Ten engine upgrades to adopt (in rough order of visible gain per effort)
1. Cosine palette `a + b*cos(6.2831*(c*t+d))` driven by life/heat — replaces mix() chains.
2. Hash-derived per-particle phase/lifetime/size jitter — uniform swarms are the #1 tell.
3. `pcurve`/`expStep` size+alpha over life — fast ignite, long decaying tail.
4. Curl-noise velocity field (MIT stack: stegu noise + The-Spirit curl) — replaces sine wobble.
5. FBO ping-pong sim via GPUComputationRenderer — persistent velocity/forces, 100k @60fps.
6. Touch-texture pointer field (persistent decaying heat map) — upgrade of REACT.
7. DOF point sprites — size/alpha by distance from focal plane; near-free cinematic depth.
8. Selective bloom on the ember layer only (official selective-bloom example pattern).
9. Feedback-buffer trails (AfterimagePass or hand-rolled) — ember streaks without geometry.
10. One custom final grade pass (grain + subtle chromatic aberration + vignette) as the
    house signature.

## Verification modes (2026-08-28)

The screenshot loop is no longer the only sanctioned path. Pick a mode per session; say which one.

| Mode | Who judges | Use when |
|---|---|---|
| **RAIL** | the owner, live at the desk | taste-dominant work. **Preferred.** |
| **SWEEP** | a model unattended overnight, the owner reviews in the morning | multi-item plans, long autonomous runs |
| **SHOT** | the screenshot loop below | neither available; correctness checks |

**Split the judging.** Screenshots keep the MECHANICAL checks only - did it render, is it black,
is the phone layout intact, did the DOM handoff fire. the owner only ever judges TASTE. This alone
cuts screenshot spend by more than half.

**RAIL spec:**
1. *Variant grid* - never show one thing. Four variants on one page, `?v=1..4` or number keys.
   One link, one round trip, replaces 3-5 screenshot iterations. Designers choose faster than
   they critique.
2. *Live knob rail* (the one that matters) - every judgment constant (arc, stagger, heat, spawn
   radius, quench duration) becomes a URL param + on-screen slider panel behind `?tune=1`.
   **Fails closed, no UI to enable it in prod** (fails closed, like any by-hand gate).
   He drags, hits "copy settings", pastes back one line:
   `arc=0.62 stagger=0.38 heat=0.94 spawn=0.45 quench=180`. Zero translation loss.
   **Must be touch-friendly - he reviews on a phone.**
3. *Bar file* - 3-5 reference clips named here once, so any model self-checks against a fixed
   external reference instead of its own notion of "good".

**Reply vocabulary (four words):** `ship` / `closer: <param>=<value>` / `wrong move` / `dead`.

**Model tier for forge work:** the strongest model (high effort) for a new move, first build, or silent-GLSL
debugging; a long-horizon model only for unattended overnight runs across several items; a fast
model for tuning cycles once the RAIL exists.
The biggest quality gap between tiers is whether the model keeps iterating instead of declaring
victory - the RAIL moves that decision to the owner and partially neutralises the tier question.

## PREMIUM IS SUBTRACTIVE (art-direction rule)

Effects do not close the gap to a premium site. Awwwards weights **Design 40 / Usability 30 /
Creativity 20 / Content 10** - typography and rhythm outrank effects ~7:2. A perfect ember forge
with 22 arbitrary font sizes scores below a plain site with a disciplined type system.

**Audit any page against this before adding a move:**
- Type scale: **six sizes on a ratio**, not 22 ad-hoc values. Sizes differing by fractions of a
  pixel (0.97 / 0.98 / 1.02rem) are the most reliable amateur tell in a stylesheet.
- Display tracking **negative above ~64px** (-0.02 to -0.04em). Positive tracking on a 128px
  line reads loose.
- **Three durations** (160/400/800ms) tied to element size, **one** easing curve everywhere.
  Every bare `ease` is the browser default and reads cheap.
- Content must be **visible at frame 1**, never gated on the animation completing. `.is-static`
  covers a boot failure but NOT a stall.
- One accent colour. Heavy restraint per screen.

**Ranked list of what actually makes it stunning:** 1. dark ground + emitted light · 2. density ·
3. depth (3D rotation with size+alpha falloff) · 4. motion choreography · 5. one HDRI if anything
is lit · 6. post (bloom/grain/vignette) · 7. **polygon count - dead last.**
None of the top six come from the model file. *Geometry is a stencil; light and motion are the art.*

## Blend mode is part of RE-MATERIALIZE, not just colour

Embers are emissive; water and foliage are not. Additive grass glows like neon, additive rain
looks like tracer fire. Switching skin means switching blending:
embers/explode = Additive · rain = Additive at very low alpha (0.10-0.18) ·
grass/foliage/steel dust = **NormalBlending, depthWrite true**.

## Audit hygiene (learned the hard way 2026-08-28)

- **A 200 is not the page.** Verify by `<title>`. A pre-existing server on another port will
  answer 200 and serve someone else's app; a failed `http.server` bind dies silently.
- **rAF is throttled in an automated browser tab** - a WebGL screenshot may show a frozen
  mid-animation state. Never diagnose density or sparsity from one.
- **Interrogate the DOM with `javascript_tool`; do not infer from stills.** Check the element's
  own computed style, not `document.body` - that error produced a completely wrong "cream ground"
  finding that had to be retracted.
