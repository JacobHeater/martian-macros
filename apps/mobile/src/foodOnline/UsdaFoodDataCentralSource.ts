import { normalizeBarcode } from '../domain/food/normalizeBarcode';
import type { JsonHttp } from '../domain/integration/JsonHttp';
import { NotFound } from '../domain/integration/NotFound';
import type { Outcome } from '../domain/integration/Outcome';
import { Succeeded } from '../domain/integration/Succeeded';
import { Unavailable } from '../domain/integration/Unavailable';
import type { PackEntry } from '../foodCatalog/PackEntry';
import { fdcCandidate } from './fdcCandidate';
import type { OnlineFoodSource } from './OnlineFoodSource';
import { onlineEntryOf } from './onlineEntryOf';
import { OnlineSourceRule } from './OnlineSourceRule';
import { RequestSpacing } from './RequestSpacing';

/**
 * USDA FoodData Central over its public API (MM-58), which needs a key the
 * build is given (`MM_FDC_API_KEY`; a build without one has no such source).
 * A barcode is looked up as a search of the Branded foods for its digits and
 * matched exactly; a name search asks every data type. The key travels in
 * the address as the service requires; only the digits or words besides.
 */
export class UsdaFoodDataCentralSource implements OnlineFoodSource {
  readonly id = 'fdc';
  private readonly http: JsonHttp;
  private readonly apiKey: string;
  private readonly spacing: RequestSpacing;

  constructor({
    http,
    apiKey,
    spacing,
  }: {
    http: JsonHttp;
    apiKey: string;
    spacing?: { now?: () => number; wait?: (ms: number) => Promise<void> };
  }) {
    this.http = http;
    this.apiKey = apiKey;
    this.spacing = new RequestSpacing(OnlineSourceRule.foodDataCentral.spacingMs, spacing);
  }

  private async ask(params: Record<string, string>): Promise<Outcome<unknown[]>> {
    const url = new URL(OnlineSourceRule.foodDataCentral.search);
    url.searchParams.set('api_key', this.apiKey);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    await this.spacing.turn();
    let response;
    try {
      response = await this.http.getJson(url);
    } catch (error) {
      return new Unavailable(error instanceof Error ? error.message : 'FoodData Central could not be reached.');
    }
    if (response.statusCode !== 200) return new Unavailable(`FoodData Central answered ${response.statusCode}.`);
    const foods = (response.body as { foods?: unknown } | undefined)?.foods;
    return new Succeeded(Array.isArray(foods) ? foods : []);
  }

  async byBarcode(gtin14: string): Promise<Outcome<PackEntry>> {
    // Branded records keep the code as printed, mostly 12 digits: search for those and match on the normalized form.
    const digits = gtin14.replace(/^0+(?=\d{8})/, '');
    const answer = await this.ask({ query: digits, dataType: 'Branded', pageSize: '10' });
    if (answer.kind !== 'succeeded') return answer;
    for (const food of answer.value) {
      const candidate = fdcCandidate(food);
      if (candidate?.rawBarcode === undefined || normalizeBarcode(candidate.rawBarcode) !== gtin14) continue;
      const entry = onlineEntryOf(candidate);
      if (entry !== undefined) return new Succeeded(entry);
    }
    return new NotFound();
  }

  async search(query: string, { limit = OnlineSourceRule.searchLimit }: { limit?: number } = {}): Promise<Outcome<PackEntry[]>> {
    const words = query.trim();
    if (words === '') return new Succeeded([]);
    const answer = await this.ask({ query: words, pageSize: String(limit) });
    if (answer.kind !== 'succeeded') return answer;
    const entries: PackEntry[] = [];
    for (const food of answer.value) {
      const candidate = fdcCandidate(food);
      const entry = candidate === undefined ? undefined : onlineEntryOf(candidate);
      if (entry !== undefined) entries.push(entry);
    }
    return new Succeeded(entries.slice(0, limit));
  }
}
