# CLAUDE_DESIGN.md

## Project

Jeju Biennale PWA for city-wide QR scanning and deity collection

## Core product vision

This PWA is a calm, magical, full-screen mobile experience built around walking through Jeju city, finding QR codes, scanning them instantly, and revealing living deity entities. The app should feel closer to a collectible discovery game than an educational guide. It must stay intuitive for a wide age range, including children and older adults, while still feeling refined, cinematic, and contemporary.

The app is not a text-heavy archive interface. It is a poetic, responsive, Apple-like mobile experience where scanning, reveal, collection, metamorphosis, and return visits are the central interaction loop.

## Primary design direction

* Interface language must be Korean.
* Visual and interaction language should follow contemporary Apple mobile UX expectations.
* Avoid generic web-app styling and avoid default Claude-like typography or layout habits.
* Use a system-first iOS style with polished spacing, restraint, hierarchy, soft depth, and native-feeling touch targets.
* The overall tone should feel calm, magical, accessible, cute, and natural.
* The app must never become overly artsy, obscure, or difficult to use.

## Apple-style UI direction

Use a modern Apple-like design language with:

* full-screen immersive layouts
* edge-to-edge content
* floating navigation and controls
* soft translucent surfaces
* layered depth
* restrained typography
* rounded geometry
* subtle separation between content and controls
* highly legible Korean UI
* native-feeling motion and response

Typography should feel like Apple UI on iPhone.

* Prioritise system font stacks that feel native on Apple devices.
* Korean text must render cleanly and elegantly.
* Avoid decorative fonts.
* Avoid dense blocks of text.
* Use short labels, clear hierarchy, generous spacing, and strong legibility.

