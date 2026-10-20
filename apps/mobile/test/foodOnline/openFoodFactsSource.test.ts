import { describe, expect, it } from 'vitest';
import { InMemoryJsonHttp } from '../../src/fixtures/InMemoryJsonHttp';
import { OnlineSourceRule } from '../../src/foodOnline/OnlineSourceRule';
import { OpenFoodFactsSource } from '../../src/foodOnline/OpenFoodFactsSource';
import { offProduct } from './support/offProduct';

/**
 * MM-58: Open Food Facts over its API, mapped exactly as the pack build maps
 * its export, requests spaced and named as its etiquette asks.
 */
const noWait = { spacing: { now: () => 0, wait: async () => undefined } };
const gtin = '00737628064502';

describe('a product by barcode', () => {
  it('asks for the code as printed, with the fields it needs, naming the app', async () => {
    const http = new InMemoryJsonHttp().answer('/api/v2/product/737628064502.json', offProduct);
    const source = new OpenFoodFactsSource({ http, ...noWait });
    const answer = await source.byBarcode(gtin);
    expect(answer.kind).toBe('succeeded');
    expect(http.requests.length).toBe(1);
    const request = http.requests[0]!;
    expect(request.url.pathname).toBe('/api/v2/product/737628064502.json');
    expect(request.url.searchParams.get('fields')).toBe(OnlineSourceRule.openFoodFacts.fields);
    expect(request.headers['User-Agent']).toBe(OnlineSourceRule.userAgent);
    expect(request.url.toString()).not.toMatch(/user|account|id=/i);
  });

  it('maps the product as the pack build does: per 100 g, sodium and minerals to milligrams, vitamin A left out', async () => {
    const http = new InMemoryJsonHttp().answer('737628064502', offProduct);
    const answer = await new OpenFoodFactsSource({ http, ...noWait }).byBarcode(gtin);
    if (answer.kind !== 'succeeded') throw new Error(answer.kind);
    const { food, servings, barcodes } = answer.value;
    expect(food.name).toBe('Thai peanut noodle kit includes stir-fry rice noodles & thai peanut seasoning');
    expect(food.brand).toBe('Simply Asia');
    expect(food.kcal).toBe(385);
    expect(food.proteinG).toBe(9.62);
    // Sold in France too, so its carbohydrate may be an EU label's: the US-label rule keeps 71.15 since the energy agrees better with it.
    expect(food.carbsG).toBe(71.15);
    expect(food.fatG).toBe(7.69);
    expect(food.fiberG).toBe(1.9);
    expect(food.sodiumMg).toBeCloseTo(288);
    expect(food.micros.calcium).toBeCloseTo(38);
    expect(food.micros.iron).toBeCloseTo(0.69);
    expect(food.micros.sugars).toBe(13.46);
    expect(food.micros.saturatedFat).toBe(1.92);
    expect(food.micros.cholesterol).toBe(0);
    expect(food.micros.vitaminA, 'not reliably RAE (MM-307)').toBeUndefined();
    expect(food.micros.vitaminC).toBe(0);
    expect(food.source).toBe('off');
    expect(food.sourceId).toBe('0737628064502');
    // Complete and comfortably consistent (385 kcal against about 392 from its macros), changed this year: a label (MM-153).
    expect(food.tier).toBe('label');
    expect(food.tierReason).toMatch(/^Copied from the package by Open Food Facts contributors/);
    expect(food.packId).toBe('online');
    expect(servings, 'the weight in the text goes: it is shown beside it').toEqual([{ description: '1/3 package', grams: 52 }]);
    expect(barcodes).toEqual([gtin]);
  });

  it('a product the service does not know is NotFound, whether by status or by its own flag', async () => {
    const http = new InMemoryJsonHttp().answer('999', { status: 0, status_verbose: 'product not found' });
    const source = new OpenFoodFactsSource({ http, ...noWait });
    expect((await source.byBarcode('00000000000999')).kind).toBe('notFound');
    expect((await source.byBarcode('00000000000017')).kind).toBe('notFound');
  });

  it('a product that fails the nutrition checks is not offered (MM-53)', async () => {
    const broken = JSON.parse(JSON.stringify(offProduct)) as typeof offProduct;
    broken.product.nutriments['energy-kcal_100g'] = 900;
    const http = new InMemoryJsonHttp().answer('737628064502', broken);
    expect((await new OpenFoodFactsSource({ http, ...noWait }).byBarcode(gtin)).kind).toBe('notFound');
  });

  it('no connection, or a busy service, is Unavailable, never an error', async () => {
    const http = new InMemoryJsonHttp();
    http.offline = true;
    const source = new OpenFoodFactsSource({ http, ...noWait });
    expect((await source.byBarcode(gtin)).kind).toBe('unavailable');
    http.offline = false;
    http.answer('737628064502', undefined, 429);
    expect((await source.byBarcode(gtin)).kind).toBe('unavailable');
  });

  it('spaces two product requests as the rate limit asks', async () => {
    let clock = 0;
    const waited: number[] = [];
    const spacing = {
      now: () => clock,
      wait: async (ms: number) => {
        waited.push(ms);
        clock += ms;
      },
    };
    const http = new InMemoryJsonHttp().answer('737628064502', offProduct);
    const source = new OpenFoodFactsSource({ http, spacing });
    await source.byBarcode(gtin);
    await source.byBarcode(gtin);
    expect(waited).toEqual([OnlineSourceRule.openFoodFacts.productSpacingMs]);
  });
});

describe('a search by words', () => {
  it('sends the words only, asks for United States products, and lists what passes the checks', async () => {
    const http = new InMemoryJsonHttp().answer('search.pl', { products: [offProduct.product, { code: '1', product_name: 'No numbers' }] });
    const answer = await new OpenFoodFactsSource({ http, ...noWait }).search('peanut noodle');
    if (answer.kind !== 'succeeded') throw new Error(answer.kind);
    expect(answer.value.map((e) => e.food.name)).toEqual([offProduct.product.product_name]);
    const url = http.requests[0]!.url;
    expect(url.searchParams.get('search_terms')).toBe('peanut noodle');
    expect(url.searchParams.get('tag_0')).toBe('united-states');
    expect(url.searchParams.get('json')).toBe('1');
  });

  it('an empty query asks nothing', async () => {
    const http = new InMemoryJsonHttp();
    const answer = await new OpenFoodFactsSource({ http, ...noWait }).search('   ');
    expect(answer).toMatchObject({ kind: 'succeeded', value: [] });
    expect(http.requests).toEqual([]);
  });
});
