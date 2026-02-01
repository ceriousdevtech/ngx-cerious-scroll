import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';

import type { CeriousScrollOptions } from '@ceriousdevtech/cerious-scroll';
import {
  CeriousScrollComponent,
  CeriousScrollDirective,
  CeriousScrollItemTemplateDirective,
  type CeriousViewportChangeDetail,
} from 'ngx-cerious-scroll';

@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [JsonPipe, CeriousScrollComponent, CeriousScrollDirective, CeriousScrollItemTemplateDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  items: Array<{ id: number; title: string }> = this.makeItems(2000);

  lastComponentEvent: CeriousViewportChangeDetail | null = null;
  lastDirectiveEvent: CeriousViewportChangeDetail | null = null;

  options: CeriousScrollOptions = {
    // Keep defaults, but enable event emission.
    wheel: { enabled: true, emitViewportChangeEvent: true, coalesceViewportChangeEvent: true },
    touch: { enabled: true },
    keyboard: { enabled: true },
    attachScrollbar: true,
    autoResize: true,
    observeContentChanges: true,
  };

  rowHeight(index: number): number {
    // Variable row heights to exercise measurement.
    return 36 + (index % 7) * 10;
  }

  reset(): void {
    this.items = this.makeItems(2000);
    this.lastComponentEvent = null;
    this.lastDirectiveEvent = null;
  }

  private makeItems(count: number, startId = 0): Array<{ id: number; title: string }> {
    return Array.from({ length: count }, (_, i) => {
      const id = startId + i;
      return { id, title: `Row ${id}` };
    });
  }
}
