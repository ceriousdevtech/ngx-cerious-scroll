import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { txnFor, type Script, type Txn } from './rtl.data';

/**
 * One ledger row.
 *
 * A component rather than inline template markup so the row's data is derived
 * once per render. Inline, every field would call `txnFor(index, script)`
 * again, and a row that recomputes itself eight times per frame is a strange
 * thing to ship in the demos for a library about not doing redundant work.
 */
@Component({
  selector: 'demo-rtl-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './rtl.css',
  template: `
    <div class="rtl-row">
      <span class="rtl-avatar" [style.background]="'hsl(' + t.hue + ' 45% 26%)'">
        {{ t.merchant[0] }}
      </span>
      <span class="rtl-main">
        <span class="rtl-titleline">
          <span class="rtl-title">{{ t.merchant }}</span>
          <span class="rtl-pill" [class]="'rtl-pill ' + t.state.cls">{{ t.label }}</span>
        </span>
        <span class="rtl-sub">{{ t.city }}</span>
        <!-- An LTR run of its own, so the bidi algorithm leaves the reference
             code in the order it was written. -->
        <span class="rtl-meta rtl-ref" dir="ltr">{{ t.ref }}</span>
      </span>
      <span class="rtl-money">
        <span
          class="rtl-amount"
          [class.rtl-neg]="t.amount < 0"
          [class.rtl-pos]="t.amount >= 0"
          dir="ltr"
        >
          {{ t.amount < 0 ? '−' : '+' }}{{ money }}
        </span>
        <span class="rtl-balance" dir="ltr">{{ balance }}</span>
      </span>
    </div>
  `,
})
export class RtlRowComponent {
  @Input({ required: true })
  set index(value: number) {
    this.i = value;
    this.recompute();
  }

  @Input({ required: true })
  set script(value: Script) {
    this.s = value;
    this.recompute();
  }

  protected t: Txn = txnFor(0, 'ar');
  protected money = '';
  protected balance = '';

  private i = 0;
  private s: Script = 'ar';

  private recompute(): void {
    this.t = txnFor(this.i, this.s);
    this.money = Math.abs(this.t.amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    this.balance = this.t.balance.toLocaleString(undefined, { minimumFractionDigits: 1 });
  }
}
