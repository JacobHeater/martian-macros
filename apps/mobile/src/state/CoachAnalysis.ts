import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { IntakeDay } from '../domain/IntakeDay';
import type { WaterEntry } from '../domain/water/WaterEntry';
import type { AnalysisArea } from '../engine/analysis/AnalysisArea';
import type { AnalysisSpan } from '../engine/analysis/AnalysisSpan';
import { arrangeCoachFindings } from '../engine/analysis/arrangeCoachFindings';
import { analyseTrainingSpan } from '../engine/analysis/analyseTrainingSpan';
import type { CoachFinding } from '../engine/analysis/CoachFinding';
import { analyseFoodDay } from '../engine/analysis/food/analyseFoodDay';
import { analyseFoodSpan } from '../engine/analysis/food/analyseFoodSpan';
import type { FoodAnalysisInput } from '../engine/analysis/food/FoodAnalysisInput';
import { supportedAnalysisSpans } from '../engine/analysis/supportedAnalysisSpans';
import type { TradeCatalog } from '../engine/analysis/TradeCatalog';
import type { UnjudgedArea } from '../engine/analysis/UnjudgedArea';
import { unjudgedTrainingAreas } from '../engine/analysis/unjudgedTrainingAreas';
import { hasHardSet } from '../engine/hasHardSet';
import type { FindingDismissal } from '../engine/trends/FindingDismissal';
import type { TrendAnnouncement } from '../engine/trends/TrendAnnouncement';
import { TrendRule } from '../engine/trends/TrendRule';
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
const safely = (analyse: () => CoachFinding[]): CoachFinding[] => {
  try {
    return analyse();
  } catch (error) {
    if (error instanceof ArgumentError) return [];
    throw error;
  }
};

/**
 * "What your data says" on the Coach tab (MM-610), as state: the span
 * chosen, the spans the data supports, and the findings of the chosen span
 * placed in their lists (`view`). Worked out again whenever what it reads
 * changes, and only while something watches it; nothing is cached across
 * a change. The trade catalog (MM-607) is read ahead in the background
 * and fed in once ready, and read again when the catalog foods logged
 * change. A dismissal goes to the trend log (MM-605).
 */
export class CoachAnalysis {
  /** The span chosen on the switcher: 1d unless chosen, and 1d again each time the tab opens (`open`). Not kept. */
  readonly span = new ValueCell<AnalysisSpan>(1);

  /** The spans the data supports (1d always); the switcher shows once 7d is among them. */
  readonly spans: Cell<readonly AnalysisSpan[]>;

  /** The section's content for the span chosen; undefined while what it rests on is read. */
  readonly view: Cell<CoachAnalysisView | undefined>;

  private readonly inputs: CoachAnalysisInputs;
  private readonly entries: StreamCell<FoodEntry[]>;
  private readonly intakeDays: StreamCell<IntakeDay[]>;
  private readonly water: StreamCell<WaterEntry[]>;
  private readonly dismissals: StreamCell<FindingDismissal[]>;
  private readonly announcements: StreamCell<TrendAnnouncement[]>;
  private readonly catalogEntries: Cell<readonly FoodEntry[] | undefined>;
  private readonly tradeCatalog: StreamCell<TradeCatalog | undefined>;

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

    this.view = new DerivedCell(() => this.work());
    this.spans = new DerivedCell<readonly AnalysisSpan[]>(() => this.view.value?.spans ?? [1]);
  }

  /** The tab opened: the analysis starts on 1d, today. */
  open(): void {
    this.span.put(1);
  }

  /** Chooses a span on the switcher. */
  choose(span: AnalysisSpan): void {
    this.span.put(span);
  }

  /** Dismisses a finding: hidden for 28 days, and counted under "hidden" with the day it shows again. */
  dismiss(findingId: string): Promise<void> {
    return this.inputs.trendLog.dismissFinding(findingId, this.inputs.today.peek());
  }

  private work(): CoachAnalysisView | undefined {
    const inputs = this.inputs;
    const today = inputs.today.value;
    const chosen = this.span.value;
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
    // A span the data no longer supports (an entry deleted) falls back to today.
    const span: AnalysisSpan = spans.includes(chosen) ? chosen : 1;

    const foodInput: FoodAnalysisInput = {
      ...base,
      entries,
      intake,
      plannedShare,
      catalog: Loadable.valueOf(this.tradeCatalog.value),
    };
    const { holds: underEating, noticeShown: underEatingNoticeShown } = inputs.underEating();
    const dismissals = Loadable.valueOf(this.dismissals.value) ?? [];

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
      findings = safely(() => analyseFoodDay(foodInput, today));
      if (entries.some((e) => e.date === today)) checked.push('food');
    } else {
      to = today.addDays(-1);
      from = to.addDays(1 - span);
      const within = (date: CalendarDate) => !date.isBefore(from) && !date.isAfter(to);
      fullyLoggedDays = whole.filter((d) => within(d.date)).length;
      findings = safely(() => analyseFoodSpan(foodInput, span, to));
      if (entries.some((e) => within(e.date))) checked.push('food');
      const training = inputs.trainingInput();
      const water = Loadable.valueOf(this.water.value);
      const wholeForTraining = inputs.wholeDays();
      if (training !== undefined && water !== undefined && wholeForTraining !== undefined) {
        const trainingInput = { ...training, water, wholeDays: wholeForTraining };
        findings = [...findings, ...safely(() => analyseTrainingSpan(trainingInput, span, to))];
        unjudged = unjudgedTrainingAreas(trainingInput, span, to);
        if (training.workouts.some((w) => !w.inProgress && within(w.date) && hasHardSet(w))) checked.push('training');
        if (water.some((e) => within(e.date))) checked.push('water');
      }
      // The state machine's word on each key as of yesterday, once the log holds one (MM-605).
      for (const entry of Loadable.valueOf(this.announcements.value) ?? []) {
        if (entry.on === to) transitions.set(entry.key, entry.transition);
      }
    }

    const sections = arrangeCoachFindings(findings, {
      today,
      dismissals,
      transitions,
      previousOrder: this.orders.get(span) ?? [],
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
