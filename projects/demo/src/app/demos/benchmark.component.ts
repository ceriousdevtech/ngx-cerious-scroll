import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EnvironmentInjector,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { CeriousScrollDirective } from 'ngx-cerious-scroll';

import { BenchmarkRowComponent } from './benchmark-row.component';
import {
  BASELINE_NOTE,
  collectEnv,
  compactRows,
  downloadFile,
  driveScroll,
  heapMB,
  measureJumps,
  mean,
  ms,
  nextFrame,
  nf,
  percentile,
  reduceCase,
  sleep,
  sortNum,
  stamp,
  toCsv,
  toJson,
  toMarkdown,
  type AbortFlag,
  type BaselineResult,
  type CaseResult,
  type EnvInfo,
  type ScrollSurface,
  type SweepConfig,
} from './benchmark.harness';
import { enhanceSelect } from './benchmark.dropdown';
import { drawBaseline, drawComplexity, drawScaling, drawTimeline } from './benchmark.charts';
import { SWEEP_KEYS, TEMPLATES, TEMPLATE_GROUPS, TEMPLATE_KEYS, templateFootprint } from './benchmark.templates';
import { METHOD_HTML } from './benchmark.method';

type Mode = 'scale' | 'complexity';
type View = 'table' | 'timeline' | 'chart' | 'baseline';

const SIZES = [1000, 10000, 100000, 1000000, 10000000];
/** Refuse to build a control group past this many estimated DOM nodes. */
const BASELINE_NODE_CEILING = 2_000_000;
const BACKGROUND_MSG =
  'This tab is in the background. Browsers suspend animation frames for hidden tabs, ' +
  'so nothing can be measured. Bring the page to the front and press Run again.';

/**
 * Performance benchmark for the Angular wrapper.
 *
 * Unlike the vanilla build, which drives the engine directly, this measures the
 * `ceriousScroll` directive: every row is an Angular template instance rendered
 * through real change detection, so the numbers include Angular's own work. The
 * control group is the same rows rendered with a plain `@for` and no
 * virtualiser, which is the comparison an Angular developer actually faces.
 *
 * The measurement loops run OUTSIDE the Angular zone. Awaiting inside a zone
 * would schedule a change-detection pass per animation frame, which is overhead
 * the benchmark would then be measuring instead of the wrapper.
 */
