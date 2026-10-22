import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CatalogServing } from '../../src/foodCatalog/CatalogServing';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { CandidateFood } from '../../src/foodPipeline/CandidateFood';
import { candidateFromRow } from '../../src/foodPipeline/candidateFromRow';
import { MostRecentPolicy } from '../../src/foodPipeline/MostRecentPolicy';
import { openPackFile } from '../../src/foodPipeline/node/openPackFile';
import { readBuildProvenance } from '../../src/foodPipeline/node/readBuildProvenance';
import { readExtract } from '../../src/foodPipeline/node/readExtract';
import { writePacks } from '../../src/foodPipeline/node/writePacks';
import { PackBuilder } from '../../src/foodPipeline/PackBuilder';
import { packAttribution, packLicense } from '../../src/foodPipeline/packTerms';
import { PreferredSourcePolicy } from '../../src/foodPipeline/PreferredSourcePolicy';
import { FormatError } from '../../src/lang/FormatError';

// Valid GTIN-14s (check digit verified in the domain's barcode tests).
const gtinA = '00042100005264';
const gtinB = FixturePack.gtin14('0000100000011');

interface ProductOptions {
  barcode?: string | undefined;
  name?: string;
  kcal?: number | undefined;
  protein?: number | undefined;
  carbs?: number | undefined;
  fat?: number | undefined;
  version?: number;
  servings?: readonly CatalogServing[];
  updatedAt?: number;
}

function product(source: string, id: string, options: ProductOptions = {}): CandidateFood {
  // A key given as undefined means "missing", so the defaults apply only to keys left out.
  const withDefaults = {
    barcode: '042100005264',
    name: 'Soup',
    kcal: 100,
    protein: 5,
    carbs: 10,
    fat: 4.4,
    version: 0,
    servings: [],
    updatedAt: 0,
    ...options,
  };
  return new CandidateFood({
    source,
    sourceId: id,
    kind: 'barcode',
    name: withDefaults.name,
    rawBarcode: withDefaults.barcode,
    kcal: withDefaults.kcal,
    proteinG: withDefaults.protein,
    carbsG: withDefaults.carbs,
    fatG: withDefaults.fat,
    versionKey: withDefaults.version,
    servings: withDefaults.servings,
    updatedAt: withDefaults.updatedAt,
  });
}

const generic = (id: string, name: string) =>
  new CandidateFood({
    source: 'usda_foundation',
    sourceId: id,
    kind: 'generic',
    name,
    kcal: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
  });

const policy = new PreferredSourcePolicy('off');

const build = (foods: readonly CandidateFood[]) => new PackBuilder({ policy }).build(foods);

function only(entries: readonly PackEntry[]): PackEntry {
  expect(entries.length).toBe(1);
  return entries[0] as PackEntry;
}

