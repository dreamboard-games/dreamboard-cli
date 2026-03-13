# UI Style Guide

This style guide details the design philosophy, visual tokens, and core components for the Dreamboard.games UI SDK. The framework uses a **Hand-Drawn** aesthetic that emphasizes human creativity over corporate polish.

## Design Philosophy

The Hand-Drawn design style celebrates authentic imperfection and human touch in a digital world. It rejects clinical precision in favor of organic, playful irregularity that evokes sketches on paper, sticky notes on a wall, and napkin diagrams from a brainstorming session.

### Core Principles

- **No Straight Lines**: Every border, shape, and container uses irregular border-radius values to create wobbly, hand-drawn edges that reject geometric perfection.
- **Authentic Texture**: The design layer paper grain, dot patterns, and subtle background textures to simulate physical media (notebook paper, post-its, sketch pads).
- **Playful Rotation**: Elements are deliberately tilted using small rotation transforms (`-rotate-1`, `rotate-2`) to break rigid grid alignment and create casual energy.
- **Hard Offset Shadows**: Reject soft blur shadows entirely. Use solid, offset box-shadows (like `4px 4px 0px`) to create a cut-paper, layered collage aesthetic.
- **Handwritten Typography**: Use exclusively handwritten or marker-style fonts (like Kalam for headings and Patrick Hand for body text) that feel human and approachable.
- **Limited Color Palette**: Stick to pencil blacks (`#2d2d2d`), paper whites (`#fdfbf7`), correction marker red (`#ff4d4d`), post-it yellow (`#fff9c4`), and ballpoint blue (`#2d5da1`).
- **Intentional Messiness**: Embrace overlap, asymmetry, and visual "mistakes" that make the design feel spontaneous.

## CSS Tokens & Utilities

The platform provides several global CSS utilities designed for this aesthetic:

- **Borders**: `.wobbly-border`, `.wobbly-border-md`, `.wobbly-border-lg` apply the irregular `border-radius` shapes. Used with `border-2`, `border-[3px]`, or `border-[4px]`.
- **Shadows**: `.hard-shadow`, `.hard-shadow-md`, `.hard-shadow-lg` apply the solid offset shadows. Use `.hard-shadow-sm` for active states (buttons pressing flat).

## Implementing in Components

When writing or modifying UI components in `ui/` or `ui-sdk/`:

### Containers & Cards

- Add `wobbly-border-md` or `wobbly-border-lg`.
- Use `border-[3px] border-border` to give it a thick pencil-like stroke.
- Apply `bg-[#fdfbf7]` (warm paper) or `bg-white`.
- Add a solid shadow with `hard-shadow` or `hard-shadow-lg`.
- Slightly rotate the element with `rotate-1` or `-rotate-1`.

### Buttons

- Use `wobbly-border`.
- Normal state: `border-[3px] border-border bg-[#fdfbf7] text-foreground hard-shadow`.
- Hover state: `hover:bg-primary hover:text-white hover:hard-shadow-sm hover:-translate-y-1`.
- Active state: `active:shadow-none active:translate-y-1 active:translate-x-1`.
- Secondary variants can use `bg-[#e5e0d8]` or `bg-[#fff9c4]`.

### Typography

- Add `font-sans` for standard handwritten text or `font-display` for bold marker headings.
- Make things bold! `font-bold` works well with handwritten fonts to make them legible.

### Decoration

- For emphasis, wrap text in a post-it styling: `bg-[#fff9c4] px-2 py-1 border-2 border-border wobbly-border rotate-2 inline-block`.
- Add "tape" to tops of containers: `<div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#e5e0d8] border border-border opacity-80 backdrop-blur-sm -rotate-2 z-10" />`.
