import type { JsonHttp } from '../domain/integration/JsonHttp';
import { NotFound } from '../domain/integration/NotFound';
import type { Outcome } from '../domain/integration/Outcome';
import { Succeeded } from '../domain/integration/Succeeded';
import { Unavailable } from '../domain/integration/Unavailable';
import type { PackEntry } from '../foodCatalog/PackEntry';
import { offCandidate } from './offCandidate';
import type { OnlineFoodSource } from './OnlineFoodSource';
import { onlineEntryOf } from './onlineEntryOf';
import { OnlineSourceRule } from './OnlineSourceRule';
import { RequestSpacing } from './RequestSpacing';

/**
 * Open Food Facts over its public API (MM-58): one product by barcode, or a
 * name search when the person asks for one. Requests are spaced as its
 * etiquette asks and carry the app's User-Agent; the barcode or the words
 * are all that is sent.
 */
export class OpenFoodFactsSource implements OnlineFoodSource {
  readonly id = 'off';
  private readonly http: JsonHttp;
  private readonly products: RequestSpacing;
  private readonly searches: RequestSpacing;

  constructor({ http, spacing }: { http: JsonHttp; spacing?: { now?: () => number; wait?: (ms: number) => Promise<void> } }) {
    this.http = http;
    this.products = new RequestSpacing(OnlineSourceRule.openFoodFacts.productSpacingMs, spacing);
    this.searches = new RequestSpacing(OnlineSourceRule.openFoodFacts.searchSpacingMs, spacing);
  }

  private get headers() {
    return { 'User-Agent': OnlineSourceRule.userAgent };
  }

  async byBarcode(gtin14: string): Promise<Outcome<PackEntry>> {
    // Open Food Facts keys products by the code as printed, without a GTIN-14's leading zeros.
    const code = gtin14.replace(/^0+(?=\d{8})/, '');
    const url = new URL(`${OnlineSourceRule.openFoodFacts.product}${code}.json`);
    url.searchParams.set('fields', OnlineSourceRule.openFoodFacts.fields);
    await this.products.turn();
    let response;
    try {
      response = await this.http.getJson(url, { headers: this.headers });
    } catch (error) {
      return new Unavailable(error instanceof Error ? error.message : 'Open Food Facts could not be reached.');
    }
    if (response.statusCode === 404) return new NotFound();
    if (response.statusCode !== 200) return new Unavailable(`Open Food Facts answered ${response.statusCode}.`);
    const body = response.body as { status?: unknown; product?: unknown } | undefined;
    if (body?.status === 0 || body?.product === undefined) return new NotFound();
    const candidate = offCandidate(body.product);
    const entry = candidate === undefined ? undefined : onlineEntryOf(candidate);
    // A product that is there but fails the nutrition checks is not offered (MM-53).
    return entry === undefined ? new NotFound() : new Succeeded(entry);
  }

  async search(query: string, { limit = OnlineSourceRule.searchLimit }: { limit?: number } = {}): Promise<Outcome<PackEntry[]>> {
    const words = query.trim();
    if (words === '') return new Succeeded([]);
    const url = new URL(OnlineSourceRule.openFoodFacts.search);
    url.searchParams.set('search_terms', words);
    url.searchParams.set('search_simple', '1');
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page_size', String(limit));
    url.searchParams.set('fields', OnlineSourceRule.openFoodFacts.fields);
    // United States products first: the launch market (MM-51), and where the label figures mean what the app expects.
    url.searchParams.set('tagtype_0', 'countries');
    url.searchParams.set('tag_contains_0', 'contains');
    url.searchParams.set('tag_0', 'united-states');
    await this.searches.turn();
    let response;
    try {
      response = await this.http.getJson(url, { headers: this.headers });
    } catch (error) {
      return new Unavailable(error instanceof Error ? error.message : 'Open Food Facts could not be reached.');
    }
    if (response.statusCode !== 200) return new Unavailable(`Open Food Facts answered ${response.statusCode}.`);
    const products = (response.body as { products?: unknown } | undefined)?.products;
    if (!Array.isArray(products)) return new Succeeded([]);
    const entries: PackEntry[] = [];
    for (const product of products) {
      const candidate = offCandidate(product);
      const entry = candidate === undefined ? undefined : onlineEntryOf(candidate);
      if (entry !== undefined) entries.push(entry);
    }
    return new Succeeded(entries.slice(0, limit));
  }
}
