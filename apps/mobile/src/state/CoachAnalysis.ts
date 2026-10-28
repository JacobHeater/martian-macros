import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { IntakeDay } from '../domain/IntakeDay';
import type { WaterEntry } from '../domain/water/WaterEntry';
import type { CoachAdviceGiven } from '../engine/analysis/accountability/CoachAdviceGiven';
import { coachAdviceGivenOf } from '../engine/analysis/accountability/coachAdviceGivenOf';
import { coachFollowUpsOf } from '../engine/analysis/accountability/coachFollowUpsOf';
import { CoachFollowUpRule } from '../engine/analysis/accountability/CoachFollowUpRule';
import { withCoachFollowUps } from '../engine/analysis/accountability/withCoachFollowUps';
import type { AnalysisArea } from '../engine/analysis/AnalysisArea';
import type { AnalysisSpan } from '../engine/analysis/AnalysisSpan';
import { arrangeCoachFindings } from '../engine/analysis/arrangeCoachFindings';
import { analyseTrainingSpan } from '../engine/analysis/analyseTrainingSpan';
import { canonicalTrendSpan } from '../engine/analysis/canonicalTrendSpan';
import type { CoachFinding } from '../engine/analysis/CoachFinding';
import type { CoachSpanEvaluation } from '../engine/analysis/CoachSpanEvaluation';
import { coachTrendSteps } from '../engine/analysis/coachTrendSteps';
import type { DashboardInsight } from '../engine/analysis/DashboardInsight';
import type { ExecutiveBrief } from '../engine/analysis/ExecutiveBrief';
import { executiveBriefOf } from '../engine/analysis/executiveBriefOf';
import { foldTrainingProtein } from '../engine/analysis/foldTrainingProtein';
import { analyseFoodDay } from '../engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../engine/analysis/food/analyseFoodSpan';
import type { FoodAnalysisInput } from '../engine/analysis/food/FoodAnalysisInput';
import { foodSpanAnalysisOf } from '../engine/analysis/food/foodSpanAnalysisOf';
import { FoodSignalRule } from '../engine/analysis/food/FoodSignalRule';
import type { FoodSpanAnalysis } from '../engine/analysis/food/FoodSpanAnalysis';
import { selectDashboardInsight } from '../engine/analysis/selectDashboardInsight';
import { supportedAnalysisSpans } from '../engine/analysis/supportedAnalysisSpans';
import type { TradeCatalog } from '../engine/analysis/TradeCatalog';
import type { TrainingAnalysisInput } from '../engine/analysis/TrainingAnalysisInput';
import type { UnjudgedArea } from '../engine/analysis/UnjudgedArea';
import { unjudgedTrainingAreas } from '../engine/analysis/unjudgedTrainingAreas';
import { hasHardSet } from '../engine/hasHardSet';
import type { FindingDismissal } from '../engine/trends/FindingDismissal';
import type { TrendAnnouncement } from '../engine/trends/TrendAnnouncement';
import { TrendRule } from '../engine/trends/TrendRule';
import type { TrendSpan } from '../engine/trends/TrendSpan';
import type { TrendTransition } from '../engine/trends/TrendTransition';
import { usableIntakeDays } from '../engine/usableIntakeDays';
import { withoutPausedDays } from '../engine/withoutPausedDays';
import { ArgumentError } from '../lang/ArgumentError';
import type { Watched } from '../lang/Watched';
import { CatalogTradeCatalog } from './CatalogTradeCatalog';
import type { Cell } from './Cell';
import type { CoachAnalysisInputs } from './CoachAnalysisInputs';
import type { CoachAnalysisView } from './CoachAnalysisView';
import { DerivedCell } from './DerivedCell';
import { Loadable } from './Loadable';
import { StreamCell } from './StreamCell';
import { ValueCell } from './ValueCell';

/**
 * The days of food read: 3m's 90 days, the trend engine's 28 days before
 * them (`TrendRule.baselineLookbackDays`), and today.
 */
const foodWindowDays = 90 + TrendRule.baselineLookbackDays + 1;

/** The water read: the training signals' 14 days before yesterday, with room. */
const waterWindowDays = 30;

/** One value now, never asked again. */
const just = <T>(value: T): Watched<T> => ({
  subscribe: (listener) => {
    listener(value);
    return () => undefined;
  },
});

