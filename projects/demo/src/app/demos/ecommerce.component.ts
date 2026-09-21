import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { makeProduct, SHOP_TOTAL, stars } from './shop.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-ecommerce',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="ecommerce" />Product Catalog</h1>
        <p>{{ total.toLocaleString() }} products with ratings and add-to-cart.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

      <div class="demo-toolbar">
        <span class="stat">🛒 Cart: <strong>{{ cart.size }}</strong> item{{ cart.size === 1 ? '' : 's' }}</span>
        <span class="spacer"></span>
        <button type="button" (click)="clearCart()" [disabled]="cart.size === 0">Clear cart</button>
      </div>

      <div
        class="demo-scroll shop-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getItem"
        [ceriousScrollItemTemplate]="rowTpl"
      ></div>

      <ng-template #rowTpl let-i="index">
        <div class="product" *ngIf="product(i) as p">
          <div class="product__img" [style.background]="p.gradient">{{ p.emoji }}</div>
          <div class="product__body">
            <div class="product__name">{{ p.name }}</div>
            <div class="product__cat">{{ p.category }}</div>
            <div class="product__rating">
              {{ star(p.rating) }} <small>{{ p.rating.toFixed(1) }} · {{ p.reviews.toLocaleString() }} reviews</small>
            </div>
          </div>
          <div class="product__aside">
            <div class="product__price">{{ '$' + p.price.toFixed(2) }}</div>
            @if (p.prime) { <div class="product__prime">✓ Prime</div> }
            @if (!p.inStock) {
              <div class="product__stock">Out of stock</div>
            } @else {
              <button type="button" class="product__add" [class.in-cart]="cart.has(i)" (click)="toggle(i)">
                {{ cart.has(i) ? 'In cart ✓' : 'Add to cart' }}
              </button>
            }
          </div>
        </div>
      </ng-template>

      <div class="demo-footer">
        <span>In cart: <strong>{{ cart.size }}</strong></span>
        <span>Click “Add to cart” on any product</span>
      </div>
    </div>
  `,
})
export class EcommerceComponent {
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "Product cards with state that survives recycling";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "A catalogue row carries state the DOM cannot be trusted to keep: quantity in the cart, whether something is favourited, which variant is selected. The container your renderer receives is recycled, so anything written onto the node belongs to whichever product held it last. The rule is that your data is the source of truth and the DOM is a projection of it. Every render writes the full state, and every interaction writes back to the data before asking for a repaint.";
  readonly DOCS_NOTES = [
    "Never store state only on the DOM node: recycling will hand it to a different product.",
    "Delegate events to the host and identify the row by a data attribute rewritten on every render.",
    "Reserve image space with <code>aspect-ratio</code> so a late-loading photo does not change the card's measured height.",
    "<code>refresh()</code> repaints the mounted rows; it does not re-create anything, so it is cheap enough for a click handler.",
  ];
  readonly DOCS_CODE = `// State that must survive recycling lives OUTSIDE the row.
cart: Record<number, number> = {};

<ng-template #rowTpl let-p>
  <app-product-card [product]="p" [qty]="cart[p.id] ?? 0" (add)="add(p.id)" />
</ng-template>`;

  readonly total = SHOP_TOTAL;
  protected readonly product = makeProduct;
  protected readonly star = stars;

  cart = new Set<number>();
  readonly getItem = (i: number): number => i;

  toggle(index: number): void {
    const next = new Set(this.cart);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    this.cart = next;
  }

  clearCart(): void {
    this.cart = new Set();
  }
}
