import { Directive, TemplateRef } from '@angular/core';

export interface CeriousScrollItemTemplateContext<TItem = unknown> {
  /** The item for this row (also available as `$implicit`). */
  $implicit: TItem;
  /** Row index. */
  index: number;
  /** Same as `$implicit` for named access. */
  item: TItem;
}

/**
 * Marks an `ng-template` as the row template for `CeriousScrollComponent`.
 *
 * Usage:
 * ```html
 * <cerious-scroll [items]="items">
 *   <ng-template ceriousScrollItem let-item let-index="index">
 *     {{ index }} - {{ item.name }}
 *   </ng-template>
 * </cerious-scroll>
 * ```
 */
@Directive({
  selector: 'ng-template[ceriousScrollItem]',
  standalone: true,
})
export class CeriousScrollItemTemplateDirective<TItem = unknown> {
  constructor(public readonly templateRef: TemplateRef<CeriousScrollItemTemplateContext<TItem>>) {}
}
