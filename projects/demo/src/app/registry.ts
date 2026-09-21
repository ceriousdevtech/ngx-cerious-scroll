import type { Type } from '@angular/core';

import type { DemoIconName } from './demo-icons';

import { BasicDemoComponent } from './demos/basic-demo.component';
import { ComparisonComponent } from './demos/comparison.component';
import { DataGridComponent } from './demos/data-grid.component';
import { TableComponent } from './demos/table.component';
import { TableHeightsComponent } from './demos/table-heights.component';
import { TableStreamComponent } from './demos/table-stream.component';
import { MasonryComponent } from './demos/masonry.component';
import { MasonryDynamicComponent } from './demos/masonry-dynamic.component';
import { MasonryGalleryComponent } from './demos/masonry-gallery.component';
import { StickySnapComponent } from './demos/sticky-snap.component';
import { InfiniteFeedComponent } from './demos/infinite-feed.component';
import { AccessibilityComponent } from './demos/accessibility.component';
import { RtlComponent } from './demos/rtl.component';
import { SsrHydrationComponent } from './demos/ssr-hydration.component';
import { PrimengTableComponent } from './demos/primeng-table.component';
import { ChatComponent } from './demos/chat.component';
import { LogViewerComponent } from './demos/log-viewer.component';
import { CodeViewerComponent } from './demos/code-viewer.component';
import { EcommerceComponent } from './demos/ecommerce.component';
import { FinanceComponent } from './demos/finance.component';
import { GitHistoryComponent } from './demos/git-history.component';
import { SqlResultsComponent } from './demos/sql-results.component';

export interface DemoMeta {
  slug: string;
  title: string;
  icon: DemoIconName;
  blurb: string;
  component: Type<unknown>;
}

