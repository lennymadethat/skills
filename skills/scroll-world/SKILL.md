---
name: scroll-world
description: Build Apple-AirPods-style scrollytelling pages — a 3D product/character explodes, rotates, or gets toured as you scroll, with feature copy pinned to scroll positions. Use when the user says "scroll world", "scrollytelling", "AirPods-style page", "exploded product page", "make the landing page where scrolling plays the video", or wants a 3D rotating/exploding hero for any build. Covers both techniques (pre-rendered frame-scrub and live WebGL camera rail), the photo→AI-shoot→video→frames asset pipeline, and ready prompt templates.
---

# Scroll World — scroll-driven 3D story pages

The Apple technique: the hero object appears to animate as you scroll, and feature
copy fades in at chosen moments. Two ways to build it — **pick deliberately**:

## Technique A — pre-rendered frame scrub (the actual AirPods method)
A video (real render or AI-generated) is exploded into an image sequence; a full-bleed
`<canvas>` draws frame N where N = scroll progress. Scroll down = video plays forward,
scroll up = backward.

**Use when:** the visual is cinematic (product explosion, photoreal materials, AI-generated
video) and needs zero runtime interactivity. Any video a model can dream up works — the
page can't change colors/parts at runtime, but nothing beats it for fidelity-per-byte of code.

**Budget:** 120–240 frames for a full page, 1600–2000px wide, WebP q70–80 (≈40–90 KB each,
8–20 MB total). Preload the first ~20 frames before reveal, stream the rest. Fewer, bigger
scroll sections beat many small ones.

**Pipeline:** source video → `ffmpeg -i in.mp4 -vf "fps=24,scale=1800:-2" frames/f_%04d.webp`
→ canvas scrub. Full working boilerplate: [references/frame-scrub.html](references/frame-scrub.html)

## Technique B — live WebGL camera rail (Three.js)
A real 3D scene; scroll progress drives a camera along keyframed poses (lerp/slerp between
"shots") and triggers material/emissive changes. This is scrubbing a *camera*, not a video.

**Use when:** the page must react — recolor a muscle, glow an injury, toggle a mesh, or the
same model is reused inside an app. Costs more code; pays off in interactivity.

**Model sourcing rule: find, don't build.** License-clean sources that work headlessly:
- **Z-Anatomy** (CC-BY-SA) — full human anatomy, every muscle a separate named object; Blender files on GitHub, export selective GLBs.
- **BodyParts3D** (CC-BY-SA 2.1 JP) — per-structure meshes.
- **Sketchfab** filtered to CC0/CC-BY — best for stylized/superhero; downloads need a logged-in browser (drive Chrome or ask the owner).
- Marketplace "free" sections are login-walled — flag, don't pretend.

Prep in `gltf-transform`: merge to GLB, Draco/meshopt compress, KEEP mesh names (they're the
API for highlighting). Target < 8 MB hero model for phones.
Boilerplate camera-rail + emissive-highlight code: [references/camera-rail.js](references/camera-rail.js)

## Shared page skeleton (both techniques)
- A tall scroller (`height: N * 100vh`) with a `position: sticky; top: 0` full-viewport stage.
- Progress = `-rect.top / (rect.height - innerHeight)`, eased, driven by rAF (not scroll events).
- Copy blocks: absolutely-positioned, each owns a progress range `[a,b]`, opacity/translate keyed inside it.
- `prefers-reduced-motion`: swap to static poster + normal copy stack. Always ship a poster frame.
- iOS: `viewport-fit=cover`, avoid `100vh` traps (`100dvh`), `will-change: transform` on the stage only.
- No-WebGL/JS fallback: `<noscript>` + poster.

## Asset pipeline: nothing → cinematic frames
1. **Photos** (for real products): 8–12 angles, flat light, or ONE good photo + AI multi-angle.
2. **Nano Banana / image model**: turn photos into a consistent studio shoot (angles, exploded stills, detail macros). Prompts: [references/prompts.md](references/prompts.md)
3. **Video model** (Veo/Kling/Runway): image-to-video with the explosion/turntable prompt — 5–10s, locked camera or slow orbit, black or deep-gradient background, no text overlays.
4. **ffmpeg** → frame sequence → Technique A. (Or skip video entirely and go Technique B with a sourced model.)

## Delivery checklist
- [ ] Scroll forward AND backward both look right (no baked-in motion blur pops)
- [ ] First paint < 2s: poster + first frames inline, rest lazy
- [ ] Copy legible at every breakpoint; sections snap nowhere (free scroll)
- [ ] Reduced-motion + no-JS fallbacks
- [ ] Lighthouse perf ≥ 85 mobile before calling it done
