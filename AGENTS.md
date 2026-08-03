# Match 3 Agent Guide

## Project overview

- This is a Phaser 4 match-3 game built with TypeScript and Vite.
- `src/game.ts` contains the scene, board state, matching, swaps, cascades, and Phaser game configuration.
- `src/main.ts` is the browser entry point.
- Static game assets live under `public/`; reference them with root-relative URLs such as `/sprites/gems.png`.
- `vite.config.ts` deliberately emits Phaser as its own content-hashed `phaser` chunk so CDN and browser caches can retain the framework bundle across game-only releases.

## Phaser guidance

- Phaser-specific skills are already installed in `.agents/skills/`. Before changing Phaser code, read the `SKILL.md` for every subsystem involved. For example, use `.agents/skills/v3-to-v4-migration/SKILL.md` for migration work and the scene, input, tween, loader, or scaling skills for those APIs.
- The official Phaser documentation is https://docs.phaser.io. Use it as the primary external API reference.
- This project targets Phaser 4. Do not reintroduce Phaser 3 APIs, a global `Phaser` script tag, or a checked-in `phaser.min.js` bundle.
- Import Phaser from the installed package: `import Phaser from 'phaser';`.
- Prefer public Phaser APIs. Do not access renderer internals or make direct WebGL calls.
- Keep responsive sizing in Phaser's `ScaleManager` configuration. Do not override the canvas dimensions or centering with CSS.

## Development rules

- Use TypeScript for game source. New or renamed game modules should use `.ts`, not `.js`.
- Keep strict type checking green. Model board cells, game objects, pointers, and scene state with explicit types instead of `any`.
- Use `pnpm` for all dependency and script operations. Do not generate npm or Yarn lockfiles.
- Preserve the Phaser-only manual chunk in `vite.config.ts`. Its content hash is part of the CDN caching strategy.
- Keep the board interaction locked while swaps, destruction, falling, or cascades are active.
- Initial boards must not contain matches. Invalid adjacent swaps must animate back, and cascades must finish before input is re-enabled.
- Reuse pooled gem images during replenishment; avoid creating new game objects on every cascade.

## Commands

```sh
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

## Verification

- Run `pnpm typecheck` after TypeScript changes.
- Run `pnpm build` before handing off changes. Confirm the output includes a separate `dist/assets/phaser-<hash>.js` file.
- For gameplay or layout changes, test pointer selection, adjacent swaps, invalid-swap rollback, cascades, and at least one narrow mobile viewport.
- Treat `dist/` as generated output; never edit or commit it.
