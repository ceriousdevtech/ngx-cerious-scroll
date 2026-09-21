import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/**
 * The "How to build this" panel that every demo carries.
 *
 * A demo shows that a feature works; it does not show how to USE it, and the
 * source of these pages is mostly the fake dataset and the styling rather than
 * the handful of options that actually turn the feature on. This panel pulls
 * those options out and puts them next to the running thing.
 *
 * It is a <details>, collapsed by default, and it is deliberately capped when
 * open. `.demo-scroll` is `flex: 1` inside a fixed-height column, so anything
 * that grows the column steals height from the scroller, which is the engine's
 * viewport. Open, the panel scrolls inside its own box instead.
 */
@Component({
  selector: 'demo-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="demo-docs">
      <summary class="demo-docs__summary">
        <span class="demo-docs__chev" aria-hidden="true"></span>
        <span class="demo-docs__label">How to build this</span>
        <!-- Interpolated, not innerHTML: 'feature' is a plain one-line label,
             and an unescaped tag in it would not merely render oddly, it would
             restructure the panel. -->
        <span class="demo-docs__feature">{{ feature }}</span>
      </summary>
      <div class="demo-docs__body">
        <div class="demo-docs__prose">
          @if (introBody) {
            <p [innerHTML]="introBody"></p>
          }
          <ng-content select="[intro]"></ng-content>
          @if (noteBodies.length) {
            <h4>Worth knowing</h4>
            <ul>
              @for (n of noteBodies; track $index) {
                <li [innerHTML]="n"></li>
              }
            </ul>
          }
          <ng-content select="[notes]"></ng-content>
          @if (docs) {
            <p class="demo-docs__more">
              <a [href]="docs" target="_blank" rel="noreferrer">Full documentation &rarr;</a>
            </p>
          }
        </div>
        <div class="demo-docs__codewrap">
          <button class="demo-docs__copy" type="button" (click)="copy()">{{ label }}</button>
          <pre class="demo-docs__code"><code [innerHTML]="highlighted"></code></pre>
        </div>
      </div>
    </details>
  `,
})
export class DemoDocsComponent {
  /** What this demo demonstrates, one line. */
  @Input({ required: true }) feature = '';

  /** Link to the matching section of the implementation guide. */
  @Input() docs?: string;

  /**
   * Prose as an HTML string, instead of the projected `intro` / `notes` blocks.
   *
   * The vanilla demos hold this prose as markup, and the wrapper demos reuse it
   * verbatim so the two galleries cannot drift apart. These strings are
   * authored in this repo, not user input, which is why they are marked
   * trusted rather than sanitised into uselessness (the prose uses <code> and
   * <em> freely).
   */
  @Input()
  set introHtml(value: string | undefined) {
    this.introBody = value ? this.sanitizer.bypassSecurityTrustHtml(value) : null;
  }

  @Input()
  set notesHtml(value: string[] | undefined) {
    this.noteBodies = (value ?? []).map((n) => this.sanitizer.bypassSecurityTrustHtml(n));
  }

  protected introBody: SafeHtml | null = null;
  protected noteBodies: SafeHtml[] = [];

  /** The snippet that turns the feature on. */
  @Input({ required: true })
  set code(value: string) {
    this.source = dedent(value);
    this.highlighted = this.sanitizer.bypassSecurityTrustHtml(highlight(this.source));
  }

  protected highlighted: SafeHtml = '';
  protected label = 'Copy';
  private source = '';

  constructor(private readonly sanitizer: DomSanitizer) {}

  protected copy(): void {
    // `writeText` rejects without a secure context or a permission, and the
    // demos are opened over plain http on a LAN often enough to hit that.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(this.source))
      .then(
        () => (this.label = 'Copied'),
        () => (this.label = 'Press ⌘C'),
      )
      .then(() => setTimeout(() => (this.label = 'Copy'), 1600));
  }
}

/** Minimal JS/HTML tokeniser, only as good as a snippet needs. */
function highlight(src: string): string {
  const escaped = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // One pass, alternation ordered so comments and strings win before any
  // keyword inside them can match. Running separate passes instead lets a
  // later one rewrite the markup an earlier one just inserted.
  return escaped.replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('[^'\n]*'|"[^"\n]*"|`[^`]*`)|\b(const|let|var|function|return|new|if|else|for|of|in|async|await|import|from|export|class|true|false|null|undefined|type|interface|readonly|protected|private|public)\b|\b(\d[\d_]*)\b/g,
    (m, comment, str, kw, num) => {
      if (comment) return '<i class="tok-c">' + comment + '</i>';
      if (str) return '<i class="tok-s">' + str + '</i>';
      if (kw) return '<i class="tok-k">' + kw + '</i>';
      if (num) return '<i class="tok-n">' + num + '</i>';
      return m;
    },
  );
}

/** Trim a template literal down to its own left margin. */
function dedent(src: string): string {
  const lines = String(src).replace(/\t/g, '  ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = lines
    .filter((l) => l.trim())
    .reduce((min, l) => Math.min(min, l.match(/^ */)![0].length), Infinity);
  return lines.map((l) => l.slice(indent)).join('\n');
}
