import { expect, it } from 'vitest';
import { disagreementReason } from '../../src/foodCatalog/disagreementReason';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { CandidateFood } from '../../src/foodPipeline/CandidateFood';
import { MostRecentPolicy } from '../../src/foodPipeline/MostRecentPolicy';
import { PackBuilder } from '../../src/foodPipeline/PackBuilder';
import { ReliabilityPolicy } from '../../src/foodPipeline/ReliabilityPolicy';

/**
 * MM-383: a third source (FNDDS), the reliability policy for a shared
 * barcode, one name one food among generic foods, the build gate for a
 * source that gives nothing, and the coverage rows per pack and source.
 */
const gtin = FixturePack.gtin14('0000100000011');

const generic = (source: string, id: string, name: string, extras: { fiber?: number; sodium?: number; micros?: Record<string, number> } = {}) =>
  new CandidateFood({
    source,
    sourceId: id,
    kind: 'generic',
    name,
    kcal: 100,
    proteinG: 5,
    carbsG: 10,
    fatG: 4.4,
    fiberG: extras.fiber,
    sodiumMg: extras.sodium,
    micros: extras.micros ?? {},
  });

const product = (source: string, id: string, { kcal = 100, fat = 4.4, updatedAt = 0, version = 0 }: { kcal?: number; fat?: number; updatedAt?: number; version?: number } = {}) =>
  new CandidateFood({
    source,
    sourceId: id,
    kind: 'barcode',
    name: 'Soup',
    rawBarcode: gtin,
    kcal,
    proteinG: 5,
    carbsG: 10,
    fatG: fat,
    updatedAt,
    versionKey: version,
  });

const build = (foods: readonly CandidateFood[], expectedSources: readonly string[] = []) =>
  new PackBuilder({ policy: new MostRecentPolicy({ tieBreak: 'off' }), expectedSources }).build(foods);

function only(entries: readonly PackEntry[]): PackEntry {
  expect(entries.length).toBe(1);
  return entries[0] as PackEntry;
}

it('an FNDDS food is a reference food with its own sentence', async () => {
  const result = await build([generic('usda_fndds', '1', 'Banana, raw')]);
  const food = only(result.generic).food;
  expect(food.tier).toBe('reference');
  expect(food.tierReason).toBe('Compiled by USDA from analysed foods and recipes for the national dietary survey.');
});

it('a source the pipeline does not know fails the build, naming it', async () => {
  await expect(build([generic('usda_mystery', '1', 'Egg')])).rejects.toThrow(/Unknown food source "usda_mystery"/);
});

it('one name, one food: the record stating fiber and sodium wins, then the more reliable source, then the tie rule, whatever the order', async () => {
  const full = generic('usda_sr_legacy', 'sr1', 'Carrots, raw', { fiber: 2.8, sodium: 69 });
  const sparse = generic('usda_foundation', 'f1', 'Carrots, raw');
  const fndds = generic('usda_fndds', 'n1', ' carrots,  RAW ', { fiber: 2.8, sodium: 69 });
  for (const order of [
    [full, sparse, fndds],
    [fndds, sparse, full],
    [sparse, fndds, full],
  ]) {
    const result = await build(order);
    expect(result.generic.map((e) => `${e.food.source}/${e.food.sourceId}`)).toEqual(['usda_sr_legacy/sr1']);
    expect(result.report.dropped.get('usda_foundation')?.get('lostDuplicateName')).toBe(1);
    expect(result.report.dropped.get('usda_fndds')?.get('lostDuplicateName')).toBe(1);
    expect(result.report.reconciles).toBe(true);
  }
  const both = await build([generic('usda_fndds', 'n1', 'Peas, raw', { fiber: 5, sodium: 5 }), generic('usda_foundation', 'f1', 'Peas, raw', { fiber: 5, sodium: 5 })]);
  expect(only(both.generic).food.source).toBe('usda_foundation');
  const same = await build([generic('usda_sr_legacy', 'b', 'Kale, raw'), generic('usda_sr_legacy', 'a', 'Kale, raw')]);
  expect(only(same.generic).food.sourceId).toBe('a');
});

