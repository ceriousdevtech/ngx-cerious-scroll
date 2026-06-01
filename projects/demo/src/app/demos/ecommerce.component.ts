import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { makeProduct, SHOP_TOTAL, stars } from './shop.data';

@Component({
  selector: 'demo-ecommerce',
  standalone: true,
  imports: [NgIf, CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>🛍️ Product Catalog</h1>
        <p>{{ total.toLocaleString() }} products with ratings and add-to-cart.</p>
      </div>

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
