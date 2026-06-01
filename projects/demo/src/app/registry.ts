import type { Type } from '@angular/core';

import { BasicDemoComponent } from './demos/basic-demo.component';
import { DataGridComponent } from './demos/data-grid.component';
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
