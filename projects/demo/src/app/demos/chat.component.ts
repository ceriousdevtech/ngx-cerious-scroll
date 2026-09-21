import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { CHAT_BASE, ME, generateMessage, nowTime, type ChatMessage } from './chat.data';

import { DemoIconComponent } from '../demo-icon.component';
import { DemoDocsComponent } from '../demo-docs.component';

@Component({
  selector: 'demo-chat',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, DemoIconComponent, DemoDocsComponent],
  template: `
    <div class="demo-page">
      <div class="demo-page__header">
        <h1><demo-icon name="chat" />Team Chat</h1>
        <p>{{ total.toLocaleString() }} variable-height messages, send one and it auto-scrolls to the bottom.</p>
      </div>

      <demo-docs
        [feature]="DOCS_FEATURE"
        [docs]="DOCS_LINK"
        [introHtml]="DOCS_INTRO"
        [notesHtml]="DOCS_NOTES"
        [code]="DOCS_CODE"
      />

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
  /** 'How to build this' panel. Prose shared with the vanilla demos. */
  readonly DOCS_FEATURE = "Variable-height bubbles with stick-to-bottom";
  readonly DOCS_LINK = "https://github.com/ceriousdevtech/cerious-scroll/blob/main/docs/IMPLEMENTATION_GUIDE.md";
  readonly DOCS_INTRO = "A chat log is a virtual scroller with two extra habits: message heights are unknown until rendered, and the view should stay pinned to the newest message, but only when the reader was already at the bottom. Scrolling up to read history and then being yanked back down by an incoming message is the bug every chat UI has shipped at least once. The check is simply whether the camera is on the last element before you grow the dataset.";
  readonly DOCS_NOTES = [
    "Capture “was at bottom” before you change the length, not after: afterwards the answer is always no.",
    "Bubbles are measured, so mixed text, images and attachments need no declared heights.",
    "Reserve space for attachments before they load, or a late image will push the newest message off screen.",
    "Backfilling older messages at the top is the prepend-and-anchor case; see that demo.",
  ];
  readonly DOCS_CODE = `send(text: string): void {
  this.messages = [...this.messages, { id: nextId(), text, mine: true }];
  // Stick to the bottom after the new bubble is measured.
  requestAnimationFrame(() => this.scroller?.scrollToPercentage(100));
}`;

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
