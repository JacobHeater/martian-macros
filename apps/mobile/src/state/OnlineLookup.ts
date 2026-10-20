import type { OnlineLookupChoice } from '../domain/food/online/OnlineLookupChoice';
import type { OnlineLookupReader } from '../domain/repositories/OnlineLookupReader';
import type { OnlineLookupWriter } from '../domain/repositories/OnlineLookupWriter';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { OnlineFoodCache } from '../foodCatalog/online/OnlineFoodCache';
import type { PackEntry } from '../foodCatalog/PackEntry';
import { sourceReliability } from '../foodCatalog/sourceReliability';
import type { OnlineFoodSource } from '../foodOnline/OnlineFoodSource';
import type { Cell } from './Cell';
import { Loadable } from './Loadable';
import type { OnlineLookupResult } from './OnlineLookupResult';
import { StreamCell } from './StreamCell';
import { ValueCell } from './ValueCell';

/**
 * Looking a food up online, if the person allows it (MM-58). The choice
 * (ask, always, never) is a preference; "just this once" lives here for the
 * rest of this run of the app. A request goes out only when allowed; every
 * service is asked, each answer passes the nutrition checks, the most
 * reliable source wins (as between packs, MM-383), and what was found is
 * kept on the phone so the next time needs no connection.
 */
export class OnlineLookup {
  private readonly sources: readonly OnlineFoodSource[];
  private readonly cache: OnlineFoodCache;
  private readonly consent: OnlineLookupReader & OnlineLookupWriter;
  private readonly onKept: () => void;

  /** The standing choice. */
  readonly choice: Cell<Loadable<OnlineLookupChoice>>;

  /** Whether "just this once" was chosen in this run of the app. */
  readonly allowedOnce = new ValueCell(false);

  constructor({
    sources,
    cache,
    consent,
    onKept,
  }: {
    sources: readonly OnlineFoodSource[];
    cache: OnlineFoodCache;
    consent: OnlineLookupReader & OnlineLookupWriter;
    onKept?: () => void;
  }) {
    this.sources = sources;
    this.cache = cache;
    this.consent = consent;
    this.onKept = onKept ?? (() => undefined);
    this.choice = new StreamCell(() => consent.watchOnlineLookup());
  }

  /** Whether there is any service to ask: a build without sources never asks. */
  get available(): boolean {
    return this.sources.length > 0;
  }

  /** The services, in words for the question and the sources screen. */
  get sourceIds(): readonly string[] {
    return this.sources.map((s) => s.id);
  }

  /** Whether a request may go out now: always, or once this run. */
  get allowed(): boolean {
    const choice = Loadable.valueOf(this.choice.value);
    return this.available && (choice === 'always' || (choice === 'ask' && this.allowedOnce.value));
  }

  /** Whether the person has to be asked before a request: the choice is still "ask" and nothing was allowed this run. */
  get mustAsk(): boolean {
    return this.available && Loadable.valueOf(this.choice.value) === 'ask' && !this.allowedOnce.value;
  }

  allowOnce(): void {
    this.allowedOnce.put(true);
  }

  choose(choice: OnlineLookupChoice): Promise<void> {
    return this.consent.saveOnlineLookup(choice);
  }

  async byBarcode(gtin14: string): Promise<OnlineLookupResult> {
    if (!this.allowed) return { kind: 'notAllowed' };
    const answers = await Promise.all(this.sources.map((source) => source.byBarcode(gtin14)));
    const found = answers.flatMap((a) => (a.kind === 'succeeded' ? [a.value] : []));
    if (found.length > 0) return { kind: 'found', food: await this.keep(best(found)) };
    return answers.some((a) => a.kind === 'notFound') ? { kind: 'notFound' } : { kind: 'unavailable' };
  }

  /**
   * Foods matching `query` from every service, most reliable first, not yet
   * kept: `keep` the one the person picks. Only the words are sent.
   */
  async search(query: string): Promise<{ kind: 'found'; entries: PackEntry[] } | { kind: 'unavailable' } | { kind: 'notAllowed' }> {
    if (!this.allowed) return { kind: 'notAllowed' };
    const answers = await Promise.all(this.sources.map((source) => source.search(query)));
    const entries = answers.flatMap((a) => (a.kind === 'succeeded' ? a.value : []));
    if (entries.length === 0 && answers.every((a) => a.kind === 'unavailable')) return { kind: 'unavailable' };
    return { kind: 'found', entries: entries.sort((a, b) => sourceReliability(b.food) - sourceReliability(a.food)) };
  }

  /** Keeps a food found online on the phone, and gives it back as the catalog now holds it. */
  async keep(entry: PackEntry): Promise<CatalogFood> {
    const food = await this.cache.remember(entry);
    this.onKept();
    return food;
  }
}

/** The most reliable of several answers for one barcode (MM-383), the first listed on a tie. */
function best(entries: readonly PackEntry[]): PackEntry {
  return entries.reduce((kept, next) => (sourceReliability(next.food) > sourceReliability(kept.food) ? next : kept));
}
