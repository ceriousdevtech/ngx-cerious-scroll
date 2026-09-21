/** Shared data for the SSR hydration demo, used by the server payload and the client rows. */
import { rand } from '../lib/random';

export const TOTAL = 50_000;
/** Enough to cover the first viewport and no more. Extras are recycled at once. */
export const SERVER_ROWS = 8;

const NAMES = [
  'Amara Okonkwo',
  'Tomas Lindqvist',
  'Wei Zhang',
  'Priya Raghunathan',
  'Jonas Sorensen',
  'Fatima Haddad',
  'Diego Marchetti',
  'Noor Rahman',
];

export function rowFor(index: number) {
  return {
    name: NAMES[index % NAMES.length],
    team: ['Platform', 'Growth', 'Infra', 'Design'][Math.floor(rand(index, 5) * 4)],
    score: Math.round(rand(index, 11) * 9_500) + 500,
  };
}

/**
 * The markup a server would have sent.
 *
 * A plain string rather than a second Vue app calling `renderToString`: this is
 * a demo of an ENGINE option, and pulling `vue/server-renderer` into the client
 * bundle to generate eight rows would be staging effort that teaches nothing
 * about `ssr.hydrate`. What the option actually needs is markup carrying
 * `data-element-index`, inside an element marked `data-cerious-scroll-content`,
 * and that contract is the point.
 *
 * It mirrors `SsrRow.vue` deliberately: in a real app both sides run the same
 * component, and a server payload that disagrees with the client render will
 * shift on the first paint after adoption.
 */
export const SERVER_HTML: string = (() => {
  const rows = Array.from({ length: SERVER_ROWS }, (_, i) => {
    const r = rowFor(i);
    return (
      `<div data-element-index="${i}">` +
      '<div class="ssr-row" data-from-server="">' +
      `<span class="ssr-rank">#${(i + 1).toLocaleString()}</span>` +
      `<span><span class="ssr-name">${r.name}</span>` +
      '<span class="ssr-badge">server</span><br>' +
      `<span class="ssr-sub">${r.team}</span></span>` +
      `<span class="ssr-score">${r.score.toLocaleString()}</span>` +
      '</div></div>'
    );
  }).join('');

  return (
    '<div data-cerious-scroll-content style="position:relative;width:100%;height:100%">' +
    rows +
    '</div>'
  );
})();