it('a duplicate winner that states fewer of the grade’s inputs than its loser is counted in the report', async () => {
  const winner = generic('usda_foundation', 'f1', 'Spinach, raw', { fiber: 2.2, sodium: 79 });
  const loser = generic('usda_sr_legacy', 'sr1', 'Spinach, raw', { fiber: 2.2, sodium: 79, micros: { potassium: 558, calcium: 99, iron: 2.7 } });
  const result = await build([winner, loser], ['usda_foundation', 'usda_sr_legacy']);
  expect(only(result.generic).food.source).toBe('usda_foundation');
  expect(result.report.duplicateWinnersSparser).toBe(1);
  expect(result.report.format()).toContain("duplicate winners stating fewer of the grade's inputs than their loser: 1");
});

it('a dropped duplicate is never a raw or cooked pair’s target', async () => {
  const result = await build([
    generic('usda_sr_legacy', '1', 'Chicken breast, raw', { fiber: 0, sodium: 60 }),
    generic('usda_fndds', '2', 'Chicken breast, raw', { fiber: 0, sodium: 60 }),
    generic('usda_sr_legacy', '3', 'Chicken breast, cooked', { fiber: 0, sodium: 70 }),
  ]);
  expect(result.generic.map((e) => e.food.name)).toEqual(['Chicken breast, cooked', 'Chicken breast, raw']);
  expect(result.generic[0]?.food.pairedFoodId).toBe(2);
  expect(result.generic[1]?.food.pairedFoodId).toBe(1);
});

it('an expected source that gives nothing is reported as missing', async () => {
  const result = await build([generic('usda_sr_legacy', '1', 'Egg')], ['usda_sr_legacy', 'usda_fndds']);
  expect(result.report.missingSources).toEqual(['usda_fndds']);
  expect(result.report.format()).toContain('usda_fndds: read 0, written 0, dropped 0  (MISSING: read or wrote nothing)');
  const whole = await build([generic('usda_sr_legacy', '1', 'Egg'), generic('usda_fndds', '2', 'Omelet')], ['usda_sr_legacy', 'usda_fndds']);
  expect(whole.report.missingSources).toEqual([]);
});

it('the coverage file counts per pack and per source, with the rows the grade needs', async () => {
  const result = await build([
    generic('usda_sr_legacy', '1', 'Lentils, cooked', { fiber: 7.9, sodium: 2, micros: { sugars: 1.8, saturatedFat: 0.05, potassium: 369, calcium: 19, iron: 3.3, magnesium: 36 } }),
    generic('usda_fndds', '2', 'Soup, lentil', { fiber: 2 }),
    product('usda_branded', '77'),
  ]);
  const coverage = result.report.formatCoverage();
  expect(coverage).toContain('generic/usda_sr_legacy: 1 foods');
  expect(coverage).toContain('    fiber and sodium: 1 (100%)');
  expect(coverage).toContain('    at least 4 of the 10 vitamins and minerals: 1 (100%)');
  expect(coverage).toContain('    fully gradeable: 1 (100%)');
  expect(coverage).toContain('generic/usda_fndds: 1 foods');
  expect(coverage).toMatch(/generic\/usda_fndds: 1 foods\n(.*\n)*?    sodium_mg: 0 \(0%\)  LOW/);
  expect(coverage).toContain('barcode_us/usda_branded: 1 foods');
});

it('the reliability policy writes the manufacturer’s record over a volunteer’s, and still marks a disagreement', async () => {
  const policy = new ReliabilityPolicy();
  const agree = await new PackBuilder({ policy }).build([product('off', '1', { updatedAt: 9 }), product('usda_branded', '2', { updatedAt: 1 })]);
  expect(only(agree.barcode).food.source).toBe('usda_branded');
  expect(only(agree.barcode).food.tier).toBe('label');
  expect(agree.report.dropped.get('off')?.get('lostConflict')).toBe(1);
  const differ = await new PackBuilder({ policy }).build([product('off', '1', { kcal: 130, fat: 8 }), product('usda_branded', '2')]);
  expect(only(differ.barcode).food.source).toBe('usda_branded');
  expect(only(differ.barcode).food.tier).toBe('checkThis');
  expect(only(differ.barcode).food.tierReason).toBe(disagreementReason);
  // Two records of one source fall to recency.
  const twoBranded = await new PackBuilder({ policy }).build([product('usda_branded', '1', { updatedAt: 1, version: 1 }), product('usda_branded', '2', { updatedAt: 9, version: 2 })]);
  expect(only(twoBranded.barcode).food.sourceId).toBe('2');
});
