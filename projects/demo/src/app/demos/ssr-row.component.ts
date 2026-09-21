import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { rowFor } from './ssr.data';

/**
 * One row.
 *
 * The client's rendering of a row the server may already have sent. It mirrors
 * the markup in `ssr.data.ts`'s payload deliberately: in a real app both sides
 * run the same component, and a server payload that disagrees with the client
 * render will shift on the first paint after adoption.
 */
@Component({
  selector: 'demo-ssr-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ssr-row">
      <span class="ssr-rank">#{{ rank }}</span>
      <span>
        <span class="ssr-name">{{ r.name }}</span>
        <br />
        <span class="ssr-sub">{{ r.team }}</span>
      </span>
      <span class="ssr-score">{{ score }}</span>
    </div>
  `,
})
export class SsrRowComponent {
  @Input({ required: true })
  set index(value: number) {
    this.r = rowFor(value);
    this.rank = (value + 1).toLocaleString();
    this.score = this.r.score.toLocaleString();
  }

  protected r = rowFor(0);
  protected rank = '1';
  protected score = '';
}
