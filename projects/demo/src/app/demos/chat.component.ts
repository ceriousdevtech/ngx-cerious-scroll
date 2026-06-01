import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { CHAT_BASE, ME, generateMessage, nowTime, type ChatMessage } from './chat.data';

@Component({
  selector: 'demo-chat',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1>💬 Team Chat</h1>
        <p>{{ total.toLocaleString() }} variable-height messages — send one and it auto-scrolls to the bottom.</p>
      </div>

      <div
        class="demo-scroll chat-scroll"
        ceriousScroll
        [ceriousScrollTotalElements]="total"
        [ceriousScrollGetItem]="getMessage"
        [ceriousScrollItemTemplate]="rowTpl"
      ></div>

      <ng-template #rowTpl let-msg>
        <div class="msg" [class.sent]="msg.isSent">
          <div class="msg__avatar" [style.background]="msg.user.color">{{ msg.user.emoji }}</div>
          <div class="msg__body">
            <div class="msg__meta">
              <span class="msg__name">{{ msg.user.name }}</span>
              <span>{{ msg.time }}</span>
            </div>
            <div class="msg__bubble">{{ msg.text }}</div>
            @if (msg.reactions.length) {
              <div class="msg__reactions">
                @for (r of msg.reactions; track $index) {
                  <span class="msg__reaction">{{ r.emoji }} {{ r.count }}</span>
                }
              </div>
            }
          </div>
        </div>
      </ng-template>

      <div class="chat-composer">
        <textarea
          [rows]="1"
          placeholder="Type a message…  (Enter to send, Shift+Enter for newline)"
          [(ngModel)]="draft"
          (keydown)="onKey($event)"
        ></textarea>
        <button type="button" (click)="send()" [disabled]="!draft.trim()">Send</button>
      </div>
    </div>
  `,
})
export class ChatComponent implements AfterViewInit {
  @ViewChild(CeriousScrollDirective) scroller?: CeriousScrollDirective<ChatMessage>;

  sent: ChatMessage[] = [];
  draft = '';

  get total(): number {
    return CHAT_BASE + this.sent.length;
  }

  readonly getMessage = (index: number): ChatMessage =>
    index < CHAT_BASE ? generateMessage(index) : this.sent[index - CHAT_BASE];

  ngAfterViewInit(): void {
    this.scrollToLatest();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.sent = [
      ...this.sent,
      { id: CHAT_BASE + this.sent.length, user: ME, text, time: nowTime(), reactions: [], isSent: true },
    ];
    this.draft = '';
    this.scrollToLatest();
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  private scrollToLatest(): void {
    requestAnimationFrame(() => this.scroller?.scrollToPercentage(100));
  }
}
