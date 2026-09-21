import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { demoIconPath, type DemoIconName } from './demo-icons';

/**
 * An icon by name.
 *
 * The paths are static strings shared with the vanilla demos, so they are
 * bound as trusted HTML. Nothing here is user input: `name` indexes a closed
 * map declared in `demo-icons.ts`, and an unknown name renders nothing rather
 * than throwing, because an icon is decoration beside a heading that already
 * says what the page is.
 */
@Component({
  selector: 'demo-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (body) {
      <svg
        class="demo-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
        [innerHTML]="body"
      ></svg>
    }
  `,
})
export class DemoIconComponent {
  @Input({ required: true })
  set name(value: DemoIconName) {
    const path = demoIconPath(value);
    this.body = path ? this.sanitizer.bypassSecurityTrustHtml(path) : null;
  }

  protected body: SafeHtml | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}
}
