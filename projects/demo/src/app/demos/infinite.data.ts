/** Deterministic feed data for the infinite-loading demo. */
import { rand } from '../lib/random';

export const PAGE = 40;
export const FIRST_PAGE = 40;
export const MAX_ROWS = 2_000;

const WHO = (
  'Ada Lovelace|Grace Hopper|Alan Kay|Barbara Liskov|Ken Thompson|Radia Perlman|' +
  'Leslie Lamport|Margaret Hamilton|Donald Knuth|Frances Allen'
).split('|');
const HUES = [188, 262, 152, 28, 350, 210];
const TEXT = [
  'Pushed a fix for the anchoring drift on prepend.',
  'The measured-height cache now survives a resize.',
  'Benchmarked a million rows: mount is flat, memory is flat.',
  'Replaced the estimate with a real measurement. No more jitter.',
  'Recycled cards need idempotent renderers. Learned that twice.',
  'Scroll anchoring holds when the row above changes height.',
  'Cut a forced layout out of the render path.',
  'The virtual strip is capped now, so the thumb reaches the end.',
];

export interface Post {
  id: number;
  who: string;
  hue: number;
  text: string;
  batch: number;
  minutes: number;
}

export function makePage(from: number, count: number, batch: number): Post[] {
  const out: Post[] = [];
  for (let i = from; i < from + count; i++) {
    out.push({
      id: i,
      who: WHO[Math.floor(rand(i, 3) * WHO.length)],
      hue: HUES[Math.floor(rand(i, 5) * HUES.length)],
      text: TEXT[Math.floor(rand(i, 7) * TEXT.length)],
      batch,
      minutes: i * 3 + 1,
    });
  }
  return out;
}
