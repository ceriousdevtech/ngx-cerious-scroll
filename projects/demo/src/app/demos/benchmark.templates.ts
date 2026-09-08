/**
 * Row template metadata and the deterministic data each one draws from.
 *
 * Angular renders rows through a real template, so unlike the React and Vue
 * ports the markup lives in `benchmark-row.component.ts` rather than here. This
 * file holds the labels, the explanatory notes, and the pure helpers the
 * template calls, so the row markup stays declarative.
 */
import {
  ApplicationRef,
  EnvironmentInjector,
  createComponent,
  type Type,
} from '@angular/core';

import { hash } from './benchmark.harness';

export const PALETTE = ['#78f3d2', '#8cb7ff', '#c9a2ff', '#f2c66d', '#ff9f9f', '#8ee6a0'];

export const TITLES = [
  'Deploy succeeded',
  'Latency spike detected',
  'Cache invalidated',
  'Pull request merged',
  'Queue drained',
  'Auth token refreshed',
  'Index rebuilt',
  'Snapshot uploaded',
];
export const SYMBOLS = ['ACME', 'GLBX', 'NRTH', 'VECT', 'QNTM', 'HELX', 'ORBT', 'PLSR'];
export const REGIONS = ['us-east-1', 'eu-west-2', 'ap-south-1', 'sa-east-1'];
export const OWNERS = ['A. Okafor', 'M. Duarte', 'S. Kaur', 'J. Lindqvist', 'R. Osei'];
export const TAGS = ['prod', 'edge', 'db', 'api', 'worker', 'cdn'];
export const STAT_KEYS = ['p50', 'p95', 'errors', 'rps', 'cpu', 'queue'];
export const SINK_TAGS = ['prod', 'edge', 'db', 'api', 'cache', 'worker'];
export const CHECKS = ['sync', 'audit', 'alerts'];

export const DEEP_LEVELS = 16;
export const DEEP_TAGS = [
  'section', 'header', 'div', 'ul', 'li', 'article', 'figure', 'span',
  'p', 'em', 'small', 'label', 'nav', 'aside', 'main', 'footer',
];

/** `@for` needs something to iterate; these are the fixed-length spans. */
export const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

export interface RowTemplateMeta {
  label: string;
  /** Grouping and wording mirror the vanilla benchmark exactly. */
  group: string;
  optionLabel: string;
  note: string;
  /** Fixed pixel height, or null when the height comes from the content. */
  height: ((index: number) => number) | null;
}

