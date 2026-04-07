# RetroFlow Design

This document describes the current implemented RetroFlow behavior. It should not include unimplemented roadmap items.

## Overview

RetroFlow is a mode-based audio wallpaper built from four independently cycling domains:

- Bars geometry
- Flow field
- Warp pass
- Base color

The web preview and Wallpaper Engine build use the same wallpaper definition and property schema.

## Cycle System

Cycle settings are under the `Cycle` property group.

Implemented settings:

- `Cycle Interval (sec)` controls how often a switch attempt happens.
- `Interpolate Duration (sec)` controls transition duration.
- `Cycle Random Color` enables color cycling as a cycle domain.
- `Cycle Bar ...` toggles which bar geometry types can be selected.
- `Cycle Flow ...` toggles which flow types can be selected.
- `Cycle Warp ...` toggles which warp types can be selected.
- `Cycle ... Custom` toggles each domain's user-defined mix type.

At each switch time, RetroFlow randomly chooses one eligible domain to change:

- Geometry, if at least two geometry types are enabled.
- Flow, if at least two flow types are enabled.
- Warp, if at least two warp types are enabled.
- Color, if `Cycle Random Color` is enabled.

Fallback behavior:

- If no geometry type is enabled, RetroFlow uses `Circle` and shows a toast.
- If no flow type is enabled, RetroFlow uses `Swirl` and shows a toast.
- If no warp type is enabled, RetroFlow uses `Radial` and shows a toast.

Fallback toasts are DOM overlays and therefore work in both web preview and WPE.

Default types:

- Geometry: `Circle`
- Flow: `Swirl`
- Warp: `Radial`

## Interpolation

Geometry interpolation:

- Geometry modes produce local quad point sets.
- Transitioning geometry linearly interpolates quad vertices.
- If one side has no secondary quad, the missing quad is represented as a degenerate quad before interpolation.
- `Custom` geometry builds two concrete geometry modes and mixes their quad vertices by `Mix`.

Flow interpolation:

- All flow types live in one GLSL shader.
- The cycle state passes `flowFromType`, `flowToType`, and `flowTypeMix`.
- The shader computes both fields and mixes them.
- `Custom` flow mixes two concrete flow types in the same shader by `Mix`.

Warp interpolation:

- All warp types live in one GLSL shader.
- The cycle state passes `warpFromType`, `warpToType`, and `warpTypeMix`.
- The shader computes both sample UVs and mixes them.
- `Custom` warp mixes two concrete warp types in the same shader by `Mix`.

Color interpolation:

- `Bar Color` is the initial/base color.
- When random color cycling is enabled, cycle color transitions generate random HSL targets.
- Random color limits are defined in `RetroFlowWallpaper.js`.
- If hue difference is <= 90 degrees, normal HSL interpolation is used.
- If hue difference is > 90 degrees, interpolation desaturates first, switches hue at low saturation, then restores saturation.

## Energy

Energy is currently simplified to the average of all audio bins.

- Stereo band selection is not used for energy.
- `Size By Energy` scales the whole `barsGroup` using this full-spectrum energy value.
- Geometry formulas do not individually apply energy scale; the group transform handles it.

## Bars Group Transform

The rendered bars live inside one `barsGroup`.

Group-level controls:

- `Theta Shift`
- `Rotation Speed (Hz)`
- `Reverse Rotation`
- `Size By Energy`
- `2D Offset X`
- `2D Offset Y`

`2D Offset` also updates the flow and warp pass centers.

## Bars Geometry Types

Implemented geometry modes:

- `Just Bars`
- `Circle`
- `Double Circle`
- `Slab`
- `Circle-Slab`
- `Double Circle-Slab`
- `Custom`

Common behavior:

- Geometry uses local coordinates; rotation is handled by `barsGroup.rotation.z`.
- Geometry-specific settings live in their own property groups.

`Just Bars`:

- Supports five shapes: `shapeA`, `shapeB`, `shapeC`, `shapeD`, `shapeE`.
- Uses its own distance, width, initial length, and length-by-sound controls.

`Circle`:

- Supports `single-sided` and `two-sided` shapes.
- Uses radius, width, initial length, and length-by-sound controls.

`Double Circle`:

