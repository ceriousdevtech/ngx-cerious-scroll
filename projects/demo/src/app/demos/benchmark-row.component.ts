import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { nf } from './benchmark.harness';
import * as T from './benchmark.templates';

/**
 * One benchmark row, rendered by Angular.
 *
 * This is the whole point of the Angular port: the row markup goes through a
 * real Angular template and real change detection, so the per-frame cost the
 * harness reports is what an Angular user actually pays, not the engine's cost
 * in isolation.
 *
 * Every template builds from local DOM only — no network images, no remote
 * fonts — so a run stays deterministic and works offline.
 */
@Component({
  selector: 'benchmark-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: ':host { display: block; }',
  template: `
    @switch (templateKey) {
      @case ('rich') {
        <div class="bx-card">
          <div class="bx-card__av" [style.background]="T.color(index)">{{ title[0] }}</div>
          <div class="bx-card__body">
            <div class="bx-card__title">{{ title }} · #{{ nf.format(index) }}</div>
            @for (i of T.cardLines(index); track i) {
              <div class="bx-card__line" [style.width]="T.cardLineWidth(index, i)"></div>
            }
            <div class="bx-card__tags">
              @for (i of T.cardTags(index); track i) {
                <span class="bx-card__tag">{{ T.TAGS[(index + i) % 6] }}</span>
              }
            </div>
          </div>
        </div>
      }

      @case ('grid') {
        <div class="bx-grid">
          <span class="bx-grid__c bx-grid__c--id">#{{ nf.format(index) }}</span>
          <span class="bx-grid__c bx-grid__c--sym">{{ symbol }}</span>
          @for (c of T.range(6); track c) {
            <span class="bx-grid__c">{{ T.gridCell(index, c) }}</span>
          }
          <span class="bx-badge bx-badge--{{ T.gridState(index)[0] }}">{{ T.gridState(index)[1] }}</span>
          <span class="bx-grid__c bx-delta bx-delta--{{ T.gridDelta(index) >= 0 ? 'up' : 'down' }}">
            {{ T.gridDelta(index) >= 0 ? '▲ ' : '▼ ' }}{{ absDelta }}%
          </span>
          <div class="bx-spark">
            @for (b of T.range(12); track b) {
              <i [style.height]="T.sparkHeight(index, b)"></i>
            }
          </div>
        </div>
      }

      @case ('media') {
        <div class="bx-media">
          <div class="bx-media__thumb" [style.background]="T.thumbGradient(index)">
            <div class="bx-media__play">▶</div>
            <div class="bx-media__dur">{{ T.duration(index) }}</div>
          </div>
          <div class="bx-media__body">
            <div class="bx-media__title">{{ title }} · segment {{ nf.format(index) }}</div>
            <div class="bx-media__meta">{{ region }} · {{ views }} views · {{ age }}d ago</div>
            <div class="bx-media__meta">
              <span>Captured by {{ owner }}. </span><span>Retention {{ retention }} months.</span>
            </div>
            <div class="bx-media__row">
              <div class="bx-stars">
                @for (s of T.range(5); track s) {
                  <span [class.is-on]="s < T.stars(index)">★</span>
                }
              </div>
              <span class="bx-media__meta">{{ T.stars(index) }}.0 · {{ ratings }} ratings</span>
            </div>
            <div class="bx-track"><span [style.width]="T.trackWidth(index, 18)"></span></div>
            <div class="bx-media__row">
              <div class="bx-avatars">
                @for (a of T.range(3); track a) {
                  <span [style.background]="T.PALETTE[(index + a) % 6]">{{ T.OWNERS[(index + a) % 5][0] }}</span>
                }
              </div>
              <button type="button" class="bx-btn">Open</button>
              <button type="button" class="bx-btn">Share</button>
            </div>
          </div>
        </div>
      }

      @case ('chart') {
        <div class="bx-chart">
          <div class="bx-chart__head">
            <b>{{ symbol }} · series {{ nf.format(index) }}</b>
            <span>{{ chartAvg }} avg</span>
          </div>
          <svg viewBox="0 0 300 64" preserveAspectRatio="none">
            @for (g of [1, 2, 3]; track g) {
              <line [attr.x1]="0" [attr.x2]="300" [attr.y1]="16 * g" [attr.y2]="16 * g"
                    stroke="rgba(255,255,255,.08)" stroke-width="1" />
            }
            @for (i of T.range(28); track i) {
              <rect [attr.x]="T.chartBarX(i)" [attr.y]="60 - T.chartBarH(index, i)"
                    [attr.width]="4" [attr.height]="T.chartBarH(index, i)" fill="rgba(140,183,255,.35)" />
            }
            <path [attr.d]="T.chartArea(index)" fill="rgba(120,243,210,.12)" />
            <polyline [attr.points]="T.chartPoints(index)" fill="none" stroke="#78f3d2"
                      stroke-width="1.5" stroke-linejoin="round" />
            <circle [attr.cx]="T.chartLastX(index)" [attr.cy]="T.chartLastY(index)" r="2.5" fill="#78f3d2" />
          </svg>
        </div>
      }

      @case ('form') {
        <div class="bx-form">
          <span class="bx-form__label">row.{{ nf.format(index) }}</span>
          <input type="text" aria-label="identifier" [value]="identifier" />
          <select aria-label="region">
            @for (o of T.range(6); track o) {
              <option [selected]="o === index % 6">{{ T.REGIONS[o % 4] }}{{ o > 3 ? '-b' : '' }}</option>
            }
          </select>
          @for (name of T.CHECKS; track name; let k = $index) {
            <label class="bx-form__check">
              <input type="checkbox" [checked]="T.checked(index, k)" />{{ name }}
            </label>
          }
          <input type="range" aria-label="weight" [value]="weight" />
          <button type="button" class="bx-btn">Apply</button>
        </div>
      }

      @case ('nested') {
        <div class="bx-deep">
          <div class="bx-deep__head">
            <span class="bx-deep__chip">{{ T.DEEP_LEVELS }} levels deep</span>
            <b>node[{{ nf.format(index) }}]</b>
            <span class="bx-deep__note">each line is a real element wrapping the one below it</span>
          </div>
          <!--
            Sixteen elements nested inside one another. Every other template
            makes a row expensive by adding siblings; this one adds ancestors,
            so Angular and the browser both descend sixteen levels for one row.
          -->
          <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[0] }}&gt;
            <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[1] }}&gt;
              <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[2] }}&gt;
                <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[3] }}&gt;
                  <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[4] }}&gt;
                    <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[5] }}&gt;
                      <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[6] }}&gt;
                        <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[7] }}&gt;
                          <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[8] }}&gt;
                            <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[9] }}&gt;
                              <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[10] }}&gt;
                                <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[11] }}&gt;
                                  <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[12] }}&gt;
                                    <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[13] }}&gt;
                                      <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[14] }}&gt;
                                        <div class="bx-deep__lvl">&lt;{{ T.DEEP_TAGS[15] }}&gt;
                                          <div class="bx-deep__leaf">{{ owner }} · payload at depth {{ T.DEEP_LEVELS }}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      @case ('sink') {
        <div class="bx-sink">
          <div class="bx-sink__head">
            <div class="bx-sink__icon" [style.background]="T.color(index)">
              <svg viewBox="0 0 24 24">
                <path d="M4 18 L9 9 L14 14 L20 5" fill="none" stroke="#061019"
                      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="bx-sink__titles">
              <div class="bx-sink__title">{{ title }} · {{ nf.format(index) }}</div>
              <div class="bx-sink__sub">{{ owner }} · updated {{ updatedAgo }}m ago</div>
            </div>
            <span class="bx-badge bx-badge--ok">{{ region }}</span>
            <button type="button" class="bx-btn">⋯</button>
          </div>
          <div class="bx-sink__stats">
            @for (k of T.STAT_KEYS; track k; let i = $index) {
              <div class="bx-sink__stat"><i>{{ k }}</i><b>{{ T.statValue(index, i) }}</b></div>
            }
          </div>
          <div class="bx-spark" style="height: 26px">
            @for (b of T.range(20); track b) {
              <i [style.height]="T.bandHeight(index, b)" [style.background]="T.bandColor(b)"></i>
            }
          </div>
          <div class="bx-track" style="margin-top: 10px">
            <span [style.width]="T.trackWidth(index, 14)"></span>
          </div>
          <div class="bx-sink__foot">
            @for (t of T.SINK_TAGS; track t; let i = $index) {
              <span class="bx-badge bx-badge--{{ i === 0 ? 'ok' : i === 1 ? 'warn' : 'off' }}">{{ t }}</span>
            }
            <button type="button" class="bx-btn">Inspect</button>
            <button type="button" class="bx-btn">Mute</button>
          </div>
        </div>
      }

      @default {
        <!-- uniform / mixed / wild: fixed heights, minimal markup -->
        <div class="bx-row" [style.height.px]="fixedHeight">
          <span class="bx-row__i">#{{ nf.format(index) }}</span>
          <span class="bx-row__bar" [style.background]="T.color(index)" [style.width]="T.barWidth(index)"></span>
          <span class="bx-row__h">{{ fixedHeight }}px</span>
        </div>
      }
    }
  `,
})
export class BenchmarkRowComponent {
  @Input({ required: true }) index = 0;
  @Input({ required: true }) templateKey = 'mixed';