/** Runs an analysis, treating figures it refuses (an `ArgumentError`) as nothing to say, as the inline insights do. */
const safely = <T>(analyse: () => T[]): T[] => {
  try {
    return analyse();
  } catch (error) {
    if (error instanceof ArgumentError) return [];
    throw error;
  }
};

/** The food analysis of a span with its exits, or nothing to say, as `safely`. */
const safelyRead = (analyse: () => FoodSpanAnalysis): FoodSpanAnalysis => {
  try {
    return analyse();
  } catch (error) {
    if (error instanceof ArgumentError) return { findings: [], unresolved: new Set() };
    throw error;
  }
};

/** Whether a stream is still on its first read: not in, and not failed. */
const stillReading = (loadable: Loadable<unknown>): boolean => !loadable.ready && !Loadable.hasFailed(loadable);

/** The section's state's reading of the app's cells, shared by the span chosen and the canonical span. */
interface AnalysisRead {
  readonly today: CalendarDate;
  readonly entries: readonly FoodEntry[];
  /** The fully logged days before today, by epoch day. */
  readonly wholeDays: ReadonlySet<number>;
  /** The spans the trend engine's coverage rule supports (`supportedAnalysisSpans`): the canonical span is chosen from these. */
  readonly spans: readonly AnalysisSpan[];
  /** The spans the switcher offers: those, with 7d once anything is logged (MM-621). */
  readonly offered: readonly AnalysisSpan[];
  /** The food analysis's input, the trade catalog left out. */
  readonly food: FoodAnalysisInput;
  /** The training analysis's input, once everything it reads is in. */
  readonly training: TrainingAnalysisInput | undefined;
  readonly water: readonly WaterEntry[] | undefined;
}

/** The canonical span's analysis as of E (yesterday), E−1 and E−2 (MM-605); no span while only today is supported. */
interface CanonicalRead {
  readonly span: TrendSpan | undefined;
  readonly evaluations: readonly CoachSpanEvaluation[];
}

/**
 * "What your data says" on the Coach tab (MM-610), as state: the span
 * chosen, the spans the data supports, and the findings of the chosen span
 * placed in their lists (`view`). Worked out again whenever what it reads
 * changes, and only while something watches it; nothing is cached across
 * a change. The trade catalog (MM-607) is read ahead in the background
 * and fed in once ready, and read again when the catalog foods logged
 * change. A dismissal goes to the trend log (MM-605).
 *
 * The same analysis feeds the announcement log and the Dashboard's card
 * (MM-605, MM-610). Once a day, the first evaluation after yesterday has
 * closed (`keepAnnouncing`), the canonical span (`canonicalTrendSpan`: 2w,
 * else the longest supported span of at most 30 days) is analysed as of E,
 * E−1 and E−2, and what MM-605's state machine says to append
 * (`coachTrendSteps`) is appended, in the order the analysis ranks it.
 * 1d is never logged (MM-612). The card (`dashboard`) is the top said
 * finding of that span under MM-141's ration, or a catalog rule the
 * analysis has no equivalent of (`selectDashboardInsight`).
 *
 * The coach keeps a record of the advice it showed (MM-617): while the tab
 * shows the section (`keepRecording`), each order about a food is recorded
 * the first time it is shown on a day, 1d and spans alike. 1d reads the
 * record back for its follow-ups (`coachFollowUpsOf`, `withCoachFollowUps`),
 * and reads the minutes of the day from the app's clock (`nowMinute`).
 */
export class CoachAnalysis {
  /** The span chosen on the switcher: 1d unless chosen, and 1d again each time the tab opens (`open`). Not kept. */
  readonly span = new ValueCell<AnalysisSpan>(1);

  /** The spans offered (1d always; 7d once anything is logged, MM-621); the switcher shows once any span past 1d is among them. */
  readonly spans: Cell<readonly AnalysisSpan[]>;

  /** The section's content for the span chosen; undefined while what it rests on is read. */
  readonly view: Cell<CoachAnalysisView | undefined>;

  /** What the Dashboard's insight card shows (MM-610), or undefined: nothing, or still being read. */
  readonly dashboard: Cell<DashboardInsight | undefined>;

  /** Deterministic pre-calculated executive summary brief for today and the last 7 days (MM-663). */
  readonly executiveBrief: Cell<ExecutiveBrief | undefined>;

  /** The food analysis input with the trade catalog resolved, for on-demand meal breakdowns (MM-666). */
  readonly foodInput: Cell<FoodAnalysisInput | undefined>;

