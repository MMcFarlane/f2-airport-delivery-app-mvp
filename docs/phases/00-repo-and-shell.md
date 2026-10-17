# Phase 0 — Repo and shell

Status: Repo cloned onto `main` at https://github.com/MMcFarlane/f2-airport-delivery-app-mvp. Expo app is not scaffolded.

Read [../plan.md](../plan.md) first.

## Already done

- This folder is its own git repo. `origin` is `MMcFarlane/f2-airport-delivery-app-mvp`.
- Branch is `main`, tracking `origin/main`.
- The empty nested git repo inside `artboards/` has been removed.
- Artboards are local and may still be untracked. Do not delete them.

## Remaining work

Scaffold an Expo TypeScript app in this folder with Expo Router. The folder is not empty (`README.md`, `docs/`, `artboards/`), so generate into a temporary directory and move the app files in. Keep `artboards/` and `docs/`.

Add four tabs:

- Home
- Browse
- Orders
- Account

Each tab can be a placeholder screen. Match the tab labels from the artboards. Styling comes in Phase 1.

Add a gitignored `.env` example note in `.gitignore` for `GOOGLE_PLACES_API_KEY` and `SKYLINK_API_KEY`. Do not commit real keys or `.DS_Store`.

## Done when

`npx expo start` runs, the four tabs render, and `git rev-parse --show-toplevel` is this folder with `origin` still set to the MVP repo.

## Out of scope

Theme components, database, screens beyond the tab placeholders.
