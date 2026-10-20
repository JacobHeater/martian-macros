import { describe, expect, it } from 'vitest';
import { Unavailable } from '../../src/domain/integration/Unavailable';
import { InMemoryPreferencesRepository } from '../../src/fixtures/InMemoryPreferencesRepository';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { InMemoryOnlineFoodCache } from '../../src/foodCatalog/online/InMemoryOnlineFoodCache';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { InMemoryOnlineFoodSource } from '../../src/foodOnline/InMemoryOnlineFoodSource';
import { OnlineLookup } from '../../src/state/OnlineLookup';

/**
 * MM-58: nothing is asked online until the person allows it; every source is
 * asked; the most reliable answer wins and is kept on the phone.
 */
const gtin = '00737628064502';
const entry = (source: string, name: string, tier: 'label' | 'checkThis'): PackEntry => ({
  food: new CatalogFood({ id: 0, packId: 'online', name, kcal: 385, proteinG: 9.6, carbsG: 71.2, fatG: 7.7, source, sourceId: name, tier, tierReason: 'test' }),
  servings: [],
  barcodes: [gtin],
});

function lookupWith(sources: InMemoryOnlineFoodSource[]) {
  const cache = new InMemoryOnlineFoodCache();
  const consent = new InMemoryPreferencesRepository();
  let kept = 0;
  const lookup = new OnlineLookup({ sources, cache, consent, onKept: () => kept++ });
  // Watch the choice so the cell reads the preference.
  lookup.choice.subscribe(() => undefined);
  return { lookup, cache, consent, kept: () => kept };
}

describe('consent', () => {
  it('asks first, and until then asks nothing online', async () => {
    const off = new InMemoryOnlineFoodSource('off', [entry('off', 'Noodles', 'checkThis')]);
    const { lookup } = lookupWith([off]);
    await new Promise((r) => setTimeout(r, 0));
    expect(lookup.mustAsk).toBe(true);
    expect(lookup.allowed).toBe(false);
    expect(await lookup.byBarcode(gtin)).toEqual({ kind: 'notAllowed' });
    expect(off.asked).toEqual([]);
  });

  it('never means no request, ever', async () => {
    const off = new InMemoryOnlineFoodSource('off', [entry('off', 'Noodles', 'checkThis')]);
    const { lookup } = lookupWith([off]);
    await lookup.choose('never');
    await new Promise((r) => setTimeout(r, 0));
    expect(lookup.mustAsk).toBe(false);
    expect(lookup.allowed).toBe(false);
    expect(await lookup.byBarcode(gtin)).toEqual({ kind: 'notAllowed' });
    expect(await lookup.search('noodles')).toEqual({ kind: 'notAllowed' });
    expect(off.asked).toEqual([]);
  });

  it('just this once allows this run without changing the choice', async () => {
    const off = new InMemoryOnlineFoodSource('off', [entry('off', 'Noodles', 'checkThis')]);
    const { lookup, consent } = lookupWith([off]);
    await new Promise((r) => setTimeout(r, 0));
    lookup.allowOnce();
    expect(lookup.allowed).toBe(true);
    expect((await lookup.byBarcode(gtin)).kind).toBe('found');
    expect(await new Promise((r) => consent.watchOnlineLookup().subscribe(r))).toBe('ask');
  });

  it('a build with no source never asks and never allows', async () => {
    const { lookup } = lookupWith([]);
    await lookup.choose('always');
    await new Promise((r) => setTimeout(r, 0));
    expect(lookup.available).toBe(false);
    expect(lookup.mustAsk).toBe(false);
    expect(lookup.allowed).toBe(false);
  });
});

describe('a barcode', () => {
  it('asks every source, keeps the most reliable answer, and the catalog is told', async () => {
    const off = new InMemoryOnlineFoodSource('off', [entry('off', 'Noodles (OFF)', 'checkThis')]);
    const fdc = new InMemoryOnlineFoodSource('fdc', [entry('usda_branded', 'NOODLES (USDA)', 'label')]);
    const { lookup, cache, kept } = lookupWith([off, fdc]);
    await lookup.choose('always');
    await new Promise((r) => setTimeout(r, 0));
    const result = await lookup.byBarcode(gtin);
    if (result.kind !== 'found') throw new Error(result.kind);
    expect(result.food.name).toBe('NOODLES (USDA)');
    expect(result.food.packId).toBe('online');
    expect(off.asked).toEqual([gtin]);
    expect(fdc.asked).toEqual([gtin]);
    expect((await cache.byBarcode(gtin))?.name).toBe('NOODLES (USDA)');
    expect(kept()).toBe(1);
  });

  it('not found when a source answered so; unavailable only when none could be reached', async () => {
    const off = new InMemoryOnlineFoodSource('off');
    const fdc = new InMemoryOnlineFoodSource('fdc');
    const { lookup } = lookupWith([off, fdc]);
    await lookup.choose('always');
    await new Promise((r) => setTimeout(r, 0));
    expect(await lookup.byBarcode(gtin)).toEqual({ kind: 'notFound' });
    fdc.failWith(new Unavailable('offline'));
    expect(await lookup.byBarcode(gtin), 'one source still answered').toEqual({ kind: 'notFound' });
    off.failWith(new Unavailable('offline'));
    expect(await lookup.byBarcode(gtin)).toEqual({ kind: 'unavailable' });
  });
});

describe('a search', () => {
  it('lists every source’s foods, most reliable first, and keeps only the one picked', async () => {
    const off = new InMemoryOnlineFoodSource('off', [{ ...entry('off', 'Noodles (OFF)', 'checkThis'), barcodes: [] }]);
    const fdc = new InMemoryOnlineFoodSource('fdc', [{ ...entry('usda_branded', 'NOODLES (USDA)', 'label'), barcodes: [] }]);
    const { lookup, cache } = lookupWith([off, fdc]);
    await lookup.choose('always');
    await new Promise((r) => setTimeout(r, 0));
    const result = await lookup.search('noodles');
    if (result.kind !== 'found') throw new Error(result.kind);
    expect(result.entries.map((e) => e.food.name)).toEqual(['NOODLES (USDA)', 'Noodles (OFF)']);
    expect(await cache.count()).toBe(0);
    const picked = await lookup.keep(result.entries[1]!);
    expect(picked.packId).toBe('online');
    expect(await cache.count()).toBe(1);
  });
});