  private readonly inputs: CoachAnalysisInputs;
  private readonly entries: StreamCell<FoodEntry[]>;
  private readonly intakeDays: StreamCell<IntakeDay[]>;
  private readonly water: StreamCell<WaterEntry[]>;
  private readonly dismissals: StreamCell<FindingDismissal[]>;
  private readonly announcements: StreamCell<TrendAnnouncement[]>;
  /** The coach's record of the advice it showed, as far back as its follow-ups read (MM-617). */
  private readonly given: StreamCell<CoachAdviceGiven[]>;
  private readonly catalogEntries: Cell<readonly FoodEntry[] | undefined>;
  private readonly tradeCatalog: StreamCell<TradeCatalog | undefined>;
  private readonly read: Cell<AnalysisRead | undefined>;
  private readonly canonical: Cell<CanonicalRead | undefined>;
  /** The entries the state machine says to append for E, ranked; undefined while what they rest on is read. */
  private readonly pending: Cell<readonly TrendAnnouncement[] | undefined>;

  /** The fixes' ids in the order last shown, per span, so a finding that still holds keeps its place. */
  private readonly orders = new Map<AnalysisSpan, readonly string[]>();

  constructor(inputs: CoachAnalysisInputs) {
    this.inputs = inputs;
    const today = () => inputs.today.value;
    this.entries = new StreamCell(() => inputs.food.watchFoodBetween(today().addDays(-foodWindowDays), today()));
    this.intakeDays = new StreamCell(() => inputs.intake.watchIntakeDays({ since: today().addDays(-foodWindowDays) }));
    this.water = new StreamCell(() => inputs.water.watchWaterSince(today().addDays(-waterWindowDays)));
    this.dismissals = new StreamCell(() => inputs.trendLog.watchFindingDismissals());
    this.announcements = new StreamCell(() => inputs.trendLog.watchTrendAnnouncements());
    this.given = new StreamCell(() => inputs.adviceRecord.watchAdviceGivenSince(today().addDays(-CoachFollowUpRule.saidBeforeDays)));

    // One entry per catalog food logged, the same list while that set is the same, so the catalog is not read again on every log.
    let lastKey: string | undefined;
    let last: readonly FoodEntry[] = [];
    this.catalogEntries = new DerivedCell(() => {
      const entries = Loadable.valueOf(this.entries.value);
      if (entries === undefined) return undefined;
      const byOrigin = new Map<string, FoodEntry>();
      for (const entry of entries) {
        const origin = entry.portion?.origin;
        if (origin === undefined || origin.packId === 'custom') continue;
        const key = `${origin.packId}:${origin.foodId}`;
        if (!byOrigin.has(key)) byOrigin.set(key, entry);
      }
      const key = [...byOrigin.keys()].sort().join('|');
      if (key !== lastKey) {
        lastKey = key;
        last = [...byOrigin.values()];
      }
      return last;
    });

    this.tradeCatalog = new StreamCell<TradeCatalog | undefined>(() => {
      const catalog = inputs.catalog();
      const entries = this.catalogEntries.value;
      if (catalog === undefined || entries === undefined || entries.length === 0) return just(undefined);
      return {
        subscribe: (listener) => {
          let stopped = false;
          CatalogTradeCatalog.load(catalog, entries).then(
            (loaded) => {
              if (!stopped) listener(loaded);
            },
            // No catalog food is offered then; the person's own foods still are.
            () => {
              if (!stopped) listener(undefined);
            },
          );
          return () => {
            stopped = true;
          };
        },
      };
    });

    this.read = new DerivedCell(() => this.readCells());
    this.foodInput = new DerivedCell(() => {
      const read = this.read.value;
      if (read === undefined) return undefined;
      return { ...read.food, catalog: Loadable.valueOf(this.tradeCatalog.value) };
    });
    this.executiveBrief = new DerivedCell(() => {
      const read = this.read.value;
      const food = this.foodInput.value;
      if (read === undefined || food === undefined) return undefined;
      return executiveBriefOf(food, read.today);
    });
    this.view = new DerivedCell(() => this.work());
    this.spans = new DerivedCell<readonly AnalysisSpan[]>(() => this.view.value?.spans ?? [1]);
    this.canonical = new DerivedCell(() => this.readCanonical());
    this.pending = new DerivedCell(() => this.steps());
    this.dashboard = new DerivedCell(() => this.card());
  }

  /** The tab opened: the analysis starts on 1d, today. */
  open(): void {
    this.span.put(1);
  }

  /** Chooses a span on the switcher. */
  choose(span: AnalysisSpan): void {
    this.span.put(span);
  }

