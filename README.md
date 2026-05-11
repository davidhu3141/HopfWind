# HopfWind

HopfWind is a small framework for developing Wallpaper Engine web wallpapers.

This repo contains:

- a web shell for local preview and tweaking
- a Wallpaper Engine shell for actual WPE projects
- shared wallpaper logic used by both shells
- a few wallpapers that I have either released or used as experiments

The most popular wallpaper here is probably `spec-entity`, which is the wallpaper I published as Spectrum City. Its main visual idea is a ping-pong shader feedback pipeline.

## Wallpapers

Current wallpapers in this repo:

- `spec-entity` - Spectrum City in this codebase
- `retro-flow`
- `hopf-wind`
- `wind-torus`

Published Wallpaper Engine workshop pages:

- `spec-entity` / Spectrum City: <https://steamcommunity.com/sharedfiles/filedetails/?id=3551997868>
- `retro-flow`: <https://steamcommunity.com/sharedfiles/filedetails/?id=3703420894>
- `hopf-wind`: <https://steamcommunity.com/sharedfiles/filedetails/?id=2798645065>

## Project Structure

- `src/wallpapers/` - wallpaper definitions, properties, and render logic
- `src/web/` - React-based preview shell
- `src/shared/` - runtime adapters, shared DOM features, shared Three.js helpers
- `wallpaper-configs/` - local per-wallpaper build config
- `old_documents/` - old notes and sample WPE project files kept as reference

The project has two shells:

1. Web preview
2. Wallpaper Engine runtime

They share the same wallpaper logic. The shell is different, the wallpaper implementation is not.

## Web Preview

Install dependencies:

```bash
npm install
```

Start the preview app:

```bash
npm run dev
```

The web preview ships with a default bundled music track so the audio-reactive wallpapers have something to play immediately. Browser autoplay restrictions may still require a manual click on `Play`.

## Build For Wallpaper Engine

This section is for exporting a wallpaper into an existing WPE project folder. The following instructions use the `retro-flow` wallpaper as an example.

### 1. Configure the output path

Create:

```text
wallpaper-configs/<wallpaper-id>/config.json
```

My personal example for `retro-flow`:

```json
{
  "buildDestination": "C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/retro_flow"
}
```

`buildDestination` should point to a Wallpaper Engine project directory that already exists. It should contain at least a `project.json`.

### 2. Build the wallpaper files

```bash
npm run build:wallpaper -- retro-flow
```

This command reads `wallpaper-configs/retro-flow/config.json` and writes the built wallpaper files into `buildDestination`.

### 3. Sync `project.json`

After building, sync the current property schema into the WPE project:

```bash
npm run sync:project -- retro-flow
```

This updates the target `project.json`, mainly:

- `project.general.properties`
- `project.general.supportsaudioprocessing`

### 4. Normal update flow

Therefore, when you change wallpaper code, the normal WPE update flow is:

```bash
npm run build:wallpaper -- retro-flow
npm run sync:project -- retro-flow
```

provided that `wallpaper-configs/<wallpaper-id>/config.json` is set.

`build:wallpaper` and `sync:project` do different jobs. In practice you usually need both.

## Notes

- Spectrum City is named `spec-entity` in this repo.
- The web shell is for development convenience. The WPE shell is the actual target runtime.
- If you use an AI agent to add or edit WPE properties, have it inspect a real `project.json` format first. The files in `old_documents/` are useful reference material for that.

## Third-Party Assets

The default web preview audio track is:

- *A Memory Away* by Tanner Helland [(github)](https://github.com/tannerhelland/free-music/tree/master)

Thanks to Tanner Helland for publishing the track and allowing reuse under `CC BY 4.0`.

See [THIRD_PARTY_ASSETS.md](./THIRD_PARTY_ASSETS.md) for attribution and license details.

## Published wallpapers in Steam WPE workshop

- `retro-flow`: <https://steamcommunity.com/sharedfiles/filedetails/?id=3703420894>
- `spec-entity` / Spectrum City: <https://steamcommunity.com/sharedfiles/filedetails/?id=3551997868>
- `hopf-wind`: <https://steamcommunity.com/sharedfiles/filedetails/?id=2798645065>