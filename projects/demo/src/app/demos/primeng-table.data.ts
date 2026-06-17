/**
 * Data + column model for the "PrimeNG Table · Cerious-Scroll engine" demo.
 *
 * The whole dataset is materialised as plain row objects so PrimeNG's own
 * `FilterService` (real PrimeNG filter logic, every match mode) and the sort
 * comparator can run over the ENTIRE dataset — exactly as a normal PrimeNG
 * table would. Cerious-Scroll then virtualises rendering of the processed
 * result, so only ~25 rows are ever in the DOM.
 */
import { pick, randInt, rand } from '../lib/random';

export type PtStatus = 'active' | 'idle' | 'offline';

export interface PtRow {
  id: number;
  name: string;
  email: string;
  department: string;
  status: PtStatus;
  score: number;
  /** Display string (sortable lexicographically because it's ISO yyyy-mm-dd). */
  joined: string;
}

export type PtColType = 'text' | 'numeric' | 'date' | 'badge';

export interface PtColumn {
  field: keyof PtRow;
  header: string;
  type: PtColType;
  /** Current pixel width; mutated in place by column resize. */
  width: number;
  align?: 'left' | 'right' | 'center';
}

/** Fixed pixel width of the leading selection (checkbox) column. */
export const PT_SELECT_COL_WIDTH = 52;

/** Default column model (cloned per component instance so resize/reorder is local). */
export function defaultColumns(): PtColumn[] {
  return [
    { field: 'id', header: 'ID', type: 'numeric', width: 90, align: 'right' },
    { field: 'name', header: 'Name', type: 'text', width: 200 },
    { field: 'email', header: 'Email', type: 'text', width: 260 },
    { field: 'department', header: 'Department', type: 'text', width: 160 },
    { field: 'status', header: 'Status', type: 'badge', width: 130, align: 'center' },
    { field: 'score', header: 'Score', type: 'numeric', width: 110, align: 'right' },
    { field: 'joined', header: 'Joined', type: 'date', width: 140, align: 'center' },
  ];
}

/** Fields included in the global (toolbar) search box. */
export const PT_GLOBAL_FIELDS: (keyof PtRow)[] = [
  'name',
  'email',
  'department',
  'status',
];

const FIRST = [
  'Ada', 'Linus', 'Grace', 'Alan', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia', 'Tim',
  'Katherine', 'Edsger', 'Hedy', 'Donald', 'Frances', 'John', 'Joan', 'Claude', 'Shafi', 'Vint',
];
const LAST = [
  'Lovelace', 'Torvalds', 'Hopper', 'Turing', 'Hamilton', 'Ritchie', 'Liskov', 'Thompson', 'Perlman', 'Berners-Lee',
  'Johnson', 'Dijkstra', 'Lamarr', 'Knuth', 'Allen', 'McCarthy', 'Clarke', 'Shannon', 'Goldwasser', 'Cerf',
];
const DEPARTMENTS = [
  'Engineering', 'Design', 'Product', 'Data', 'Security', 'Platform', 'Research', 'Support', 'Sales', 'Finance',
];
const STATUSES: readonly PtStatus[] = ['active', 'idle', 'offline'];

export function makeRow(index: number): PtRow {
  const first = pick(FIRST, index, 1);
  const last = pick(LAST, index, 2);
  // Deterministic date in [2018-01-01 .. 2025-12-31].
  const year = 2018 + randInt(index, 0, 7, 5);
  const month = randInt(index, 1, 12, 6);
  const day = randInt(index, 1, 28, 7);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id: index + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '') + (index % 97) + '@example.com',
    department: pick(DEPARTMENTS, index, 3),
    status: pick(STATUSES, index, 4),
    score: Math.round((rand(index, 8) * 100 + randInt(index, 0, 900, 9)) * 10) / 10,
    joined: `${year}-${pad(month)}-${pad(day)}`,
  };
}

export function buildRows(total: number): PtRow[] {
  const rows = new Array<PtRow>(total);
  for (let i = 0; i < total; i++) rows[i] = makeRow(i);
  return rows;
}

export function statusLabel(s: PtStatus): string {
  return s === 'active' ? 'Active' : s === 'idle' ? 'Idle' : 'Offline';
}

/** PrimeNG <p-tag> severity for a status. */
export function statusSeverity(s: PtStatus): 'success' | 'warning' | 'danger' {
  return s === 'active' ? 'success' : s === 'idle' ? 'warning' : 'danger';
}
