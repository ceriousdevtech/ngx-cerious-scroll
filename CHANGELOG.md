# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.7] - 2026-06-11

### Changed
- Updated the core engine dependency to `@ceriousdevtech/cerious-scroll@^1.0.7`, which fixes a scrollbar regression where dragging the thumb to the top could stop a few rows short of row 0 (a stale echo-suppression marker in the native scrollbar). No changes to the Angular wrapper's API.

## [1.0.6] - 2026-06-08

### Added
- **Table mode support** (`[ceriousScrollOptions]="{ layout: 'table' }"`). The row template's `<td>` cells render straight into the engine's `<tr>` (the directive already appends template root nodes directly and re-appends them after the engine recycles a container, so no wrapper is needed).
- **`[ceriousScrollHeaderTemplate]`** input. Declarative header template (a `<tr>` of `<th>`s) rendered into the engine's `<thead>` as an embedded view — same `<table>` as the rows, so columns align natively, and it updates via change detection.

### Dependencies
- Bumped `@ceriousdevtech/cerious-scroll` to `^1.0.6`: native table layout, `table.autoSizeColumns` (auto-sized but stable columns), trackpad-only wheel inertia, overlay-scrollbar gutter fix, and exact bottom snap.

## [1.0.5] - 2026-06-04

### Dependencies
- Bumped `@ceriousdevtech/cerious-scroll` to `^1.0.5`. Consumers get the new wheel input classifier (trackpad / free-scroll mice apply input immediately, ratcheted wheel notches still ease smoothly), the new `wheel.wheelBehavior` option (`'auto' | 'immediate' | 'smooth'`), and a fix for horizontal wheel forwarding in layouts where `overflow-x: auto` lives on an ancestor of `[data-cerious-scroll-content]`.

## [1.0.4] - 2026-06-03

### Dependencies
- Bumped peer dependency `@ceriousdevtech/cerious-scroll` to `^1.0.4`. Consumers get smooth wheel scrolling (eased over ~150ms, configurable via `wheel: { smooth }`) and the engine now reads viewport height from `[data-cerious-scroll-content]` so directives that put a horizontal scrollbar on the inner element get the last row clearance for free.

### Changed
- The `ceriousScroll` directive now styles the injected inner content element `overflow-y: clip; overflow-x: auto` so consumers can opt into a horizontal scrollbar on the rows axis without a stray vertical bar appearing.

## [1.0.3] - 2026-06-03

### Dependencies
- Bumped peer dependency `@ceriousdevtech/cerious-scroll` to `^1.0.3`. Consumers now get horizontal flick momentum (when `touch.getHorizontalScrollTarget` is supplied) and the new custom scrollbar thumb. The `ceriousScroll` directive already lets host children pass through, so wrapping rows in a custom `overflow-x: auto` container with a sticky header works out of the box — supply a `<div data-cerious-scroll-content></div>` inside it and the engine will render rows into your element.

## [1.0.2] - 2026-06-01

### Changed
- Verified compatibility with `@ceriousdevtech/cerious-scroll` 1.0.2

### Dependencies
- Peer dependency `@ceriousdevtech/cerious-scroll` tested against `^1.0.2` (range `^1.0.1` already satisfies this)

---

## [1.0.1] - 2026-02-02

### Changed
- Updated peer dependencies to support Angular 16 or greater (changed from ^17.3.0 to >=16.0.0)
- Updated @ceriousdevtech/cerious-scroll peer dependency to ^1.0.1

## [1.0.0] - Initial Release

### Added
- Initial release of ngx-cerious-scroll library