  protected readonly T = T;
  protected readonly nf = nf;

  protected get title(): string { return T.TITLES[this.index % T.TITLES.length]; }
  protected get symbol(): string { return T.SYMBOLS[this.index % T.SYMBOLS.length]; }
  protected get region(): string { return T.REGIONS[this.index % T.REGIONS.length]; }
  protected get owner(): string { return T.OWNERS[this.index % T.OWNERS.length]; }
  protected get fixedHeight(): number { return T.rowHeight(this.templateKey, this.index) ?? 44; }
  protected get absDelta(): string { return Math.abs(T.gridDelta(this.index)).toFixed(2); }
  protected get chartAvg(): string { return (T.hashAvg(this.index)).toFixed(2); }
  protected get views(): string { return nf.format(120 + Math.floor(T.viewsRand(this.index) * 900000)); }
  protected get age(): number { return 1 + Math.floor(T.ageRand(this.index) * 30); }
  protected get retention(): number { return 1 + Math.floor(T.retentionRand(this.index) * 12); }
  protected get ratings(): string { return nf.format(20 + Math.floor(T.ratingsRand(this.index) * 4000)); }
  protected get identifier(): string { return `${this.symbol}-${1000 + (this.index % 8999)}`; }
  protected get weight(): number { return Math.floor(T.weightRand(this.index) * 100); }
  protected get updatedAgo(): number { return 1 + Math.floor(T.updatedRand(this.index) * 59); }
}
