/** Deterministic contacts grouped A..Z for the sticky/snap demo. */
import { rand } from '../lib/random';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FIRST = (
  'Ada Bram Cleo Dara Eli Fern Gus Hana Iris Jun Kai Lena Milo Nora Omar ' +
  'Pia Quinn Rex Sana Tomas Uma Vera Wes Xena Yara Zed'
).split(' ');
const LAST = (
  'Nakamura Oyelaran Vasquez Lindqvist Haddad Okonkwo Delacroix Sorensen ' +
  'Bekele Marchetti Novak Ferreira Adeyemi Kowalski'
).split(' ');
const HUES = [188, 262, 152, 28, 350, 210];

export type ContactRow =
  | { kind: 'head'; letter: string; count: number }
  | { kind: 'row'; letter: string; first: string; last: string; hue: number; seen: number };

/**
 * The flat row list, plus a row-index -> header-index map.
 *
 * The header is a real dataset row, which is what lets the one item template
 * draw it both in the list and in the pinned slot.
 */
export function buildContacts(): { rows: ContactRow[]; sectionOf: number[] } {
  const rows: ContactRow[] = [];
  const sectionOf: number[] = [];

  LETTERS.forEach((letter, li) => {
    const count = 6 + Math.floor(rand(li, 3) * 20);
    const headerIndex = rows.length;
    rows.push({ kind: 'head', letter, count });
    sectionOf.push(headerIndex);

    for (let k = 0; k < count; k++) {
      const n = rows.length;
      rows.push({
        kind: 'row',
        letter,
        first: FIRST[Math.floor(rand(n, 7) * FIRST.length)],
        last: LAST[Math.floor(rand(n, 11) * LAST.length)],
        hue: HUES[Math.floor(rand(n, 13) * HUES.length)],
        seen: Math.floor(rand(n, 17) * 59) + 1,
      });
      sectionOf.push(headerIndex);
    }
  });

  return { rows, sectionOf };
}