const folders: string[] = [];
function tempFolder(): string {
  const dir = mkdtempSync(join(tmpdir(), 'packs-'));
  folders.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of folders.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('most recent policy', () => {
  const recent = new PackBuilder({ policy: new MostRecentPolicy({ tieBreak: 'off' }) });

  it('the fresher of two consistent records wins, from either source', async () => {
    for (const usdaNewer of [false, true]) {
      const result = await recent.build([
        product('usda_branded', 'u', { updatedAt: usdaNewer ? 200 : 100 }),
        product('off', 'o', { updatedAt: usdaNewer ? 100 : 200 }),
      ]);
      expect(only(result.barcode).food.source).toBe(usdaNewer ? 'usda_branded' : 'off');
      const dropped = [...result.report.dropped.values()];
      expect(dropped.length).toBe(1);
      expect(dropped[0]?.get('lostConflict')).toBe(1);
    }
  });

  it('equally recent records go to the tie-break source', async () => {
    const result = await recent.build([
      product('usda_branded', 'u', { updatedAt: 5 }),
      product('off', 'o', { updatedAt: 5 }),
    ]);
    expect(only(result.barcode).food.source).toBe('off');
  });

  it('a fresher record that fails the checks still loses', async () => {
    const result = await recent.build([
      product('usda_branded', 'u', { updatedAt: 1 }),
      product('off', 'o', { updatedAt: 9, kcal: 900, protein: 1, carbs: 1, fat: 1 }),
    ]);
    expect(only(result.barcode).food.source).toBe('usda_branded');
  });

  it('a 10% disagreement is still marked check this', async () => {
    const result = await recent.build([
      product('usda_branded', 'u', { updatedAt: 1 }),
      product('off', 'o', { updatedAt: 9, kcal: 130, fat: 8 }),
    ]);
    expect(only(result.barcode).food.tierReason).toContain('disagree');
  });
});

it('entries failing the nutrition checks are dropped with a reason', async () => {
  const result = await build([
    product('off', '1', { kcal: 690, barcode: gtinA }),
    product('off', '2', { carbs: undefined, barcode: gtinB }),
    product('usda_branded', '3', { name: ' ' }),
  ]);
  const dropped = result.report.dropped;
  expect(dropped.get('off')?.get('energyDisagreesWithMacros')).toBe(1);
  expect(dropped.get('off')?.get('missingValue')).toBe(1);
  expect(dropped.get('usda_branded')?.get('missingName')).toBe(1);
  expect(result.barcode).toEqual([]);
});

it('a missing or invalid barcode drops a product, not a generic food', async () => {
  const result = await build([
    product('off', '1', { barcode: undefined }),
    product('off', '2', { barcode: '042100005265' }), // bad check digit
    generic('9', 'Chicken breast, cooked'),
  ]);
  expect(result.report.dropped.get('off')?.get('invalidBarcode')).toBe(2);
  expect(only(result.generic).food.name).toBe('Chicken breast, cooked');
  expect(only(result.generic).barcodes).toEqual([]);
});

it('every form of a barcode meets the same product', async () => {
  const result = await build([
    product('usda_branded', '1', { barcode: '042100005264', version: 1 }),
    product('off', '2', { barcode: '0042100005264' }),
  ]);
  expect(only(result.barcode).barcodes).toEqual([gtinA]);
});

it('the newest version within a source wins, whatever the order', async () => {
  for (const order of [
    [1, 2, 3],
    [3, 1, 2],
    [2, 3, 1],
  ]) {
    const result = await build(order.map((v) => product('usda_branded', `id${v}`, { version: v, name: `Soup v${v}` })));
    expect(only(result.barcode).food.sourceId, `${order}`).toBe('id3');
    expect(result.report.dropped.get('usda_branded')?.get('supersededVersion')).toBe(2);
  }
});

it('the preferred source wins a shared barcode, and the loser is counted', async () => {
  const result = await build([
    product('usda_branded', 'u', { name: 'USDA soup' }),
    product('off', 'o', { name: 'OFF soup' }),
  ]);
  expect(only(result.barcode).food.source).toBe('off');
  expect(result.report.dropped.get('usda_branded')?.get('lostConflict')).toBe(1);
});

it('records that differ by more than 10% are marked check this', async () => {
  const far = await build([product('usda_branded', 'u', { kcal: 100 }), product('off', 'o', { kcal: 130, fat: 8 })]);
  expect(only(far.barcode).food.tier).toBe('checkThis');
  expect(only(far.barcode).food.tierReason).toContain('disagree');

  const near = await build([product('usda_branded', 'u', { kcal: 100 }), product('off', 'o', { kcal: 102 })]);
  expect(only(near.barcode).food.tier, 'Open Food Facts data is check-this on its own').toBe('checkThis');
  expect(only(near.barcode).food.tierReason).not.toContain('disagree');
});

it('a record that fails the checks never beats one that passes', async () => {
  const result = await build([
    product('usda_branded', 'u'),
    product('off', 'o', { kcal: 900, protein: 1, carbs: 1, fat: 1 }),
  ]);
  expect(only(result.barcode).food.source).toBe('usda_branded');
});

it('every food written says which source and which id it came from', async () => {
  const result = await build([product('usda_branded', '77', { barcode: gtinB }), generic('12', 'Rice, cooked')]);
  for (const entry of [...result.barcode, ...result.generic]) {
    expect(entry.food.source).not.toBe('');
    expect(entry.food.sourceId ?? '').not.toBe('');
  }
  expect(only(result.barcode).food.sourceId).toBe('77');
});

it('servings are carried through', async () => {
  const result = await build([product('usda_branded', '1', { servings: [{ description: '1 cup', grams: 240 }] })]);
  expect(only(result.barcode).servings).toEqual([{ description: '1 cup', grams: 240 }]);
});

it('read equals written plus dropped, and the report says so', async () => {
  const result = await build([
    product('off', '1'),
    product('off', '2', { kcal: 690, barcode: gtinB }),
    product('usda_branded', '3', { version: 1 }),
    product('usda_branded', '4'),
    generic('5', 'Egg'),
    generic('6', ' '),
  ]);
  const report = result.report;
  expect(report.totalRead).toBe(6);
  expect(report.reconciles).toBe(true);
  expect(report.totalWritten + report.totalDropped).toBe(6);
  expect(report.format()).not.toContain('DOES NOT RECONCILE');
});

it('the same candidates in any order build the same packs', async () => {
  const foods: CandidateFood[] = [];
  for (let i = 0; i < 20; i++) {
    foods.push(
      product(i % 2 === 0 ? 'off' : 'usda_branded', `id${i}`, {
        barcode: i < 10 ? '042100005264' : `000001000000${i}`.substring(0, 12),
        name: `Soup ${i}`,
        version: i,
      }),
    );
  }
  foods.push(generic('g1', 'Zucchini'), generic('g2', 'Apple'));
  const a = await build(foods);
  const b = await build([...foods].reverse());
  expect(a.barcode.map((e) => e.food.sourceId)).toEqual(b.barcode.map((e) => e.food.sourceId));
  expect(a.generic.map((e) => e.food.name)).toEqual(['Apple', 'Zucchini']);
  expect(b.generic.map((e) => e.food.name)).toEqual(['Apple', 'Zucchini']);
});

it('written packs are byte-identical across runs and readable', async () => {
  const dir = tempFolder();
  const provenance = { builtOn: '2026-10-09', sources: ['test source 1'] };
  const run = async (name: string) => {
    const out = join(dir, name);
    await writePacks(
      await build([
        product('off', '1'),
        product('usda_branded', '2', { barcode: gtinB }),
        generic('3', 'Chicken breast, cooked'),
      ]),
      provenance,
      out,
    );
    return [readFileSync(join(out, 'generic.pack')), readFileSync(join(out, 'barcode_us.pack'))] as const;
  };

  const first = await run('one');
  const second = await run('two');
  expect(first[0].equals(second[0])).toBe(true);
  expect(first[1].equals(second[1])).toBe(true);

  const pack = await openPackFile(join(dir, 'one', 'barcode_us.pack'));
  expect(pack.header.sources).toEqual(['test source 1']);
  expect(pack.header.builtOn).toBe('2026-10-09');
  expect((await pack.byBarcode(gtinA))?.sourceId).toBe('1');
  await pack.close();
  // Each written pack states its terms and its sources in its header (MM-57's second scenario).
  for (const file of ['generic.pack', 'barcode_us.pack']) {
    const written = await openPackFile(join(dir, 'one', file));
    expect(written.header.license, file).toBe(packLicense);
    expect(written.header.attribution, file).toBe(packAttribution);
    expect(written.header.sources, file).toEqual(provenance.sources);
    await written.close();
  }
  expect(readFileSync(join(dir, 'one', 'report.txt'), 'utf8')).toContain('total: read 3, written 3, dropped 0');
});

it('candidates read from CSV rows keep missing values missing', () => {
  const header = [
    'source',
    'source_id',
    'kind',
    'name',
    'brand',
    'gtin',
    'kcal',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'sodium_mg',
    'alcohol',
    'servings',
    'version_key',
  ];
  const food = candidateFromRow(header, [
    'usda_branded',
    '5',
    'barcode',
    'Soup',
    '',
    '042100005264',
    '100',
    '5',
    '',
    '4',
    '',
    '',
    '',
    '[{"d":"1 cup","g":240.0},{"d":"bad","g":0}]',
    '9',
  ]);
  expect(food.carbsG).toBeUndefined();
  expect(food.brand).toBeUndefined();
  expect(food.versionKey).toBe(9);
  expect(food.servings.map((s) => s.description)).toEqual(['1 cup']);
});

// Added in the move: the two file readers had no test in Dart beyond a real build.
it('an extract folder is read whole: barcode products, then generic foods', async () => {
  const dir = tempFolder();
  const header = 'source,source_id,kind,name,gtin,kcal,protein,carbs,fat,updated_at';
  writeFileSync(join(dir, 'candidates_barcode.csv'), `${header}\noff,o1,barcode,"Soup, tomato",042100005264,100,5,10,4.4,77\n`);
  writeFileSync(join(dir, 'candidates_generic.csv'), `${header}\r\nusda_foundation,g1,generic,Egg,,143,12.6,0.7,9.5,\r\n`);
  const read: CandidateFood[] = [];
  for await (const candidate of readExtract(dir)) read.push(candidate);
  expect(read.map((c) => [c.kind, c.name, c.rawBarcode, c.fatG, c.updatedAt])).toEqual([
    ['barcode', 'Soup, tomato', '042100005264', 4.4, 77],
    ['generic', 'Egg', undefined, 9.5, 0],
  ]);
});

it('provenance is read from its file, and a file that is not provenance is refused', () => {
  const dir = tempFolder();
  writeFileSync(join(dir, 'ok.json'), '{"builtOn":"2026-10-09","sources":["a 1","b 2"]}');
  writeFileSync(join(dir, 'bad.json'), '{"builtOn":20261009}');
  expect(readBuildProvenance(join(dir, 'ok.json'))).toEqual({ builtOn: '2026-10-09', sources: ['a 1', 'b 2'] });
  expect(() => readBuildProvenance(join(dir, 'bad.json'))).toThrow(FormatError);
});