  /**
   * The Dashboard's card was pressed: the section opens on the canonical
   * span, where its finding is, when the Coach tab opens next.
   */
  openCanonical(): void {
    const span = this.canonical.peek()?.span;
    if (span !== undefined) this.span.put(span);
  }

  /**
   * Appends to the announcement log once a day for as long as the app is
   * open (MM-605): the first evaluation of the canonical span once
   * everything it reads is in, and again only when the day changes. A key
   * already entered for E is never entered again (`coachTrendSteps`), so
   * opening the app twice in a day appends nothing the second time. Gives
   * the way to stop.
   */
  keepAnnouncing(): () => void {
    let stopDay: (() => void) | undefined;
    const stopToday = this.inputs.today.subscribe(() => {
      stopDay?.();
      let finished = false;
      const stop = this.pending.subscribe((entries) => {
        if (finished || entries === undefined) return;
        finished = true;
        // A write that fails is tried again the next time the app opens.
        if (entries.length > 0) void this.inputs.trendLog.appendTrendAnnouncements(entries).catch(() => undefined);
        // Stops watching once the day is evaluated, so later logs do not re-evaluate it.
        queueMicrotask(() => {
          if (stopDay === stop) {
            stop();
            stopDay = undefined;
          }
        });
      });
      stopDay = stop;
    });
    return () => {
      stopToday();
      stopDay?.();
      stopDay = undefined;
    };
  }

  /**
   * Records the advice the section shows (MM-617) for as long as it is
   * shown: each order about a food to skip, halve or swap, and each advice
   * taken said, once a day (`coachAdviceGivenOf`), on whatever span is
   * chosen. The record keeps one for each food, kind and day, so showing it
   * again changes nothing. A write that fails is tried again on the next
   * view. Gives the way to stop.
   */
  keepRecording(): () => void {
    const written = new Set<string>();
    return this.view.subscribe((view) => {
      if (view === undefined) return;
      const today = this.inputs.today.peek();
      const { worthChanging, holdingUp, more, left, close } = view.sections;
      const shown = [...worthChanging, ...holdingUp, ...more, ...(left === undefined ? [] : [left]), ...(close === undefined ? [] : [close])];
      const idOf = (g: CoachAdviceGiven) => `${g.on.epochDay}\u0000${g.kind}\u0000${g.foodKey}`;
      const fresh = coachAdviceGivenOf(shown, today).filter((g) => !written.has(idOf(g)));
      if (fresh.length === 0) return;
      for (const g of fresh) written.add(idOf(g));
      void this.inputs.adviceRecord.recordAdviceGiven(fresh).catch(() => {
        for (const g of fresh) written.delete(idOf(g));
      });
    });
  }

  /** Dismisses a finding: hidden for 28 days, and counted under "hidden" with the day it shows again. */
  dismiss(findingId: string): Promise<void> {
    return this.inputs.trendLog.dismissFinding(findingId, this.inputs.today.peek());
  }

  /** What every analysis here reads, from the app's cells; undefined while any is still being read. */
  private readCells(): AnalysisRead | undefined {
    const inputs = this.inputs;
    const today = inputs.today.value;
    const entries = Loadable.valueOf(this.entries.value);
    const logged = Loadable.valueOf(this.intakeDays.value);
    const pauses = inputs.pauses();
    const base = inputs.foodInput();
    if (entries === undefined || logged === undefined || pauses === undefined || base === undefined) return undefined;
    const plannedShare = inputs.plannedShare();
    const intake = withoutPausedDays(logged, pauses, { keepComplete: false });
    const whole = usableIntakeDays(
      intake.filter((d) => d.date.isBefore(today)),
      { plannedShare },
    );
    const wholeDays = new Set(whole.map((d) => d.date.epochDay));
    let firstEntryOn: CalendarDate | undefined;
    for (const e of entries) if (firstEntryOn === undefined || e.date.isBefore(firstEntryOn)) firstEntryOn = e.date;
    const spans = supportedAnalysisSpans({ firstEntryOn, wholeDays, today });
    // 7d is the last 7 days, today included, read from whatever is logged in them: no coverage rule (the owner, MM-621).
    const offered: AnalysisSpan[] = entries.length > 0 && !spans.includes(7) ? [1, 7, ...spans.slice(1)] : spans;
    const training = inputs.trainingInput();
    const water = Loadable.valueOf(this.water.value);
    const wholeForTraining = inputs.wholeDays();
    return {
      today,
      entries,
      wholeDays,
      spans,
      offered,
      // Foods snoozed inline are never an X or a Y of a trade (MM-378, MM-607).
      food: { ...base, entries, intake, plannedShare, catalog: undefined, snoozed: inputs.snoozed() },
      training:
        training !== undefined && water !== undefined && wholeForTraining !== undefined
          ? { ...training, water, wholeDays: wholeForTraining }
          : undefined,
      water,
    };
  }

