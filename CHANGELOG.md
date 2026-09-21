# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-20

### Added

- Raised `@ceriousdevtech/cerious-scroll` to `^1.2.0`, which adds pinned section
  headers (`sticky`), row snapping (`snap`), edge-triggered loading
  (`infinite`), screen-reader semantics (`aria`), right-to-left layout
  (`direction`) and SSR hydration (`ssr`). All six are set through the existing
  `options` prop, which is forwarded to the engine unchanged, so five of them
  needed no wrapper code at all.

- **`sticky` support in the directive.** This is the one that did need work.
  The engine renders the pinned header by calling your item template, and the
  directive has to know that one particular element is not a recycled row. Its
  embedded view is now exempt from the prune pass that reclaims rows leaving
  the viewport, kept alive for as long as the engine keeps the element in the
  document. Without that the pinned header rendered as an empty box the moment
  its own row scrolled out of the mounted window, which is precisely when a
  pinned header matters.

  Because the pinned row is drawn in two places at once, the item template must
  be idempotent. It already had to be for Masonry's measurement probe.

- The new engine option types (`AriaOptions`, `InfiniteOptions`,
  `InfiniteLoadContext`, `SnapOptions`, `StickyOptions`, `ScrollDirection`,
  `SsrOptions`) are available from `ngx-cerious-scroll`, which re-exports the
  core's public API wholesale.

- Five demos covering the new options: Sticky & Snap, Infinite Loading,
  Accessibility, Right-to-left, and SSR & Hydration.

### Fixed

- **A row whose template root was a control-flow block could render empty.**
  Embedded views were change-detected before their root nodes were appended to
  the engine's row container. When the item template's root is `@if`, `@switch`
  or `@for`, those root nodes are only the block's anchor comments, so the
  content materialised while the anchors were still detached and appending them
  afterwards left it behind. The nodes are appended first now, then detected.
  This was invisible for ordinary rows, which are re-rendered into the same
  container, and showed up as an empty `sticky` header.

- **Angular-only demo notes.** `ssr.hydrate` needs its row styles to be global,
  because a server payload carries no `_ngcontent-*` attribute and emulated
  encapsulation will not style it. An item template used with `sticky` needs a
  real element at its root rather than a bare control-flow block.

### Changed

- The demo gallery and every demo heading now use drawn line icons instead of
  emoji. Emoji are rendered by the platform, so the same character was a flat
  glyph on one OS and a colour sticker on another, and several fell back to a
  monochrome outline or an empty box. The icons are inline SVG stroked in
  `currentColor`.

- Every demo carries a collapsible "How to build this" panel showing the options
  that turn the feature on, separated from the fake dataset and styling that
  make up most of a demo's source.

- Demo prose reworked for punctuation that reads consistently across the docs.

## [1.1.5] - 2026-09-16

### Changed
- Raised `@ceriousdevtech/cerious-scroll` to `^1.1.5`. Wheel input is now
  scrolled by the browser rather than eased in JavaScript, so wheel, trackpad
  and touch all get the platform's own physics: the previous curve was fitted
  to macOS and never matched Windows. The core also builds the content element
  the native surface needs when a host has none and wraps a nested one where a
  host has it buried, so this applies to every host rather than only those whose
  markup happened to suit it. Dynamic-height Masonry no longer re-packs its
  columns mid-scroll. No wrapper API change; `wheel.smooth`,
  `wheel.smoothFactor` and `wheel.notchThresholdPx` are now deprecated no-ops.

## [1.1.4] - 2026-09-16

### Fixed
- Raised `@ceriousdevtech/cerious-scroll` to `^1.1.4`, which stops dynamic-height
  Masonry re-packing its columns while the viewer scrolls. Cards visibly jumped
  between columns mid-scroll; four separate causes on the core's scroll path fed
  it: a background chain that probe-measured the whole dataset, a card
  remounting after a height-cache eviction being read as a card that had grown, a
  relayout anchoring where the next frame had to immediately re-anchor, and
  scrolling up out of an anchored range re-anchoring once per segment. The core's
  frontier chain can now grow backwards, so scrolling up reveals new content
  instead of re-flowing the grid already on screen. No wrapper API change.

## [1.1.3] - 2026-08-25

### Changed
- Raised `@ceriousdevtech/cerious-scroll` to `^1.1.3`, inheriting native touch
  scrolling by default and stable viewport anchoring when the dataset changes.

## [1.1.2] - 2026-08-23

