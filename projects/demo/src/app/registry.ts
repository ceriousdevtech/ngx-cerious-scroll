import type { Type } from '@angular/core';

import { BasicDemoComponent } from './demos/basic-demo.component';
import { ComparisonComponent } from './demos/comparison.component';
import { DataGridComponent } from './demos/data-grid.component';
import { TableComponent } from './demos/table.component';
import { TableHeightsComponent } from './demos/table-heights.component';
import { TableStreamComponent } from './demos/table-stream.component';
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
  emoji: string;
  blurb: string;
  component: Type<unknown>;
}

export const DEMOS: DemoMeta[] = [
  {
    slug: 'comparison',
    title: 'vs Angular CDK',
    emoji: '⚔️',
    blurb:
      'Side-by-side stress test against @angular/cdk virtual scroll across 5 scenarios: dynamic heights, expanding rows, async images, millions of rows, and continuous updates.',
    component: ComparisonComponent,
  },
  {
    slug: 'basic',
    title: 'Basic / Vanilla',
    emoji: '🧱',
    blurb:
      'Configurable dataset size (up to 1,000,000), fixed/variable heights, jump-to-row and live stats.',
    component: BasicDemoComponent,
  },
  {
    slug: 'data-grid',
    title: 'Data Grid',
    emoji: '📊',
    blurb: 'Multi-column grid with sortable headers, live search, and Ctrl/Cmd multi-select.',
    component: DataGridComponent,
  },
  {
    slug: 'table',
    title: 'Native Table',
    emoji: '🧮',
    blurb: "Real <table>/<tr>/<td> rows via layout:'table' — frozen header, aligned columns, single tbody transform. Virtualizes millions of rows with ~25 DOM rows.",
    component: TableComponent,
  },
  {
    slug: 'table-heights',
    title: 'Table · Wild Heights',
    emoji: '🪜',
    blurb: 'Native <table> stress test: every <tr> has a wildly different height — one-liners, walls of text, long lists, code blocks, tall banners. Each row is measured, never estimated.',
    component: TableHeightsComponent,
  },
  {
    slug: 'table-prepend',
    title: 'Table · Prepend & Anchor',
    emoji: '📡',
    blurb: 'Inject variable-height rows at the TOP of the stream — live telemetry / chat-history backfill — and watch the scroll position stay cleanly anchored to the row you were reading.',
    component: TableStreamComponent,
  },
  {
    slug: 'primeng-table',
    title: 'PrimeNG Table',
    emoji: '🧩',
    blurb:
      "A real PrimeNG <p-table> header — sortable columns, per-column filter menus, column resize & reorder, backed by PrimeNG's own FilterService — with Cerious-Scroll as the scroll engine. Scrolls up to 5,000,000 rows index-derived (~25 in the DOM, no dataset in memory); sort/filter materialize the full set on demand.",
    component: PrimengTableComponent,
  },
  {
    slug: 'chat',
    title: 'Chat Messages',
    emoji: '💬',
    blurb: 'Variable-height message bubbles, sent/received styling, and auto-scroll on send.',
    component: ChatComponent,
  },
  {
    slug: 'log-viewer',
    title: 'Log Viewer',
    emoji: '📜',
    blurb: 'System logs with level filtering, live search, and color-coded severities.',
    component: LogViewerComponent,
  },
  {
    slug: 'code-viewer',
    title: 'Code Viewer',
    emoji: '👨‍💻',
    blurb: 'Syntax-highlighted source with line numbers and find-in-file jump.',
    component: CodeViewerComponent,
  },
  {
    slug: 'ecommerce',
    title: 'E-commerce',
    emoji: '🛍️',
    blurb: 'Product catalog with ratings, prices, stock state, and an add-to-cart counter.',
    component: EcommerceComponent,
  },
  {
    slug: 'finance',
    title: 'Financial Trading',
    emoji: '📈',
    blurb: 'Real-time stock ticker with streaming prices, % change, and sparklines.',
    component: FinanceComponent,
  },
  {
    slug: 'git-history',
    title: 'Git History',
    emoji: '🌿',
    blurb: 'Commit log with authors, branches, and click-to-expand changed files (variable height).',
    component: GitHistoryComponent,
  },
  {
    slug: 'sql-results',
    title: 'SQL Results',
    emoji: '🗄️',
    blurb: 'Query result viewer with column headers, status badges, and row selection.',
    component: SqlResultsComponent,
  },
];
