import { describe, expect, it } from 'vitest';
import { InMemoryJsonHttp } from '../../src/fixtures/InMemoryJsonHttp';
import { UsdaFoodDataCentralSource } from '../../src/foodOnline/UsdaFoodDataCentralSource';
import { fdcSearch } from './support/fdcSearch';

/** MM-58: FoodData Central over its API, mapped with the pack build's nutrient ids and source names. */
const noWait = { spacing: { now: () => 0, wait: async () => undefined } };
const gtin = '00737628064502';
const source = (http: InMemoryJsonHttp) => new UsdaFoodDataCentralSource({ http, apiKey: 'test-key', ...noWait });

describe('a product by barcode', () => {
  it('searches the Branded foods for the digits with the key, and matches the code exactly', async () => {
    const http = new InMemoryJsonHttp().answer('foods/search', fdcSearch);
    const answer = await source(http).byBarcode(gtin);
    if (answer.kind !== 'succeeded') throw new Error(answer.kind);
    const url = http.requests[0]!.url;
    expect(url.hostname).toBe('api.nal.usda.gov');
    expect(url.searchParams.get('api_key')).toBe('test-key');
    expect(url.searchParams.get('query')).toBe('737628064502');
    expect(url.searchParams.get('dataType')).toBe('Branded');
    const { food, servings, barcodes } = answer.value;
    expect(food.name).toBe('THAI PEANUT NOODLE KIT INCLUDES STIR-FRY RICE NOODLES & THAI PEANUT SEASONING');
    expect(food.brand).toBe('SIMPLY ASIA');
    expect(food.kcal).toBe(385);
    expect(food.proteinG).toBe(9.62);
    expect(food.carbsG).toBe(71.2);
    expect(food.fatG).toBe(7.69);
    expect(food.fiberG).toBe(1.9);
    expect(food.sodiumMg).toBe(288);
    expect(food.micros.calcium).toBe(38);
    expect(food.micros.sugars).toBe(13.5);
    expect(food.micros.vitaminD).toBe(0);
    expect(food.source).toBe('usda_branded');
    expect(food.sourceId).toBe('2667398');
    expect(food.tier).toBe('label');
    expect(servings).toEqual([{ description: '1/3 PACKAGE', grams: 52 }]);
    expect(barcodes).toEqual([gtin]);
  });

  it('a search that finds other products is NotFound for this barcode', async () => {
    const http = new InMemoryJsonHttp().answer('foods/search', fdcSearch);
    expect((await source(http).byBarcode('00000000000017')).kind).toBe('notFound');
  });

  it('a service that cannot be reached, or refuses the key, is Unavailable', async () => {
    const http = new InMemoryJsonHttp();
    http.offline = true;
    expect((await source(http).byBarcode(gtin)).kind).toBe('unavailable');
    http.offline = false;
    http.answer('foods/search', { error: { code: 'API_KEY_INVALID' } }, 403);
    expect((await source(http).byBarcode(gtin)).kind).toBe('unavailable');
  });
});

describe('a search by words', () => {
  it('asks every data type and names each food by its source', async () => {
    const foundation = {
      fdcId: 171287,
      description: 'Oats, whole grain, rolled, old fashioned',
      dataType: 'Foundation',
      foodNutrients: [
        { nutrientId: 1008, value: 379 },
        { nutrientId: 1003, value: 13.5 },
        { nutrientId: 1005, value: 67.7 },
        { nutrientId: 1004, value: 6.5 },
        { nutrientId: 1079, value: 10.1 },
      ],
    };
    const http = new InMemoryJsonHttp().answer('foods/search', { foods: [foundation, fdcSearch.foods[0]] });
    const answer = await source(http).search('oats');
    if (answer.kind !== 'succeeded') throw new Error(answer.kind);
    expect(http.requests[0]!.url.searchParams.get('query')).toBe('oats');
    expect(http.requests[0]!.url.searchParams.get('dataType')).toBeNull();
    expect(answer.value.map((e) => [e.food.source, e.food.tier])).toEqual([
      ['usda_foundation', 'reference'],
      ['usda_branded', 'label'],
    ]);
    expect(answer.value[0]!.barcodes).toEqual([]);
  });
});