export const TEMPLATES: Record<string, RowTemplateMeta> = {
  uniform: {
    label: 'Uniform 44px',
    group: 'Synthetic, fixed heights',
    optionLabel: 'Uniform 44px rows',
    note: 'Control case: one fixed height, so there is nothing to measure and nothing to vary.',
    height: () => 44,
  },
  mixed: {
    label: 'Mixed 44/64/104px',
    group: 'Synthetic, fixed heights',
    optionLabel: 'Mixed 44 / 64 / 104px',
    note: 'Three repeating heights, so the engine can no longer assume a constant row height.',
    height: (i) => [44, 64, 104][i % 3],
  },
  wild: {
    label: 'Wild 32-420px',
    group: 'Synthetic, fixed heights',
    optionLabel: 'Wild, 32 to 420px',
    note: 'Heights scattered from 32px to 420px with no pattern, forcing a real measurement on every row.',
    height: (i) => 32 + Math.floor(hash(i, 7) * 388),
  },
  rich: {
    label: 'Rich cards',
    group: 'Realistic, height measured from the DOM',
    optionLabel: 'Rich cards (avatar, text, tags)',
    note: 'The everyday card: avatar, title, a few text lines and tags. Height comes from the content.',
    height: null,
  },
  grid: {
    label: 'Dense data grid',
    group: 'Realistic, height measured from the DOM',
    optionLabel: 'Dense data grid (12 columns, sparkline)',
    note: 'Twelve columns of tabular numbers plus a badge, a delta and a sparkline. Many siblings per row.',
    height: null,
  },
  media: {
    label: 'Media cards',
    group: 'Realistic, height measured from the DOM',
    optionLabel: 'Media cards (thumbnail, rating, avatars)',
    note: 'Aspect-ratio thumbnail with overlay chrome, star rating, progress, avatar stack and buttons.',
    height: null,
  },
  chart: {
    label: 'Inline SVG charts',
    group: 'Realistic, height measured from the DOM',
    optionLabel: 'Inline SVG charts (path, bars, gridlines)',
    note: 'A real inline SVG per row: gridlines, 28 bars, a filled area path, a polyline and an end marker.',
    height: null,
  },
  form: {
    label: 'Native form controls',
    group: 'Stress, deliberately expensive DOM',
    optionLabel: 'Native form controls (input, select, range)',
    note: 'Genuine widgets: text input, six-option select, checkboxes, range and button. Expensive to lay out.',
    height: null,
  },
  nested: {
    label: 'Deep tree (16 levels)',
    group: 'Stress, deliberately expensive DOM',
    optionLabel: 'Deep tree, 16 levels of nesting',
    note: 'The depth test: 16 elements wrapping one another. Adds ancestors rather than siblings, so Angular and the browser both descend 16 levels for one row.',
    height: null,
  },
  sink: {
    label: 'Kitchen sink',
    group: 'Stress, deliberately expensive DOM',
    optionLabel: 'Kitchen sink (gradients, shadows, transform)',
    note: 'Everything at once: gradients, drop shadows, a transform, an SVG glyph, a stat grid and six badges.',
    height: null,
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

/** Ordered optgroups, so the select reads the same as the vanilla page. */
export const TEMPLATE_GROUPS: { label: string; keys: string[] }[] = [
  "Synthetic, fixed heights",
  "Realistic, height measured from the DOM",
  "Stress, deliberately expensive DOM",
].map((label) => ({ label, keys: TEMPLATE_KEYS.filter((k) => TEMPLATES[k].group === label) }));
export const SWEEP_KEYS = ['mixed', 'rich', 'grid', 'media', 'chart', 'form', 'nested', 'sink'];

/* ---------------------------------------------------- per-template data */

export const rowHeight = (key: string, index: number): number | null =>
  TEMPLATES[key].height ? TEMPLATES[key].height!(index) : null;
export const color = (index: number): string => PALETTE[index % PALETTE.length];
export const barWidth = (index: number): string => `${25 + (index % 65)}%`;
export const cardLines = (index: number): number[] => range(1 + Math.floor(hash(index, 11) * 4));
export const cardLineWidth = (index: number, i: number): string =>
  `${52 + Math.floor(hash(index, 20 + i) * 46)}%`;
export const cardTags = (index: number): number[] => range(1 + Math.floor(hash(index, 31) * 3));
export const gridCell = (index: number, c: number): string =>
  (10 + hash(index, 40 + c) * 9990).toFixed(2);
export const gridState = (index: number): [string, string] =>
  index % 7 === 0 ? ['warn', 'review'] : index % 3 === 0 ? ['off', 'idle'] : ['ok', 'active'];
export const gridDelta = (index: number): number => (hash(index, 51) - 0.5) * 12;
export const sparkHeight = (index: number, b: number): string =>
  `${18 + hash(index, 60 + b) * 82}%`;
export const bandHeight = (index: number, b: number): string =>
  `${14 + hash(index, 130 + b) * 86}%`;
export const bandColor = (b: number): string =>
  b % 4 === 0 ? 'rgba(120,243,210,.6)' : 'rgba(140,183,255,.45)';
export const thumbGradient = (index: number): string =>
  `linear-gradient(${Math.floor(hash(index, 5) * 360)}deg, ${PALETTE[index % PALETTE.length]}, ${PALETTE[(index + 3) % PALETTE.length]})`;
export const duration = (index: number): string => {
  const secs = 30 + Math.floor(hash(index, 6) * 5400);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};
export const stars = (index: number): number => 1 + Math.floor(hash(index, 16) * 5);
export const trackWidth = (index: number, salt: number): string =>
  `${10 + hash(index, salt) * 88}%`;
export const statValue = (index: number, i: number): string =>
  (hash(index, 110 + i) * 400).toFixed(1);
export const checked = (index: number, k: number): boolean => hash(index, 100 + k) > 0.5;

/** Points for the inline SVG series, shared by the polyline and the area path. */
export function chartPoints(index: number): string {
  const W = 300;
  const H = 64;
  const N = 28;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    pts.push(`${((W * i) / (N - 1)).toFixed(1)},${(6 + hash(index, 70 + i) * (H - 14)).toFixed(1)}`);
  }
  return pts.join(' ');
}
export const chartArea = (index: number): string =>
  `M0,64 L${chartPoints(index).split(' ').join(' L')} L300,64 Z`;
export const chartLastX = (index: number): string => chartPoints(index).split(' ').pop()!.split(',')[0];
export const chartLastY = (index: number): string => chartPoints(index).split(' ').pop()!.split(',')[1];
export const chartBarX = (i: number): number => (300 * i) / 27 - 2;
export const chartBarH = (index: number, i: number): number => hash(index, 90 + i) * 18;

/* --------------------------------------------------------- node counting */

const footprintCache = new Map<string, number>();

/**
 * Count the elements a template produces for one row. Measured, not asserted:
 * five rows are rendered into a detached host through Angular itself, so the
 * count reflects what Angular actually emits.
 */
export function templateFootprint(
  key: string,
  rowComponent: Type<{ index: number; templateKey: string }>,
  injector: EnvironmentInjector,
  appRef: ApplicationRef,
): number {
  const cached = footprintCache.get(key);
  if (cached !== undefined) return cached;

  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;width:900px;visibility:hidden';
  document.body.appendChild(probe);

  let nodes = 0;
  for (let i = 0; i < 5; i++) {
    const host = document.createElement('div');
    probe.appendChild(host);
    const ref = createComponent(rowComponent, { environmentInjector: injector, hostElement: host });
    ref.setInput('index', i);
    ref.setInput('templateKey', key);
    appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    // Discount the component host element itself; count what it produced.
    nodes += host.querySelectorAll('*').length;
    appRef.detachView(ref.hostView);
    ref.destroy();
  }
  probe.remove();

  const result = Math.round(nodes / 5);
  footprintCache.set(key, result);
  return result;
}

/* Named wrappers around the deterministic hash, so the row template reads as
   intent ("how many views") rather than as a salt number. */
export const hashAvg = (index: number): number => hash(index, 12) * 100;
export const viewsRand = (index: number): number => hash(index, 8);
export const ageRand = (index: number): number => hash(index, 9);
export const retentionRand = (index: number): number => hash(index, 15);
export const ratingsRand = (index: number): number => hash(index, 17);
export const weightRand = (index: number): number => hash(index, 13);
export const updatedRand = (index: number): number => hash(index, 19);