@Component({
  selector: 'demo-benchmark',
  standalone: true,
  imports: [FormsModule, CeriousScrollDirective, BenchmarkRowComponent],
  // Styles live in the global stylesheet: Angular scopes component styles to
  // their own template, so they would never reach <benchmark-row>.
  templateUrl: './benchmark.component.html',
})
export class BenchmarkComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  @ViewChild(CeriousScrollDirective) private scrollDirective?: CeriousScrollDirective<number>;
  @ViewChild('host') private hostEl?: ElementRef<HTMLElement>;
  @ViewChild('baselineHost') private baselineHostEl?: ElementRef<HTMLElement>;
  @ViewChild('timelineCanvas') private timelineCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('scalingCanvas') private scalingCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('complexityCanvas') private complexityCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('baselineCanvas') private baselineCanvas?: ElementRef<HTMLCanvasElement>;

  /* ---------------------------------------------------------------- state */

  /** Static, author-written copy; not user input, so bypassing is safe here. */
  protected readonly methodHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(METHOD_HTML);

  protected readonly TEMPLATES = TEMPLATES;
  protected readonly TEMPLATE_KEYS = TEMPLATE_KEYS;
  protected readonly TEMPLATE_GROUPS = TEMPLATE_GROUPS;
  protected readonly SWEEP_KEYS = SWEEP_KEYS;
  protected readonly SIZES = SIZES;
  protected readonly nf = nf;
  protected readonly ms = ms;
  protected readonly RowComponent = BenchmarkRowComponent;

  protected specTotal = 50_000;
  protected specTemplate = 'mixed';
  protected baselineTotal = 0;
  protected baselineTemplate = 'mixed';
  protected baselineRowIndices: number[] = [];

  protected mode: Mode = 'scale';
  protected view: View = 'table';
  protected template = 'mixed';
  protected durationMs = 4000;
  protected velocity = 60;
  protected reps = 5;
  protected sizes: number[] = [1000, 10000, 100000, 1000000];
  protected wantBaseline = true;
  protected cxSize = 1_000_000;
  protected cxDuration = 3000;
  protected cxTemplates: string[] = [...SWEEP_KEYS];

  protected env: EnvInfo | null = null;
  protected scaleRows: CaseResult[] = [];
  protected scaleConfig: SweepConfig | null = null;
  protected cxRows: CaseResult[] = [];
  protected baselineRows: BaselineResult[] = [];
  protected selected = 0;
  protected cxSelected = 0;

  protected running = false;
  protected status = 'Idle. Press Run to start.';
  protected progress = 0;
  protected stageLabel = 'idle';
  protected stageLive = false;

  private abort: AbortFlag = { aborted: false };
  private hiddenAbort = false;
  private renderCalls = 0;

  protected readonly identity = (index: number): number => index;
  protected readonly scrollOptions = {
    keyboard: { enabled: false },
    wheel: { enabled: true },
    touch: { enabled: true },
  };

  /* -------------------------------------------------------------- getters */

  protected get envRows(): [string, string][] {
    const e = this.env;
    if (!e) return [];
    return [
      ['Browser', e.browser],
      ['Platform', e.platform],
      ['Logical cores', e.cores ? String(e.cores) : 'not exposed'],
      ['Device memory', e.deviceMemoryGB ? `${e.deviceMemoryGB} GB` : 'not exposed'],
      ['Device pixel ratio', `${e.dpr}\u00d7`],
      ['Window', `${e.viewport} px`],
      ['Scroll surface', `${e.surface} px`],
      ['Measured refresh rate', `${e.refreshHz} Hz`],
      ['Frame budget', `${e.frameBudgetMs.toFixed(1)} ms`],
      ['Heap API', e.heapApi ? 'available (Chromium)' : 'unavailable in this browser'],
      ['Wrapper', e.wrapper],
    ];
  }

  protected get budget(): number { return this.env?.frameBudgetMs ?? 16.7; }
  protected get activeRows(): CaseResult[] { return this.mode === 'scale' ? this.scaleRows : this.cxRows; }
  protected get timelineRow(): CaseResult | null {
    return this.mode === 'scale'
      ? (this.scaleRows[this.selected] ?? null)
      : (this.cxRows[this.cxSelected] ?? null);
  }
  protected get hasResults(): boolean { return this.scaleRows.length > 0 || this.cxRows.length > 0; }
  protected get views(): View[] {
    return this.mode === 'scale'
      ? ['table', 'timeline', 'chart', 'baseline']
      : ['table', 'timeline', 'chart'];
  }

  protected viewLabel(v: View): string {
    return v === 'table' ? 'Table'
      : v === 'timeline' ? 'Frame timeline'
      : v === 'chart' ? 'Cost curve'
      : 'vs. baseline';
  }

  protected footprint(key: string): number {
    return templateFootprint(key, BenchmarkRowComponent, this.injector, this.appRef);
  }

  /* ------------------------------------------------------------- lifecycle */

  private readonly onVisibility = (): void => {
    if (!this.running || document.visibilityState !== 'hidden') return;
    this.abort.aborted = true;
    this.hiddenAbort = true;
    this.status = 'Stopping: the tab went into the background, so the remaining frames would be meaningless.';
    this.cdr.detectChanges();
  };
  private readonly onResize = (): void => this.redraw();

  ngOnInit(): void {
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('resize', this.onResize);
  }

  /**
   * Same DOM listbox the vanilla page uses, so the control is identical on every
   * platform. Re-run when the mode switches, since that swaps the whole config
   * block for a different set of selects.
   */
  private enhanceDropdowns(): void {
    document
      .querySelectorAll<HTMLSelectElement>('.ctl select:not(.dd__native)')
      .forEach(enhanceSelect);
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.enhanceDropdowns());
    // Deliberately not in ngOnInit: @ViewChild is not resolved yet there, so the
    // environment block would report the scroll surface as "unknown".
    this.zone.runOutsideAngular(() => {
      void collectEnv(this.hostEl?.nativeElement ?? null).then((e) => {
        this.env = e;
        this.cdr.detectChanges();
      });
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('resize', this.onResize);
  }

  /* ---------------------------------------------------------------- charts */

  protected setView(v: View): void {
    this.view = v;
    // The canvases live inside @switch blocks, so the newly selected one does
    // not exist in the DOM until change detection has rendered it. Materialise
    // the view first: a queued microtask runs BEFORE that pass, leaving
    // @ViewChild undefined (or pointing at a canvas that was just removed) and
    // the chart silently never draws.
    this.cdr.detectChanges();
    this.redraw();
  }

  protected setMode(m: Mode): void {
    if (this.running) return;
    this.mode = m;
    if (m !== 'scale' && this.view === 'baseline') this.view = 'table';
    this.cdr.detectChanges();
    this.enhanceDropdowns();
    this.redraw();
  }

  /**
   * Mount the live surface with whatever template is selected, so you can see
   * what you picked before spending a run on it. Matches the vanilla page.
   */
  protected previewTemplate(key: string): void {
    if (this.running) return;
    this.specTotal = 50_000;
    this.specTemplate = key;
    this.stageLabel = `${TEMPLATES[key].label} · 50,000 rows · scroll me`;
  }

  protected selectRow(i: number): void {
    if (this.mode === 'scale') this.selected = i;
    else this.cxSelected = i;
    this.cdr.detectChanges();
    this.redraw();
  }

  private redraw(): void {
    if (this.view === 'timeline') {
      drawTimeline(this.timelineCanvas?.nativeElement ?? null, this.timelineRow, this.budget);
    } else if (this.view === 'chart') {
      if (this.mode === 'scale') drawScaling(this.scalingCanvas?.nativeElement ?? null, this.scaleRows);
      else drawComplexity(this.complexityCanvas?.nativeElement ?? null, this.cxRows);
    } else if (this.view === 'baseline') {
      drawBaseline(this.baselineCanvas?.nativeElement ?? null, this.baselineRows, this.scaleRows);
    }
  }

  /* ------------------------------------------------------------- surfaces */

  private contentEl(): HTMLElement | null {
    return this.hostEl?.nativeElement.querySelector<HTMLElement>('[data-cerious-scroll-content]') ?? null;
  }

  /** The wrapper directive, presented to the harness as a ScrollSurface. */
  private wrapperSurface(): ScrollSurface {
    return {
      scroll: (delta) => {
        const s = this.scrollDirective?.scroller;
        if (s) s.scroll(delta, this.hostEl?.nativeElement.clientHeight ?? 0);
      },
      // render() runs the engine's viewport pass and commits the row views,
      // so this call carries Angular's rendering cost.
      paint: () => {
        this.scrollDirective?.render();
      },
      percentage: () => {
        try {
          return this.scrollDirective?.scroller?.calculateScrollPercentage() ?? 0;
        } catch {
          return 0;
        }
      },
      jumpTo: (index) => {
        this.scrollDirective?.jumpToElement(index);
        void this.hostEl?.nativeElement.offsetHeight;
      },
      nodes: () => this.contentEl()?.querySelectorAll('*').length ?? 0,
      rows: () => this.contentEl()?.children.length ?? 0,
      medianRowHeight: () => {
        const el = this.contentEl();
        if (!el) return NaN;
        const hs = Array.from(el.children)
          .map((n) => (n as HTMLElement).offsetHeight)
          .filter((h) => h > 0);
        return hs.length ? percentile(sortNum(hs), 50) : NaN;
      },
      renderCalls: () => this.renderCalls,
      resetRenderCalls: () => { this.renderCalls = 0; },
    };
  }

  /** Called from the row template, so invocations can be counted per frame. */
  protected countRender(index: number): number {
    this.renderCalls++;
    return index;
  }

  private setStatus(text: string, progress?: number): void {
    this.status = text;
    if (progress !== undefined) this.progress = progress;
    this.cdr.detectChanges();
  }

  private setStage(label: string, live: boolean): void {
    this.stageLabel = label;
    this.stageLive = live;
    this.cdr.detectChanges();
  }

  /* ----------------------------------------------------------- measurement */

  private async measureCase(
    total: number,
    templateKey: string,
    cfg: { durationMs: number; velocity: number; reps: number; jumpSamples: number },
    environment: EnvInfo,
    label: string,
    base: number,
    span: number,
  ): Promise<CaseResult | null> {
    const surface = this.wrapperSurface();
    const at = (f: number) => (this.progress = base + span * f);

    this.setStage(`${label} · mount ×${cfg.reps}`, true);
    this.setStatus(`${label}: measuring mount…`, base + span * 0.05);

    const mountTimes: number[] = [];
    for (let r = 0; r < cfg.reps && !this.abort.aborted; r++) {
      const t0 = performance.now();
      this.specTotal = total;
      this.specTemplate = templateKey;
      this.cdr.detectChanges();
      this.scrollDirective?.recalculate();
      await nextFrame();
      mountTimes.push(performance.now() - t0);
    }
    if (this.abort.aborted) return null;

    this.setStage(`${label} · warm-up`, true);
    this.setStatus(`${label}: warming up…`, base + span * 0.2);
    await driveScroll(surface, Math.min(700, cfg.durationMs / 2), cfg.velocity, false, this.abort);

    const heapBefore = heapMB();
    const rowHeightPx = surface.medianRowHeight();

    this.setStage(`${label} · sustained scroll @ ${cfg.velocity} px/frame`, true);
    this.setStatus(`${label}: sustained scroll for ${cfg.durationMs / 1000}s…`, base + span * 0.3);
    surface.resetRenderCalls?.();
    const res = await driveScroll(surface, cfg.durationMs, cfg.velocity, true, this.abort);
    const calls = surface.renderCalls?.() ?? 0;
    if (this.abort.aborted) return null;

    const domNodes = surface.nodes();
    const domRows = surface.rows();

    this.setStage(`${label} · random access ×${cfg.jumpSamples}`, true);
    this.setStatus(`${label}: random-access seeks…`, base + span * 0.75);
    const jumpTimes = await measureJumps(surface, total, cfg.jumpSamples, this.abort);

    at(1);
    this.setStatus(`${label}: done.`);

    const heapAfter = heapMB();
    return reduceCase({
      total,
      template: templateKey,
      templateLabel: TEMPLATES[templateKey].label,
      nodesPerRow: this.footprint(templateKey),
      rowHeightPx,
      mountTimes,
      intervals: res.intervals,
      work: res.work,
      jumpTimes,
      renderCalls: calls,
      domNodes,
      domRows,
      heapMB: Number.isFinite(heapAfter) ? heapAfter : heapBefore,
      frameBudgetMs: environment.frameBudgetMs,
    });
  }

  /** The unvirtualized control group: every row rendered with a plain `@for`. */
  private async measureBaselineCase(
    total: number,
    templateKey: string,
    cfg: { durationMs: number; velocity: number; jumpSamples: number },
    environment: EnvInfo,
    label: string,
  ): Promise<BaselineResult> {
    const nodesPerRow = this.footprint(templateKey);
    const estimatedNodes = total * (nodesPerRow + 1);
    const base: BaselineResult = { total, template: templateKey, nodesPerRow, estimatedNodes, status: 'ok' };

    if (estimatedNodes > BASELINE_NODE_CEILING) {
      this.setStatus(
        `${label}: unvirtualized baseline refused, ${nf.format(estimatedNodes)} nodes would exhaust the tab.`,
      );
      return {
        ...base,
        status: 'refused',
        note:
          `Would need about ${nf.format(estimatedNodes)} DOM nodes, and Angular would have to create ` +
          'a view for every one. Not attempted: the tab would run out of memory.',
      };
    }

    this.setStage(`${label} · unvirtualized · rendering every row`, true);
    this.setStatus(`${label}: rendering every row without a virtualiser…`);
    await nextFrame();

    const t0 = performance.now();
    this.baselineTotal = total;
    this.baselineTemplate = templateKey;
    this.baselineRowIndices = Array.from({ length: total }, (_, i) => i);
    this.cdr.detectChanges();
    const host = this.baselineHostEl?.nativeElement ?? null;
    void host?.offsetHeight;
    const mountMs = performance.now() - t0;
    await nextFrame();

    const list = host?.firstElementChild as HTMLElement | null;
    const surface: ScrollSurface = {
      scroll: (delta) => { if (host) host.scrollTop += delta; },
      paint: () => {},
      percentage: () => {
        if (!host) return 100;
        const range = host.scrollHeight - host.clientHeight;
        return range > 0 ? (host.scrollTop / range) * 100 : 100;
      },
      jumpTo: (index) => {
        const child = list?.children[Math.min(index, (list?.children.length ?? 1) - 1)] as HTMLElement | undefined;
        if (child && host) host.scrollTop = child.offsetTop;
        void host?.offsetHeight;
      },
      nodes: () => list?.querySelectorAll('*').length ?? 0,
      rows: () => list?.children.length ?? 0,
      medianRowHeight: () => NaN,
    };

    await driveScroll(surface, Math.min(700, cfg.durationMs / 2), cfg.velocity, false, this.abort);
    this.setStage(`${label} · unvirtualized · sustained scroll`, true);
    this.setStatus(`${label}: scrolling the unvirtualized baseline…`);
    const { intervals } = await driveScroll(surface, cfg.durationMs, cfg.velocity, true, this.abort);
    const domNodes = surface.nodes();
    const domRows = surface.rows();
    const jumpTimes = await measureJumps(surface, total, cfg.jumpSamples, this.abort);

    const iv = sortNum(intervals);
    const jt = sortNum(jumpTimes);
    const janked = intervals.filter((v) => v > environment.frameBudgetMs * 1.5).length;
    const heap = heapMB();

    this.baselineRowIndices = [];
    this.baselineTotal = 0;
    this.cdr.detectChanges();
    await nextFrame();

    return {
      ...base,
      status: 'ok',
      mountMs,
      rowsMounted: domRows,
      fps: intervals.length ? 1000 / mean(intervals) : NaN,
      frameIntervalP50: percentile(iv, 50),
      frameIntervalP95: percentile(iv, 95),
      worstFrameMs: iv.length ? iv[iv.length - 1] : NaN,
      jankPct: intervals.length ? (janked / intervals.length) * 100 : NaN,
      frameCount: intervals.length,
      jumpP50: percentile(jt, 50),
      jumpP95: percentile(jt, 95),
      domNodes,
      domRows,
      heapMB: heap,
    };
  }

  /* ------------------------------------------------------------------ runs */

  private guardHidden(): boolean {
    if (document.visibilityState === 'hidden') {
      this.setStatus(BACKGROUND_MSG, 0);
      return true;
    }
    return false;
  }

  protected run(): void {
    if (this.mode === 'scale') void this.runScaleSweep();
    else void this.runComplexitySweep();
  }

  protected stop(): void {
    this.abort.aborted = true;
    this.setStatus('Stopping after the current phase…');
  }

  private async runScaleSweep(): Promise<void> {
    if (this.running || !this.sizes.length || this.guardHidden()) return;
    this.abort = { aborted: false };
    this.hiddenAbort = false;
    this.running = true;
    this.baselineRows = [];
    this.setStatus('Calibrating display…', 1);

    await this.zone.runOutsideAngular(async () => {
      const environment = this.env ?? (await collectEnv(this.hostEl?.nativeElement ?? null));
      this.env = environment;

      const cfg: SweepConfig = {
        templateKey: this.template,
        templateLabel: TEMPLATES[this.template].label,
        scrollSampleMs: this.durationMs,
        velocityPxPerFrame: this.velocity,
        mountReps: this.reps,
        jumpSamples: 40,
        baseline: this.wantBaseline,
      };
      this.scaleConfig = cfg;

      const collected: CaseResult[] = [];
      const collectedBaseline: BaselineResult[] = [];
      const list = [...this.sizes].sort((a, b) => a - b);
      const perSize = 100 / list.length;

      for (let i = 0; i < list.length && !this.abort.aborted; i++) {
        const total = list[i];
        const label = `${nf.format(total)} rows`;
        const row = await this.measureCase(
          total, this.template,
          { durationMs: this.durationMs, velocity: this.velocity, reps: this.reps, jumpSamples: 40 },
          environment, label, i * perSize, perSize,
        );
        if (!row) break;
        collected.push(row);
        this.scaleRows = [...collected];
        this.cdr.detectChanges();
        this.redraw();

        if (this.wantBaseline && !this.abort.aborted) {
          const b = await this.measureBaselineCase(
            total, this.template,
            { durationMs: this.durationMs, velocity: this.velocity, jumpSamples: 30 },
            environment, label,
          );
          collectedBaseline.push(b);
          this.baselineRows = [...collectedBaseline];
          this.cdr.detectChanges();
          this.redraw();
        }
        await sleep(80);
      }

      this.running = false;
      this.stageLive = false;
      const lastTotal = collected[collected.length - 1]?.total ?? 50_000;
      this.specTotal = lastTotal;
      this.stageLabel = `${this.abort.aborted ? 'stopped' : 'complete'} · ${nf.format(lastTotal)} rows · scroll me`;
      this.setStatus(
        this.hiddenAbort
          ? `Stopped after ${collected.length} of ${list.length} sizes: the tab was backgrounded mid-run.`
          : this.abort.aborted
            ? `Stopped after ${collected.length} of ${list.length} sizes.`
            : `Complete. ${collected.length} dataset size${collected.length === 1 ? '' : 's'} measured with the "${TEMPLATES[this.template].label}" template.`,
        100,
      );
      this.cdr.detectChanges();
      this.redraw();
    });
  }

  private async runComplexitySweep(): Promise<void> {
    if (this.running || !this.cxTemplates.length || this.guardHidden()) return;
    this.abort = { aborted: false };
    this.hiddenAbort = false;
    this.running = true;
    this.setStatus('Calibrating display…', 1);

    await this.zone.runOutsideAngular(async () => {
      const environment = this.env ?? (await collectEnv(this.hostEl?.nativeElement ?? null));
      this.env = environment;

      const collected: CaseResult[] = [];
      const keys = SWEEP_KEYS.filter((k) => this.cxTemplates.includes(k));
      const span = 100 / keys.length;

      for (let i = 0; i < keys.length && !this.abort.aborted; i++) {
        const key = keys[i];
        const row = await this.measureCase(
          this.cxSize, key,
          { durationMs: this.cxDuration, velocity: this.velocity, reps: 3, jumpSamples: 30 },
          environment, TEMPLATES[key].label, i * span, span,
        );
        if (!row) break;
        collected.push(row);
        this.cxRows = [...collected];
        this.cdr.detectChanges();
        this.redraw();
        await sleep(80);
      }

      this.running = false;
      this.stageLive = false;
      const heaviest = collected.reduce(
        (a, b) => (b.nodesPerRow > a.nodesPerRow ? b : a),
        collected[0],
      );
      if (heaviest) {
        this.specTotal = this.cxSize;
        this.specTemplate = heaviest.template;
        this.stageLabel = `${heaviest.templateLabel} · ${nf.format(this.cxSize)} rows · scroll me`;
      }
      this.setStatus(
        this.abort.aborted
          ? `Stopped after ${collected.length} of ${keys.length} templates.`
          : `Complete. ${collected.length} row template${collected.length === 1 ? '' : 's'} measured at ${nf.format(this.cxSize)} rows.`,
        100,
      );
      this.cdr.detectChanges();
      this.redraw();
    });
  }

  /* ---------------------------------------------------------------- export */

  private payload() {
    return {
      env: this.env,
      scaleSweep:
        this.scaleConfig && this.scaleRows.length
          ? { config: this.scaleConfig, rows: this.scaleRows }
          : null,
      complexitySweep: this.cxRows.length ? { datasetSize: this.cxSize, rows: this.cxRows } : null,
      unvirtualizedBaseline: this.baselineRows.length
        ? { note: BASELINE_NOTE, nodeCeiling: BASELINE_NODE_CEILING, buildBudgetMs: 0, rows: this.baselineRows }
        : null,
    };
  }

  protected exportMarkdown(): void { void this.copy(toMarkdown(this.payload()), `${stamp()}.md`, 'text/markdown'); }
  protected exportJsonCopy(): void { void this.copy(toJson(this.payload()), `${stamp()}.json`, 'application/json'); }
  protected exportJson(): void { downloadFile(`${stamp()}.json`, toJson(this.payload()), 'application/json'); }
  protected exportCsv(): void { downloadFile(`${stamp()}.csv`, toCsv(this.payload()), 'text/csv'); }

  private async copy(text: string, filename: string, mime: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.setStatus('Copied to clipboard.');
    } catch {
      // Clipboard access can be denied outright; hand the results over as a
      // file rather than losing them.
      downloadFile(filename, text, mime);
      this.setStatus('Clipboard blocked, downloaded instead.');
    }
  }

  /* --------------------------------------------------------------- helpers */

  protected readonly isFinite = Number.isFinite;
  protected readonly round = Math.round;

  protected cls(value: number, good: number, warn: number): string {
    return !Number.isFinite(value) ? 'muted' : value <= good ? 'g' : value <= warn ? 'w' : 'b';
  }
  protected ratioLabel(a: number | undefined, b: number | undefined): string {
    if (!Number.isFinite(a as number) || !Number.isFinite(b as number) || (a as number) <= 0) return '';
    const r = (b as number) / (a as number);
    return r >= 100 ? `${Math.round(r)}×` : `${r.toFixed(1)}×`;
  }
  protected ratioBig(a: number | undefined, b: number | undefined): boolean {
    if (!Number.isFinite(a as number) || !Number.isFinite(b as number) || (a as number) <= 0) return false;
    return (b as number) / (a as number) >= 10;
  }
  protected virtFor(total: number): CaseResult | undefined {
    return this.scaleRows.find((x) => x.total === total);
  }

  protected toggleSize(n: number): void {
    this.sizes = this.sizes.includes(n) ? this.sizes.filter((v) => v !== n) : [...this.sizes, n];
  }
  protected toggleCxTemplate(k: string): void {
    this.cxTemplates = this.cxTemplates.includes(k)
      ? this.cxTemplates.filter((v) => v !== k)
      : [...this.cxTemplates, k];
  }

  protected get tiles(): { k: string; v: string; unit: string; sub: string; hero: boolean }[] | null {
    if (this.mode === 'scale') {
      const rows = this.scaleRows;
      if (!rows.length) return null;
      const biggest = rows[rows.length - 1];
      const spread = rows.map((r) => r.domNodes);
      const domMin = Math.min(...spread);
      const domMax = Math.max(...spread);
      const list = [
        { k: 'Largest dataset', v: compactRows(biggest.total), unit: '', sub: `${nf.format(biggest.total)} rows navigable`, hero: true },
        { k: 'Frame cost', v: ms(biggest.frameWorkP50), unit: 'ms', sub: `p95 ${ms(biggest.frameWorkP95)} ms · budget ${this.budget.toFixed(1)} ms`, hero: false },
        { k: 'Sustained FPS', v: String(Math.round(biggest.fps)), unit: 'fps', sub: `${nf.format(biggest.frameCount)} frames · ${ms(biggest.jankPct, 1)}% janked`, hero: false },
        { k: 'Random seek', v: ms(biggest.jumpP95), unit: 'ms', sub: 'p95 over 40 seeks', hero: false },
        { k: 'DOM nodes', v: nf.format(biggest.domNodes), unit: '', sub: domMin === domMax ? 'constant across every size' : `${nf.format(domMin)} to ${nf.format(domMax)}`, hero: false },
        { k: 'JS heap', v: Number.isFinite(biggest.heapMB) ? ms(biggest.heapMB, 1) : 'n/a', unit: Number.isFinite(biggest.heapMB) ? 'MB' : '', sub: Number.isFinite(biggest.heapMB) ? 'whole page, post-run' : 'Chromium only', hero: false },
      ];
      const failed = this.baselineRows.filter((b) => b.status !== 'ok');
      if (failed.length) {
        const first = failed.reduce((a, b) => (b.total < a.total ? b : a), failed[0]);
        list.push({ k: 'Baseline fails at', v: compactRows(first.total), unit: 'rows', sub: `unvirtualized needs ~${nf.format(first.estimatedNodes)} nodes`, hero: false });
      }
      return list;
    }
    const rows = this.cxRows;
    if (!rows.length) return null;
    const heaviest = rows.reduce((a, b) => (b.nodesPerRow > a.nodesPerRow ? b : a), rows[0]);
    const lightest = rows.reduce((a, b) => (b.nodesPerRow < a.nodesPerRow ? b : a), rows[0]);
    const worst = rows.reduce((a, b) => (b.frameWorkP50 > a.frameWorkP50 ? b : a), rows[0]);
    const peak = rows.reduce((a, b) => (b.rendersPerFrame > a.rendersPerFrame ? b : a), rows[0]);
    const climb = lightest.usPerRender > 0 ? heaviest.usPerRender / lightest.usPerRender : NaN;
    return [
      { k: 'Heaviest row', v: nf.format(heaviest.nodesPerRow), unit: 'nodes/row', sub: `${heaviest.templateLabel} at ${compactRows(heaviest.total)} rows`, hero: true },
      { k: 'Frame cost', v: ms(heaviest.frameWorkP50), unit: 'ms', sub: `p95 ${ms(heaviest.frameWorkP95)} ms · budget ${this.budget.toFixed(1)} ms`, hero: false },
      { k: 'Worst frame cost', v: ms(worst.frameWorkP50), unit: 'ms', sub: `on ${worst.templateLabel}`, hero: false },
      { k: 'Build cost climb', v: Number.isFinite(climb) ? climb.toFixed(1) : '—', unit: '×', sub: `${ms(lightest.usPerRender, 0)} µs to ${ms(heaviest.usPerRender, 0)} µs per row`, hero: false },
      { k: 'Renders / frame', v: ms(peak.rendersPerFrame), unit: '', sub: `peak, on ${peak.templateLabel}`, hero: false },
      { k: 'Live nodes', v: nf.format(heaviest.domNodes), unit: '', sub: `${nf.format(heaviest.domRows)} rows at ${compactRows(heaviest.total)}`, hero: false },
    ];
  }
}
