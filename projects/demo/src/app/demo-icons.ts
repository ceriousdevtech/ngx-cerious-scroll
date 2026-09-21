/**
 * Icon set for the demo gallery and the demo headings.
 *
 * These replace the emoji both used to carry. Emoji are drawn by the platform,
 * not by us: the same character is a flat glyph on one OS and a glossy colour
 * sticker on another, several of the ones in use here fall back to a
 * monochrome outline on Windows, and a couple render as a box in browsers that
 * ship no colour font at all. None of that is something a stylesheet can reach.
 *
 * So: hand-drawn line icons on a 24x24 grid, stroked in `currentColor` so they
 * take the colour of whatever they sit in. The path data is shared with the
 * vanilla demos' `demo-icons.js`, so the two galleries stay identical.
 */

/** Path data by name. Each one says what the demo IS rather than decorating it. */
const PATHS = {
  /* Two stacks measured against each other. */
  comparison:
    '<rect x="3" y="4" width="7" height="16" rx="1.5"/>' +
    '<rect x="14" y="4" width="7" height="16" rx="1.5"/>' +
    '<path d="M3 9h7M3 14h7M14 11h7"/>',
  /* Plain stacked rows: the base case. */
  basic:
    '<rect x="3" y="4" width="18" height="4" rx="1.2"/>' +
    '<rect x="3" y="10" width="18" height="4" rx="1.2"/>' +
    '<rect x="3" y="16" width="18" height="4" rx="1.2"/>',
  /* A grid with a distinct header band. */
  grid:
    '<rect x="3" y="4" width="18" height="16" rx="1.6"/>' +
    '<path d="M3 9h18M9.5 9v11M15.5 9v11"/>',
  /* Unequal blocks against a ruler: masonry whose heights are MEASURED. */
  masonryDynamic:
    '<path d="M3.2 4v16M3.2 6.5h2M3.2 12h2M3.2 17.5h2"/>' +
    '<rect x="7.5" y="4" width="6" height="7" rx="1.1"/>' +
    '<rect x="7.5" y="13" width="6" height="7" rx="1.1"/>' +
    '<rect x="16" y="4" width="5.5" height="11" rx="1.1"/>' +
    '<rect x="16" y="17" width="5.5" height="3" rx="1.1"/>',
  /* Masonry carrying real media. */
  masonryGallery:
    '<rect x="3" y="4" width="18" height="16" rx="1.6"/>' +
    '<circle cx="8.5" cy="9.5" r="1.6"/>' +
    '<path d="M3 16.5l4.5-4 4 3.5 3-2.5L21 18"/>',
  /* Masonry, uniform blocks. */
  masonry:
    '<rect x="3.5" y="4" width="7" height="8" rx="1.2"/>' +
    '<rect x="3.5" y="14" width="7" height="6" rx="1.2"/>' +
    '<rect x="13.5" y="4" width="7" height="6" rx="1.2"/>' +
    '<rect x="13.5" y="12" width="7" height="8" rx="1.2"/>',
  /* A real <table>: thead plus aligned columns. */
  table:
    '<rect x="3" y="4" width="18" height="16" rx="1.6"/>' +
    '<path d="M3 9h18M3 14.5h18M10 9v11"/>',
  /* Table rows of visibly different heights. */
  tableHeights:
    '<rect x="3" y="4" width="18" height="16" rx="1.6"/>' +
    '<path d="M3 8h18M3 10.5h18M3 16h18"/>',
  /* Rows arriving at the TOP of the stack. */
  tablePrepend:
    '<path d="M12 3v6M9 6l3-3 3 3"/>' +
    '<rect x="3" y="11" width="18" height="3.5" rx="1.1"/>' +
    '<rect x="3" y="16.5" width="18" height="3.5" rx="1.1"/>',
  /* A header pinned in place while rows pass beneath. */
  sticky:
    '<path d="M9 3h6M12 3v7"/>' +
    '<path d="M7.5 10h9l-1.5 3.5H9z"/>' +
    '<path d="M4 17h16M4 20.5h16"/>',
  /* Lemniscate: the feed has no end. */
  infinite:
    '<path d="M8.2 9a3.2 3.2 0 100 6c2.4 0 3.4-1.9 4.8-3.6C14.4 9.7 15.4 9 16.8 9' +
    'a3.2 3.2 0 110 6c-1.4 0-2.4-.7-3.8-2.4C11.6 10.9 10.6 9 8.2 9z"/>',
  /* The standard accessibility figure. */
  accessibility:
    '<circle cx="12" cy="12" r="9"/>' +
    '<circle cx="12" cy="7.3" r="1.2"/>' +
    '<path d="M7.5 10.2h9M12 10.6v4.2M12 14.8l-2.2 3.4M12 14.8l2.2 3.4"/>',
  /* Text running the other way. */
  rtl:
    '<path d="M20 6H9a3.5 3.5 0 000 7h2"/>' +
    '<path d="M11 3.5L8.5 6 11 8.5"/>' +
    '<path d="M15 13V6M11 13V6"/>' +
    '<path d="M4 18h16M6.5 15.5L4 18l2.5 2.5"/>',
  /* Markup delivered already rendered, then taken over. */
  ssr:
    '<rect x="3" y="4" width="18" height="12" rx="1.6"/>' +
    '<path d="M8 20h8M12 16v4"/>' +
    '<path d="M13 7l-2.5 4h3L11 13.5"/>',
  chat:
    '<path d="M3.5 6.5A2 2 0 015.5 4.5h9a2 2 0 012 2v5a2 2 0 01-2 2H8l-4.5 3z"/>' +
    '<path d="M18 9.5h.5a2 2 0 012 2v5a2 2 0 01-2 2H18l-3 2.2V18"/>',
  logs:
    '<rect x="3.5" y="3" width="17" height="18" rx="1.6"/>' +
    '<path d="M7 7.5h6M7 11h10M7 14.5h10M7 18h5"/>',
  code: '<path d="M9 7.5L4.5 12 9 16.5M15 7.5L19.5 12 15 16.5M13.5 4.5l-3 15"/>',
  ecommerce:
    '<path d="M5 7.5h14l-1.1 12a1.6 1.6 0 01-1.6 1.5H7.7a1.6 1.6 0 01-1.6-1.5z"/>' +
    '<path d="M8.75 10V6.5a3.25 3.25 0 016.5 0V10"/>',
  finance:
    '<path d="M3.5 20.5h17"/>' +
    '<path d="M4.5 16l4.5-5 3.5 3L20 6"/>' +
    '<path d="M15.5 6H20v4.5"/>',
  git:
    '<circle cx="7" cy="5.5" r="2.2"/>' +
    '<circle cx="7" cy="18.5" r="2.2"/>' +
    '<circle cx="17" cy="10" r="2.2"/>' +
    '<path d="M7 7.7v8.6M17 12.2c0 3-2.4 4.2-5.2 4.7"/>',
  sql:
    '<ellipse cx="12" cy="6" rx="7.5" ry="3"/>' +
    '<path d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6"/>' +
    '<path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3"/>',
  /* Not a demo: the benchmark, which measures rather than shows. */
  benchmark:
    '<path d="M4 18a8 8 0 1116 0"/>' +
    '<path d="M12 18l4.5-5"/>' +
    '<circle cx="12" cy="18" r="1.3"/>',
} as const;

export type DemoIconName = keyof typeof PATHS;

/** Inline SVG body for a named icon, or '' for an unknown one. */
export function demoIconPath(name: DemoIconName): string {
  return PATHS[name] ?? '';
}