  /** The canonical span's analysis as of E, E−1 and E−2, once training is read too; trades only as of E. */
  private readCanonical(): CanonicalRead | undefined {
    const read = this.read.value;
    if (read === undefined || read.training === undefined) return undefined;
    const span = canonicalTrendSpan(read.spans);
    if (span === undefined) return { span, evaluations: [] };
    const e = read.today.addDays(-1);
    const withCatalog: FoodAnalysisInput = { ...read.food, catalog: Loadable.valueOf(this.tradeCatalog.value) };
    const training = read.training;
    const evaluate = (asOf: CalendarDate, food: FoodAnalysisInput): CoachSpanEvaluation => {
      const analysed = safelyRead(() => foodSpanAnalysisOf(food, span, asOf));
      const trained = safely(() => analyseTrainingSpan(training, span, asOf));
      const from = asOf.addDays(1 - span);
      const recentFrom = asOf.addDays(1 - TrendRule.heldRecentDays);
      let whole = 0;
      let recent = 0;
      for (let date = from; !date.isAfter(asOf); date = date.addDays(1)) {
        if (!read.wholeDays.has(date.epochDay)) continue;
        whole++;
        if (!date.isBefore(recentFrom)) recent++;
      }
      const enough = Math.max(FoodSignalRule.minimumJudgedDays, Math.ceil(TrendRule.coverageMinimum * span - 1e-9));
      return {
        span,
        asOf,
        findings: foldTrainingProtein([...analysed.findings, ...trained]),
        held: whole < enough || recent < TrendRule.heldRecentMinimum,
        unresolved: analysed.unresolved,
      };
    };
    return { span, evaluations: [evaluate(e, withCatalog), evaluate(e.addDays(-1), read.food), evaluate(e.addDays(-2), read.food)] };
  }

  /** What the state machine says to append for E, in the order the analysis ranks the keys (MM-605). */
  private steps(): readonly TrendAnnouncement[] | undefined {
    const canonical = this.canonical.value;
    const log = Loadable.valueOf(this.announcements.value);
    if (canonical === undefined || log === undefined) return undefined;
    const [e, e1, e2] = canonical.evaluations;
    if (e === undefined || e1 === undefined || e2 === undefined) return [];
    const steps = coachTrendSteps({ log, asOf: e, dayBefore: e1, twoDaysBefore: e2 });
    const transitions = new Map<string, TrendTransition>([...steps].map(([key, step]) => [key, step.transition] as const));
    const ranked = arrangeCoachFindings(e.findings, { today: this.inputs.today.value, transitions });
    const order = [...ranked.worthChanging, ...ranked.more].map((f) => f.id);
    const place = (key: string) => {
      const at = order.indexOf(key);
      return at < 0 ? order.length : at;
    };
    return [...steps.values()]
      .flatMap((step) => (step.append === undefined ? [] : [step.append]))
      .sort((a, b) => place(a.key) - place(b.key));
  }

  /** The Dashboard's card (MM-610): the canonical span's findings as of E, the logs, and the catalog's rules. */
  private card(): DashboardInsight | undefined {
    const rules = this.inputs.insightRules();
    const canonical = this.canonical.value;
    const log = Loadable.valueOf(this.announcements.value);
    const dismissals = Loadable.valueOf(this.dismissals.value);
    if (rules === undefined || canonical === undefined || log === undefined || dismissals === undefined) return undefined;
    // While coaching is paused, or was within the fortnight, the card says nothing (MM-148).
    if (rules.paused) return undefined;
    const today = this.inputs.today.value;
    const e = canonical.evaluations[0];
    let findings: CoachFinding[] = [];
    if (e !== undefined) {
      const transitions = new Map<string, TrendTransition>();
      for (const entry of log) if (entry.on === e.asOf) transitions.set(entry.key, entry.transition);
      const sections = arrangeCoachFindings(e.findings, { today, dismissals, transitions });
      findings = [...sections.worthChanging, ...sections.more, ...sections.holdingUp];
    }
    return selectDashboardInsight({ today, findings, announcements: log, rules: rules.candidates, insightLog: rules.log, dismissals });
  }