export const DEMOS: DemoMeta[] = [
  {
    slug: 'comparison',
    title: 'vs Angular CDK',
    icon: 'comparison',
    blurb:
      'Side-by-side stress test against @angular/cdk virtual scroll across 5 scenarios: dynamic heights, expanding rows, async images, millions of rows, and continuous updates.',
    component: ComparisonComponent,
  },
  {
    slug: 'basic',
    title: 'Basic / Vanilla',
    icon: 'basic',
    blurb:
      'Configurable dataset size (up to 1,000,000), fixed/variable heights, jump-to-row and live stats.',
    component: BasicDemoComponent,
  },
  {
    slug: 'data-grid',
    title: 'Data Grid',
    icon: 'grid',
    blurb: 'Multi-column grid with sortable headers, live search, and Ctrl/Cmd multi-select.',
    component: DataGridComponent,
  },
  {
    slug: 'table',
    title: 'Native Table',
    icon: 'table',
    blurb: "Real <table>/<tr>/<td> rows via layout:'table', frozen header, aligned columns, single tbody transform. Virtualizes millions of rows with ~25 DOM rows.",
    component: TableComponent,
  },
  {
    slug: 'table-heights',
    title: 'Table · Wild Heights',
    icon: 'tableHeights',
    blurb: 'Native <table> stress test: every <tr> has a wildly different height, one-liners, walls of text, long lists, code blocks, tall banners. Each row is measured, never estimated.',
    component: TableHeightsComponent,
  },
  {
    slug: 'table-prepend',
    title: 'Table · Prepend & Anchor',
    icon: 'tablePrepend',
    blurb: 'Inject variable-height rows at the TOP of the stream, live telemetry / chat-history backfill, and watch the scroll position stay cleanly anchored to the row you were reading.',
    component: TableStreamComponent,
  },
  {
    slug: 'masonry',
    title: 'Masonry · Canonical',
    icon: 'masonry',
    blurb: 'Responsive Angular card columns with computed heights, reproducible placement, and only the visible cards mounted.',
    component: MasonryComponent,
  },
  {
    slug: 'masonry-dynamic',
    title: 'Masonry · Dynamic',
    icon: 'masonryDynamic',
    blurb: 'Unpredictable Angular template content measured from the DOM with constant-time far jumps and locally deterministic placement.',
    component: MasonryDynamicComponent,
  },
  {
    slug: 'masonry-gallery',
    title: 'Masonry · Real Content',
    icon: 'masonryGallery',
    blurb: 'Network images, a composed Angular template and a carousel per card, virtualized. Shows the patterns recycled cards demand: reserved media space, enforced card height, and state keyed by index.',
    component: MasonryGalleryComponent,
  },
  {
    slug: 'sticky-snap',
    title: 'Sticky & Snap',
    icon: 'sticky',
    blurb:
      'Section headers pinned outside the recycler (so they survive the moment their rows scroll away) plus a camera that settles on a whole row when you stop.',
    component: StickySnapComponent,
  },
  {
    slug: 'infinite',
    title: 'Infinite Loading',
    icon: 'infinite',
    blurb:
      'Asks for the next page as the end comes into range and grows the dataset in place, so the camera never moves. Asks once per approach, even while a slow fetch is still open.',
    component: InfiniteFeedComponent,
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    icon: 'accessibility',
    blurb:
      'Virtualization hides the dataset from screen readers. See what a reader actually announces, with and without the ARIA the engine writes.',
    component: AccessibilityComponent,
  },
  {
    slug: 'rtl',
    title: 'Right-to-left',
    icon: 'rtl',
    blurb:
      'Arabic and Hebrew content with the scrollbar on the left and rows inset from the trailing edge. Direction read from the host.',
    component: RtlComponent,
  },
  {
    slug: 'ssr',
    title: 'SSR & Hydration',
    icon: 'ssr',
    blurb:
      'Eight rows rendered before the engine exists, then adopted rather than thrown away: toggle hydration off to watch the engine rebuild every one.',
    component: SsrHydrationComponent,
  },
  {
    slug: 'primeng-table',
    title: 'PrimeNG Table',
    icon: 'grid',
    blurb:
      "A real PrimeNG <p-table> header, sortable columns, per-column filter menus, column resize & reorder, backed by PrimeNG's own FilterService, with Cerious-Scroll as the scroll engine. Scrolls up to 5,000,000 rows index-derived (~25 in the DOM, no dataset in memory); sort/filter materialize the full set on demand.",
    component: PrimengTableComponent,
  },
  {
    slug: 'chat',
    title: 'Chat Messages',
    icon: 'chat',
    blurb: 'Variable-height message bubbles, sent/received styling, and auto-scroll on send.',
    component: ChatComponent,
  },
  {
    slug: 'log-viewer',
    title: 'Log Viewer',
    icon: 'logs',
    blurb: 'System logs with level filtering, live search, and color-coded severities.',
    component: LogViewerComponent,
  },
  {
    slug: 'code-viewer',
    title: 'Code Viewer',
    icon: 'code',
    blurb: 'Syntax-highlighted source with line numbers and find-in-file jump.',
    component: CodeViewerComponent,
  },
  {
    slug: 'ecommerce',
    title: 'E-commerce',
    icon: 'ecommerce',
    blurb: 'Product catalog with ratings, prices, stock state, and an add-to-cart counter.',
    component: EcommerceComponent,
  },
  {
    slug: 'finance',
    title: 'Financial Trading',
    icon: 'finance',
    blurb: 'Real-time stock ticker with streaming prices, % change, and sparklines.',
    component: FinanceComponent,
  },
  {
    slug: 'git-history',
    title: 'Git History',
    icon: 'git',
    blurb: 'Commit log with authors, branches, and click-to-expand changed files (variable height).',
    component: GitHistoryComponent,
  },
  {
    slug: 'sql-results',
    title: 'SQL Results',
    icon: 'sql',
    blurb: 'Query result viewer with column headers, status badges, and row selection.',
    component: SqlResultsComponent,
  },
];
