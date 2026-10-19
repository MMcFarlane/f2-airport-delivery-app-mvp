# Phase 1 — Theme

Status: Done. Tokens live in `src/theme/`. Shared screen, buttons, chips, restaurant card, menu card, and the tab bar are on the Home sample.

Depends on [00-repo-and-shell.md](00-repo-and-shell.md).

## Goal

Shared visual primitives taken from the artboard PNGs, so later screens do not invent their own buttons and cards.

## Look

- Off-white background
- Black primary buttons with yellow label text
- Yellow accent for selected chips, discounted prices, and the active tab indicator
- Large bold headlines
- Heavily rounded cards, fields, and buttons
- Bottom tab bar: Home, Browse, Orders, and a fourth tab, with a yellow indicator on the active tab. This phase used Cart, matching the home artboard. Phase 8a uses Account, matching the other artboards.

Sample the PNGs in `artboards/` for the exact colors before hard-coding a palette. Put tokens in something like `src/theme/`.

## Components

Build only the shared pieces this phase needs:

- Screen background and title
- Primary and secondary buttons
- Filter chips
- Restaurant and menu cards
- Tab bar styling

## Done when

Buttons, chips, cards, and the tab bar match the mocks when placed on a sample screen.

## Out of scope

Real data, navigation past the tabs, and screen-specific layout.
