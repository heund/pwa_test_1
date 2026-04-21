# Key Map Reference Breakdown

Primary source: [map_references/key reference.jpg](./map_references/key%20reference.jpg)

This file captures the essential visual system we should match first before building the interactive map prototype.

## What this reference is

The key reference is a vertically scrolling mobile game map. It is not a geographic map. It behaves like a level path inside an illustrated world.

Core structure:

- fixed top UI bar
- long vertical environment scene
- one winding coral route
- repeated circular level nodes
- decorative environmental storytelling around the path
- very light ambient particles

## Visual rules to match

- Flat vector illustration, not painterly.
- Soft muted palette with low contrast overall.
- A few strong dark accents for trees, cliffs, and silhouettes.
- The route line is warm coral and stays visually readable at all times.
- Level nodes are pale cream circles with thin cool-grey outlines.
- Background shapes are simplified and geometric, with layered depth created by overlap rather than texture.
- UI corners are heavily rounded and light grey.
- The scene feels calm, airy, and slightly whimsical rather than dense or dramatic.

## Composition rules

- Portrait phone framing first.
- The path should snake vertically through the composition.
- Each screen-height segment needs a clear landmark cluster.
- Empty space is important. The art should breathe.
- Decorative objects should support the route, not block it.
- Foreground dark silhouettes can create depth breaks between sections.

## Scene layer model

We should build the map in separate layers so animation stays possible.

1. Base background color and sky/ground planes
2. Large terrain silhouettes
3. Midground landmarks and environmental props
4. Route line
5. Node markers
6. Foreground accents
7. Ambient particles and subtle animated details
8. Fixed UI overlay

## Node system

- Circular cream fill
- Thin grey border
- Light grey stage number
- Consistent size with occasional partial off-screen nodes
- Current node can be highlighted with glow, scale, or pulse
- Locked/completed variants should preserve the same silhouette

## Palette direction from the key reference

Approximate dominant colors:

- `#f0f0d0` pale cream background
- `#d0d0b0` warm stone midtone
- `#c0c0a0` muted terrain shade
- `#305060` dark blue-green silhouette accent
- `#203060` deepest forest/cliff accent
- `#e0e0e0` light UI chrome

Use these as a starting direction, not a final brand palette.

## Asset types we need to draw first

- repeating tall pine trees
- small cone trees
- angular mountain shapes
- dark sawtooth forest silhouette band
- rocky shoreline / cliff edge
- footprint decals
- horizontal mint accent dashes
- winding coral route
- cream numbered nodes
- rounded top UI shell

## Animation opportunities

Keep animation subtle and sparse:

- small drifting particles
- very soft glow/pulse on current node
- slight parallax between terrain bands
- occasional shimmer on path progress
- gentle movement on selected environmental assets only

Avoid heavy motion that makes the screen feel busy.

## Build recommendation

First prototype target:

- reproduce one screen-to-two-screen section of the key reference
- use layered SVG or canvas assets
- implement vertical scroll
- pin the top UI
- make 5 to 8 nodes interactive
- add one ambient particle layer
- add one active-node animation

Once that is working, we can expand the world and introduce additional landmark styles from the other references.