- Draws left and right stereo halves as separate circles.
- Left channel uses bins `0..63`.
- Right channel uses bins `64..127`.
- The two circles are symmetrical: one side winds clockwise, the other counter-clockwise.
- Includes `Minor Theta Shift` for each small circle orientation.
- Includes `Center Distance (x Radius)` to control distance between circle centers.

`Slab`:

- Similar to Just Bars, but uses fixed slab thickness.
- Height controls offset from center; thickness remains visible even when height is zero.

`Circle-Slab`:

- Similar to Circle, but renders ring slabs with fixed thickness.
- Two-sided mode draws inward and outward slabs.

`Double Circle-Slab`:

- Stereo-pair version of Circle-Slab.
- Includes minor theta shift and center distance ratio.

`Custom`:

- Selects two concrete bar geometry types.
- `Mix` controls interpolation between those two types.
- The selectable source/target types exclude `Custom` to avoid recursive definitions.

## Flow Types

Implemented flow types:

- `Swirl`
- `Grid`
- `Saddle`
- `Polygon`
- `Dual Core`
- `Custom`

General flow settings:

- `Allow Blur Filter`
- `Trail Fade`
- `Flow Velocity`
- `Flow Opacity Limit`

`Swirl` settings:

- `Swirl Blend`
- `Swirl Density`
- `Swirl Theta (deg)`
- `Swirl Strength`

`Grid` settings:

- `Grid X Frequency`
- `Grid Y Frequency`
- `Grid Sharpness`
- `Grid Strength`

`Saddle` settings:

- `Saddle Frequency`
- `Saddle Strength`

`Polygon` settings:

- `Polygon Sides`
- `Polygon Theta Shift`
- `Strip Theta Shift`
- `Reverse Polygon Flow`
- `Polygon Twist Strength`
- `Polygon Twist Frequency`
- `Flow Inward Strength`

`Dual Core` settings:

- `Dual Core Direction`
- `Dual Core Strength`
- `Dual Core Distance`

`Custom` settings:

- `From Type`
- `To Type`
- `Mix`
- The selectable source/target types exclude `Custom` to avoid recursive definitions.

## Warp Types

The post-warp pass is always enabled. Use `Cycle Warp None` when no warp should be part of the cycle.

Implemented warp types:

- `None`
- `Radial`
- `Twist`
- `Grid`
- `Wave`
- `Flower`
- `Triangular`
- `Custom`

`Radial` settings:

- `Radial Frequency`
- `Theta Frequency`

`Twist` settings:

- `Twist Amount`
- `Twist Decay`
- `Twist Radial Frequency`
- `Twist Radial Amplitude`

`Grid` settings:

- `Grid X Frequency`
- `Grid Y Frequency`
- `Grid Sharpness`
- `Grid X Amplitude`
- `Grid Y Amplitude`

`Wave` settings:

- `Wave X Frequency`
- `Wave Y Frequency`
- `Wave X Amplitude`
- `Wave Y Amplitude`

`Flower` settings:

- `Flower Petals`
- `Flower Amplitude`
- `Flower Decay`

`Triangular` settings:

- `Triangle Width`
- `Triangle Height`

`Custom` settings:

- `From Type`
- `To Type`
- `Mix`
- The selectable source/target types exclude `Custom` to avoid recursive definitions.

## Colors

Implemented color settings:

- `Background Color`
- `Bar Color`
- `Hue By Sound`
- `Saturation By Sound`
- `Lightness By Sound`
- `Opacity Initial`
- `Opacity By Sound`

`Bar Color` is converted to HSL internally, then the by-sound modifiers are applied per bar.

## Clock

Clock overlay settings:

- `Show Clock`
- `Clock Size A`
- `Clock Size B`
- `Clock Position X`
- `Clock Position Y`
- `24 Hour Clock`
- `Clock Color`
- `Clock Shadow Color`
- `Clock Backdrop Color`
- `Clock Backdrop Opacity`

The clock backdrop is a DOM ellipse using a softened radial gradient.

## Canvas And Background

Canvas settings:

- `Canvas Offset X`
- `Canvas Offset Y`
- `Pixelated`
- `Canvas Shrink`

Background settings:

- `Use Custom Image`
- `Custom Image`
- `Background Color`