### Fixed
- Raised `@ceriousdevtech/cerious-scroll` to `^1.1.2`, which repairs importing this package in plain Node. Core 1.1.1 shipped an extensionless re-export in `dist/types/index.js`; Node's ESM resolver does not add file extensions, so any import of this wrapper failed with `ERR_MODULE_NOT_FOUND`. The wrapper's own bundle was never at fault: it inherited the failure through the dependency. The previous `^1.1.1` range still permitted the broken version, so the floor is raised rather than relying on resolution picking the newer release.

## [1.1.1] - 2026-08-23

### Added
- Masonry real-content demo: network images, composed Angular template card components, and a per-card carousel over 50,000 items. Demonstrates the three constraints recycled cards impose, media space reserved from intrinsic dimensions, card height enforced rather than estimated, and per-card UI state held on the component and keyed by card index so it survives a card leaving the window.
- Demo image handling shows the practices that matter with virtualization: no `loading="lazy"` (the window is already the lazy loader), an instant placeholder colour behind each reserved box, a bounded low-priority prefetch window, and bucketed request widths so a resizing CDN can cache them.

### Changed
- Updated `@ceriousdevtech/cerious-scroll` to `^1.1.1`.

### Fixed
- Demo item-count `<select>` bound `[value]` on the element, which Angular applies before the options exist, so the control rendered showing the first option regardless of the bound value. The real-content demo binds `[selected]` on each option instead.

## [1.1.0] - 2026-08-22

### Added
- Declarative canonical and dynamic Masonry support through the existing Angular item template.
- Dynamic-height probe rendering with short-lived embedded views that are destroyed after synchronous measurement.
- `jumpToItem(index, screenOffset?)` on `CeriousScrollDirective`; the existing `CeriousScrollOptions` export now accepts wrapper-owned Masonry rendering.
- Canonical-height and dynamic-height Angular demo routes.

### Changed
- Updated `@ceriousdevtech/cerious-scroll` to `^1.1.0`.
- Masonry card-count changes recreate card-derived segment state; list and table count changes continue updating in place.
- Dynamic Masonry measurement probes now use isolated local change detection instead of entering Angular's zone or joining `ApplicationRef`; unchanged Masonry frames also skip DOM pruning.

## [1.0.8] - 2026-06-24

### Changed
- **A change in the item count now grows/shrinks the dataset in place instead of recreating the engine.** The directive calls `updateTotalElements()` (propagating the new count to navigation bounds, the scrollbar track, the renderer, and the height cache) rather than recreating the scroller. A live append/prepend therefore keeps the scroll position and any in-progress scrollbar drag alive, and an appended dataset keeps a stable bottom index instead of a bouncing tail. A shrink that leaves the position past the new end is clamped, and the scrollbar thumb is re-synced after the lengthened track re-renders. The emitted `ceriousScrollReady` instance is now stable across count changes (no public API change).
- Updated the core engine dependency to `@ceriousdevtech/cerious-scroll@^1.0.8` (native-scrollbar drag rendering is now coalesced to one render per frame, with no per-row layout thrash on fast drags).

## [1.0.7] - 2026-06-11

### Changed
- Updated the core engine dependency to `@ceriousdevtech/cerious-scroll@^1.0.7`, which fixes a scrollbar regression where dragging the thumb to the top could stop a few rows short of row 0 (a stale echo-suppression marker in the native scrollbar). No changes to the Angular wrapper's API.

## [1.0.6] - 2026-06-08

### Added
- **Table mode support** (`[ceriousScrollOptions]="{ layout: 'table' }"`). The row template's `<td>` cells render straight into the engine's `<tr>` (the directive already appends template root nodes directly and re-appends them after the engine recycles a container, so no wrapper is needed).
- **`[ceriousScrollHeaderTemplate]`** input. Declarative header template (a `<tr>` of `<th>`s) rendered into the engine's `<thead>` as an embedded view, same `<table>` as the rows, so columns align natively, and it updates via change detection.

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
- Bumped peer dependency `@ceriousdevtech/cerious-scroll` to `^1.0.3`. Consumers now get horizontal flick momentum (when `touch.getHorizontalScrollTarget` is supplied) and the new custom scrollbar thumb. The `ceriousScroll` directive already lets host children pass through, so wrapping rows in a custom `overflow-x: auto` container with a sticky header works out of the box, supply a `<div data-cerious-scroll-content></div>` inside it and the engine will render rows into your element.

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
