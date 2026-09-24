# Scroll World — prompt templates

Three stages: (1) Nano Banana turns real photos into a consistent studio shoot,
(2) a video model animates the money shot, (3) ffmpeg turns the video into scrub frames.
Swap the `[PRODUCT]` block per build. A worked example at the bottom.

---

## 1 · Nano Banana — product studio shoot (from the owner's photos)

> Using the attached photo(s) of [PRODUCT — one sentence: what it is, size, materials],
> create a professional studio product photograph. Matte near-black background (#0a0c0e)
> with a soft floor reflection. Single large softbox key light from upper-left, subtle
> cool rim light from behind-right tracing the silhouette. The product is clean, new,
> free of dirt and glare. Keep every proportion, port, label and surface detail exactly
> as photographed — do not invent features. 8K, sharp focus, shallow depth of field.
> Angle: [three-quarter front / straight side profile / top-down / rear three-quarter /
> macro detail of X].

Run it once per angle (6–8 angles). Keep the seed/reference consistent by always
attaching the same source photos plus the best prior output.

## 2 · Nano Banana — exploded-view still

> Using the attached studio photos of [PRODUCT], create a technical exploded-view
> render: the product's outer shell lifted apart along a vertical axis, revealing the
> internal components ([LIST REAL COMPONENTS: battery pack, PCB, sensor module, housing
> seals…]) floating in precise alignment with even spacing, each part fully visible,
> connected by faint thin guide lines. Same matte near-black studio, same lighting.
> Engineering-poster aesthetic, photoreal materials, no text, no labels.

## 3 · Video model (Veo / Kling / Runway) — the scrub shot

The frame-scrub page plays this forward AND backward, so avoid one-way effects
(smoke, sparks, debris). Locked or slow-orbit camera only.

> Photoreal studio render of [PRODUCT] centered on a matte near-black background.
> The camera orbits slowly 90 degrees while the product smoothly disassembles:
> the outer shell splits and glides apart along the vertical axis, internal components
> ([COMPONENTS]) separate outward with mechanical precision and hang in space, evenly
> spaced — then the motion completes with every part perfectly still. Constant soft
> studio lighting, cool rim light, gentle floor reflection. No dust, no particles,
> no motion blur, no text. 8 seconds, 24fps, seamless, premium engineering-film tone.

Then: `ffmpeg -i shot.mp4 -vf "fps=24,scale=1800:-2" frames/f_%04d.webp`

## 4 · Character / physique turntable (for Technique A character pages)

> Cinematic studio render of a heroic athletic human figure, écorché-style anatomy
> with defined muscle groups and subtle surface vascularity, standing in a relaxed
> A-pose on a dark reflective floor, deep near-black background with a cool rim light.
> The camera orbits a full slow 360 degrees at chest height. The figure is perfectly
> still, statuesque, museum-quality. Constant lighting, no particles, no text,
> 10 seconds, seamless loop.

---

# Worked example — an industrial sensor unit, ready-to-run pack

1. `[PRODUCT] = "a rugged industrial monitoring unit: a grey powder-coated steel enclosure
   on a short mast, an antenna on top, a sensor cable leaving the base, a small status light"`
2. **Exploded still**: §2 with the internals the owner lists (battery, board, antenna, sensor
   head), floating in order along one axis.
3. **Turntable video**: §3, slow orbit, black ground, 8 seconds.
4. **Frames**: `ffmpeg -i turntable.mp4 -vf "fps=24,scale=1800:-2" frames/f_%04d.webp`
