# Phase 0 — Repo and shell

Status: Done. Expo Router app is scaffolded on `main` with Home, Browse, Orders, and Account tabs. Theme styling is Phase 1.

Read [../plan.md](../plan.md) first.

## Done

- This folder is its own git repo. `origin` is `MMcFarlane/f2-airport-delivery-app-mvp`.
- Branch is `main`, tracking `origin/main`.
- The empty nested git repo inside `artboards/` has been removed.
- Expo TypeScript app with Expo Router is in this folder. `docs/` and `artboards/` are kept.
- Four tabs: Home, Browse, Orders, Account.
- `.gitignore` ignores `.env`. Key names are listed in `.env.example`. Do not commit real keys or `.DS_Store`.

## Done when

`npx expo start` runs, the four tabs render, and `git rev-parse --show-toplevel` is this folder with `origin` still set to the MVP repo.

## Out of scope

Database, and screens beyond the tab shell. Shared visual components are Phase 1.
