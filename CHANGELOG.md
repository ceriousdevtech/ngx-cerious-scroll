# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
