# Map Asset Spec

This file defines the production asset setup for the Jeju Biennale map PWA prototype.

The goal is to create a long vertically scrolling illustrated game map that is mobile-first, performs well in a PWA, and still scales cleanly to tablet and desktop preview contexts.

## Core Canvas Setup

Use this as the standard design baseline:

- Master width: `1440 px`
- Section height: `2800 px`
- Color mode: `RGB`
- Master build style: tall vertical map split into stacked sections

Recommended working master:

- `1440 x 8400 px`

Recommended exported background sections:

- `1440 x 2800 px`
- `1440 x 2800 px`
- `1440 x 2800 px`

Do not ship one giant background file like `1440 x 8400` if it can be avoided.

## Why This Size

`1440 px` wide is the safest practical background width for this project because it:

- stays sharp on modern phones
- looks good on high-density mobile displays
- scales cleanly for iPad portrait use
- remains manageable for browser and PWA performance
- gives enough painting/detail space without becoming excessive

## Safe Composition Rules

Design this like a mobile game map, not a desktop illustration.

Safe layout guidance inside each `1440 x 2800` section:

- Left safe margin: `90 px`
- Right safe margin: `90 px`
- Top clear zone for fixed UI: `220 px`
- Bottom soft caution zone: `160 px`

This means:

- avoid placing important node centers inside the top `220 px`
- avoid placing important node centers inside the bottom `160 px`
- decorative elements can overlap those zones if needed

## What Belongs in the Static Background

Only bake in elements that will never need separate animation, interaction, or parallax control.

Safe to include in static background:

- flat sky or base field color
- large terrain masses
- distant mountain silhouettes
- large cliff shapes
- broad land/water divisions
- large non-interactive geometry

Do not bake these into the static background:

- route line
- stage nodes
- trees that may sway or parallax
- special landmarks
- interactive props
- glow
- particles
- water motion details
- foreground silhouettes that may animate

## Recommended Layer Structure

Use this structure in Figma, Photoshop, or Illustrator.

1. `BG_BASE`
- flat color fields
- distant gradient or tone planes

2. `BG_TERRAIN`
- mountains
- land masses
- cliffs
- shoreline blocks
- large water shapes

3. `BG_DETAILS_STATIC`
- static terrain markings that never move
- static footprints if they will not animate

4. `PATH`
- route line only

5. `NODES`
- numbered circles only
- locked/unlocked/current variants

6. `MID_DECOR`
- trees
- rocks
- buildings
- bridge elements
- small landmarks

7. `FG_DECOR`
- foreground silhouettes
- dark framing shapes
- near-camera scenery

8. `FX`
- fog
- particles
- glow
- sparkle layers

9. `UI_REF`
- top bar placement guide only
- not exported into map assets

## Export Strategy

### Background sections

Export the static background as multiple vertical slices:

- `bg-section-01.webp`
- `bg-section-02.webp`
- `bg-section-03.webp`

Preferred export format:

- production: `webp`
- backup or editing handoff: `png`

### Route

Keep route separate:

- `route-main.svg`
- optional `route-highlight.svg`

### Nodes

Keep stage circles separate:

- `node-default.svg`
- `node-current.svg`
- `node-locked.svg`
- `node-complete.svg`

### Landmarks and scenery

Export reusable decorative assets separately when possible:

- `tree-tall-01.svg`
- `tree-tall-02.svg`
- `tree-small-01.svg`
- `rock-01.svg`
- `footprints-01.svg`
- `shore-foam-01.svg`

If a full section depends on a custom landmark composition, keep that landmark grouped and export it separately instead of baking it into the base background.

## Folder Structure

Use this project structure:

```text
assets/
  map/
    background/
      bg-section-01.webp
      bg-section-02.webp
      bg-section-03.webp
    route/
      route-main.svg
      route-highlight.svg
    nodes/
      node-default.svg
      node-current.svg
      node-locked.svg
      node-complete.svg
    decor/
      trees/
        tree-tall-01.svg
        tree-tall-02.svg
        tree-small-01.svg
      rocks/
        rock-01.svg
      decals/
        footprints-01.svg
      water/
        shore-foam-01.svg
    fx/
      particle-soft-01.svg
      glow-soft-01.webp
design/
  map-master/
    jeju-map-master.fig
    jeju-map-master.psd
```

## Master File Layout

If you build the full map in one working file, use:

- file size: `1440 x 8400 px`
- split visually into:
  - section 1: `0 to 2800`
  - section 2: `2800 to 5600`
  - section 3: `5600 to 8400`

Keep clear guides for:

- top UI safe zone
- route centerline rhythm
- node spacing
- section transition boundaries

## Node Placement Guidance

For a reference-style vertical path:

- average node size in design file: `112 to 132 px` diameter
- keep route center generally inside the middle `55%` of the canvas width
- allow nodes to drift left and right, but avoid pushing the route too close to edges
- keep enough surrounding breathing room so landmarks do not collide with node circles

## Performance Guidance

To keep the PWA stable on mobile:

- prefer multiple smaller background slices over one giant file
- keep each background slice ideally under `500 KB` to `900 KB` if possible
- use `svg` for route and node assets where practical
- use `webp` for textured or soft raster layers
- do not animate huge full-screen raster layers if avoidable
- animate separate small assets instead

## Best Practical Starting Point

If starting map production now:

1. Create one master file at `1440 x 8400 px`
2. Build the static background in 3 stacked `2800 px` sections
3. Keep path, nodes, trees, and landmarks on separate layers
4. Export background slices separately
5. Export route and node assets independently
6. Add animation only to separate assets, never to the flattened base background

## Final Recommendation

Use:

- background master width: `1440 px`
- working master height: `8400 px`
- export sections: `1440 x 2800 px`

This is the safest balance between visual quality, mobile sharpness, and PWA performance.