  private work(): CoachAnalysisView | undefined {
    const inputs = this.inputs;
    const read = this.read.value;
    if (read === undefined) return undefined;
    // The trend log is read on every span, 1d too, so it is in by the time a span is chosen. Until its first read
    // the view waits: arranged without it, the fixes would be drawn once out of order (the log's transitions rank
    // them, MM-605) and a dismissed finding would show for a moment. A read that failed ranks and hides nothing.
    const announced = this.announcements.value;
    const dismissed = this.dismissals.value;
    // The record of advice shown is waited for too, so 1d's follow-ups do not arrive a moment after the rest.
    const given = this.given.value;
    if (stillReading(announced) || stillReading(dismissed) || stillReading(given)) return undefined;
    const { today, entries } = read;
    const spans = read.offered;
    const chosen = this.span.value;
    // A span the data no longer supports (an entry deleted) falls back to today.
    const span: AnalysisSpan = spans.includes(chosen) ? chosen : 1;
    const foodInput: FoodAnalysisInput = { ...read.food, catalog: Loadable.valueOf(this.tradeCatalog.value) };
    const { holds: underEating, noticeShown: underEatingNoticeShown } = inputs.underEating();
    const dismissals = Loadable.valueOf(dismissed) ?? [];

    let findings: CoachFinding[];
    let unjudged: UnjudgedArea[] = [];
    const checked: AnalysisArea[] = [];
    let from: CalendarDate;
    let to: CalendarDate;
    let fullyLoggedDays = 0;
    const transitions = new Map<string, TrendTransition>();
    if (span === 1) {
      from = today;
      to = today;
      // The evening fiber line (MM-617) comes by the clock, not only once dinner is logged.
      const day = safely(() => analyseFoodDay(foodInput, today, { nowMinute: inputs.nowMinute() }));
      // The coach's follow-ups on its own record (MM-617); a record that failed to read follows up on nothing.
      const followUps = safely(() => coachFollowUpsOf({ food: foodInput, given: Loadable.valueOf(given) ?? [], today }));
      findings = withCoachFollowUps(day, followUps, today);
      if (entries.some((e) => e.date === today)) checked.push('food');
    } else {
      // 7d ends today (MM-621); the longer spans end yesterday, as MM-605's detectors read whole days.
      to = span === 7 ? today : today.addDays(-1);
      from = to.addDays(1 - span);
      const within = (date: CalendarDate) => !date.isBefore(from) && !date.isAfter(to);
      // 7d counts every day logged, today and partial days too (MM-621); the longer spans their fully logged days.
      const counted = (date: CalendarDate) =>
        span === 7 ? entries.some((e) => e.date === date) : read.wholeDays.has(date.epochDay);
      for (let date = from; !date.isAfter(to); date = date.addDays(1)) if (counted(date)) fullyLoggedDays++;
      findings = safely(() => analyseFoodSpan(foodInput, span, to, { everyLoggedDay: span === 7 }));
      if (entries.some((e) => within(e.date))) checked.push('food');
      const trainingInput = read.training;
      const water = read.water;
      if (trainingInput !== undefined && water !== undefined) {
        findings = [...findings, ...safely(() => analyseTrainingSpan(trainingInput, span, to))];
        unjudged = unjudgedTrainingAreas(trainingInput, span, to);
        if (trainingInput.workouts.some((w) => !w.inProgress && within(w.date) && hasHardSet(w))) checked.push('training');
        if (water.some((e) => within(e.date))) checked.push('water');
      }
      // The state machine's word on each key as of yesterday (MM-605): the canonical span's log, read for every span.
      for (const entry of Loadable.valueOf(announced) ?? []) {
        if (entry.on === today.addDays(-1)) transitions.set(entry.key, entry.transition);
      }
    }

    const sections = arrangeCoachFindings(findings, {
      today,
      dismissals,
      transitions,
      previousOrder: this.orders.get(span) ?? [],
      uncapped: span === 1,
    });
    this.orders.set(
      span,
      [...sections.worthChanging, ...sections.more].filter((f) => f.kind === 'fix').map((f) => f.id),
    );
    return {
      span,
      spans,
      from,
      to,
      fullyLoggedDays,
      nothingLogged: entries.length === 0,
      underEating,
      underEatingNoticeShown,
      sections,
      unjudged,
      checked,
    };
  }
}