Suggested web font stack direction:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
```

## Material and surface language

The interface should use a glass-like material system inspired by the latest Apple visual language.

Design requirements:

* Main controls should feel like translucent floating glass.
* Surfaces should softly refract, blur, and separate from content.
* Glass effects must remain calm and readable, not flashy.
* The glass layer should support content rather than dominate it.
* Use light diffusion, glow falloff, and subtle translucency.
* Prefer softness over sharp chrome.
* Keep contrast readable in both bright and dark scenes.

The visual result should feel like:

* soft glass
* misted glow
* luminous depth
* gentle refraction
* rounded floating controls
* cinematic but minimal surfaces

## Visual world of the deities

The deity entities are central to the product identity.
Their look and motion should follow the supplied references very closely.

Required deity qualities:

* soft glowing bodies
* diffused edges
* luminous internal gradients
* natural glow rather than neon sci-fi glow
* pastel and earthy spectral blending
* simple silhouettes
* cute but not childish
* magical but grounded
* emotionally warm and inviting
* slightly mysterious

Visual motifs from the references to preserve:

* hazy aura-like gradients
* bloom and glow within the figure
* soft grain or atmospheric diffusion
* simplified facial features
* blob-like metamorphic transitions
* floating luminous entities
* soft environmental fade-ins
* rounded and approachable shapes

Do not design the deities as:

* realistic 3D fantasy creatures
* game monsters
* anime characters
* flat mascots
* educational icons
* hard-edged UI stickers

## Biennale theme translation into motion and interaction

The Biennale theme must influence behaviour and animation logic rather than becoming literal poster graphics.

Theme source:

* 허끄곡 모닥치곡 이야홍: 변용의 기술
* 허끄곡 모닥치곡 carries the sense of mixing, gathering, clustering, and coming together.
* The poster language expresses deconstructed and recomposed typography, mixed elements, emotional rhythm, and an unfixed expanding Jeju locality.

Translate this into interface behaviour as follows:

* particles gather into form
* forms dissolve and recombine
* deity bodies cohere from drifting luminous fragments
* content panels softly emerge, separate, and rejoin
* icons can disperse slightly and settle back into place
* transitions should suggest metamorphosis rather than hard screen changes
* discovery events should feel like condensation, gathering, and reveal
* repeated scans can trigger different recombinations of the same deity presence

This logic of gathering and metamorphosis is the key conceptual motion system.
It should appear in:

* deity reveal animations
* collection unlock states
* badge and reward sequences
* transitions between scan result variations
* ambient loading and idle states

## Colour direction

Primary overall mood:

* calm
* natural
* earthy
* magical
* soft

Colour family direction:

* warm browns
* olive and muted green tones
* foggy neutrals
* soft stone-like off-whites
* restrained aura colours inside deity bodies

Important:

* Do not over-brand the entire app with a single dominant colour.
* The base interface should stay neutral and calm.
* Colour intensity should appear most strongly inside deity reveals, reward moments, and motion states.
* The interface background and navigation should support the deity visuals rather than compete with them.

## Core app structure

The app is built around a full-screen camera-first experience.

### Default home screen

The main screen is the camera view.
The user opens the app and immediately sees the camera ready for QR scanning.
There should be minimal friction.

Core requirements:

* camera is full screen
* scanning is immediate
* controls float above content
* the user should understand the app within seconds
* there should be no heavy onboarding wall
* first-use guidance must be short and visual

### Main interaction loop

1. User walks around the city
2. User finds a QR code
3. User opens the app or stays in scan mode
4. User scans immediately
5. A deity reveal animation appears
6. The scan produces an entity moment, story fragment, or deity-specific information
7. The result is added to collection logic if relevant
8. Repeated scans can reveal different outputs from the same deity
9. The user continues exploring the city to discover more

This must feel playful, rewarding, and alive.

## Information architecture

Keep the information architecture minimal.
The app should never feel like a database browser.

Primary sections in bottom floating navigation:

* 스캔
* 지도
* 도감

Optional fourth item if needed:

* 보상

Recommended behaviour:

* Keep bottom nav floating and translucent.
* Use rounded pill-like glass styling.
* Make icons and labels extremely clear.
* Keep the number of primary tabs low.

### 1. 스캔

The central mode and default landing state.

* full-screen camera
* instant QR recognition
* minimal overlay
* subtle instruction if needed
* ambient animated frame or reticle when camera is active

### 2. 지도

A map of the city showing QR code locations.
Requirements:

* no live GPS tracking
* no personal location marker
* no personal route history
* show the city and QR-related points only
* use clean Apple-like map framing and calm overlays
* maintain readability

The map should help planning and exploration, not surveillance.

### 3. 컬랙션

The collection section.
Shows:

* how many deity entities have been collected
* which ones are rare
* collection progress
* locked vs unlocked entries
* repeated encounters and variant reveals

This section should feel rewarding and collectible, not academic.

### 4. 뱃지 (optional dedicated tab or nested inside 도감)

Rewards include:

* badge unlock animations
* full collection completion state
* rare deity discovery state
* special metamorphic animations for milestone moments

## Landing screen

The app also needs a dedicated landing screen before the main camera experience.

Requirements:

* no title
* no headline
* no explanatory copy
* no branded splash language
* purely visual and atmospheric

Purpose:

* establish the emotional world of the app immediately
* introduce the themes of gathering, mixing, metamorphosis, and luminous deity presence
* create anticipation before the user enters the scan experience

Animation direction:

* soft particles drift separately in space
* fragments gather and disperse
* hazy forms cluster and separate again
* glowing shapes slowly cohere into deity-like presences, then dissolve
* motion should embody 뒤섞이고 모인다 through recombination, clustering, condensation, and release
* transitions should feel calm, magical, and natural rather than dramatic
* use the deity colour logic subtly inside a mostly restrained visual field
* keep it cinematic, soft, and elegant

The landing screen should feel like a living atmospheric prelude to the app.
It should communicate the world through motion alone.
After the animation completes or on tap, the app transitions smoothly into the main full-screen camera state.

## Scan result design

When a QR code is scanned, the reveal should feel immediate and magical.

Sequence direction:

* camera moment stabilises
* QR is recognised
* ambient particles gather
* a soft deity silhouette forms
* glow intensifies gently
* deity settles into a breathing idle state
* short Korean title and concise narrative fragment appear
* user can swipe or tap to see alternate fragments if available

The reveal must feel premium and emotionally warm.
Avoid pop-up card clunkiness.
Avoid looking like a museum information screen.

## Content presentation

Content should be short, elegant, and layered.

Principles:

* reveal first, explain second
* keep initial text minimal
* make reading optional and gentle
* support repeated discovery
* allow different narrative fragments to emerge over multiple scans

Content hierarchy example:

1. deity name
2. one short atmospheric line
3. optional deeper card or swipe-up panel
4. collection state or rarity marker

Do not overload the first reveal with long paragraphs.

## Motion design principles

Motion is critical.
This app requires proper motion graphics, not only simple UI transitions.

Motion principles:

* soft gathering
* dissolving and recomposition
* floating rest states
* gentle pulse and breath
* glow shift tied to interaction
* calm elastic transitions
* no harsh snaps unless used intentionally for QR recognition feedback
* transitions must feel alive and fluid

Reference motion behaviours:

* aura condensation
* dust-like luminous particles joining together
* blob morphing
* liquid fade
* environmental glow drift
* badge emergence from clustered fragments

Motion should feel:

* magical
* natural
* calm
* tactile
* contemporary
* accessible

Avoid:

* over-energetic game effects
* aggressive particle explosions
* fantasy RPG effects
* flashy gamification noise
* overly complex cinematic delays that slow the scan loop

## Rewards and achievement system

The reward system should support discovery and return visits.

Include:

* completion badges
* rare deity badges
* hidden or special entity unlock states
* subtle celebratory animation when a major milestone is reached

Examples:

* first deity found
* first rare deity found
* 50 percent collection completed
* all city entities collected
* all variants from one deity collected

Reward animation style:

* clustered particles gather into a badge
* glow ring expands softly
* badge settles into glass card or collection vault
* haptics and motion should feel precious, not loud

## Accessibility and age range

This app must work for users roughly age 10 to 60 and beyond.

Requirements:

* strong readability in Korean
* large enough touch targets
* clear navigation labels
* intuitive iconography
* low cognitive friction
* minimal required reading
* visual guidance through motion and hierarchy
* do not rely on hidden gestures for core actions
* maintain contrast and clarity even with translucent surfaces

## Privacy and data stance

This app does not collect personal data.

Hard requirements:

* no user profile avatar
* no account identity display
* no personal location display
* no GPS-based tracking interface
* no visible personal data collection mechanics
* no social feed logic

If analytics exist, they must be system-level and anonymous only.
The visible interface should communicate trust, simplicity, and non-intrusion.

## Tone of interface copy

UI copy should be Korean, concise, warm, and clear.
Avoid bureaucratic, academic, or educational museum language.
Avoid dense explanatory text.
Avoid childish gamification language.

The tone should feel:

* inviting
* mysterious
* calm
* elegant
* easy to understand

## Interaction style summary

The app should feel like:

* a calm magical city exploration game
* a collectible living archive
* a premium Apple-like mobile experience
* a soft deity encounter interface
* a discovery tool that rewards return and repetition

It should not feel like:

* a museum education app
* a textbook interface
* a generic QR scanner
* a fantasy RPG game
* a cluttered map service
* a data dashboard

## Screen-specific design notes

### Landing screen

* full-screen visual animation only
* no titles or text
* no clutter
* immersive atmospheric motion
* subtle tap-to-enter or automatic transition after a short sequence
* should feel like the app breathing into existence

### Camera screen

* full-screen live camera
* subtle scan guidance
* floating bottom nav
* one optional top status pill for hints
* minimal clutter

### Reveal screen

* deity occupies visual centre
* motion-led entrance
* short text only at first
* optional expandable lower glass panel
* background may softly dim or blur

### Map screen

* clean and calm
* no GPS or personal marker
* QR points shown clearly
* subtle status filtering if needed
* keep controls minimal

### Collection screen

* collectible grid or card system
* locked entities remain visually elegant
* rarity and completion states feel rewarding
* deity thumbnails should preserve glowing visual language

### Reward state

* cinematic but brief
* badge and deity logic use metamorphosis animation
* supports delight without slowing general use
