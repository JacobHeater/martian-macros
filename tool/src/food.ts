import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { stderr, stdout } from 'node:process';
import { capture, run } from './proc.ts';
import { foodSources } from './foodSource.ts';

/**
 * Downloads each source into `cache` (reusing what is already there) and
 * unpacks the zip files, then writes `provenance.json` with the date and the
 * versions. Returns a process exit code.
 */
export async function fetchFoodSources(cache: string): Promise<number> {
  mkdirSync(cache, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  for (const source of foodSources) {
    const file = `${cache}/${source.fileName}`;
    if (existsSync(file)) {
      stdout.write(`reusing ${source.fileName}\n`);
    } else {
      stdout.write(`downloading ${source.url}\n`);
      const temp = `${file}.part`;
      const response = await fetch(source.url);
      if (!response.ok || response.body === null) {
        stderr.write(`${source.url}: HTTP ${response.status}\n`);
        return 1;
      }
      await pipeline(Readable.fromWeb(response.body as never), createWriteStream(temp));
      renameSync(temp, file);
    }
    if (source.isZip && !existsSync(`${cache}/${source.id}`)) {
      const code = await unzip(file, `${cache}/${source.id}`);
      if (code !== 0) return code;
    }
  }
  writeFileSync(
    `${cache}/provenance.json`,
    JSON.stringify({
      builtOn: today,
      sources: foodSources.map((source) => `${source.description} (downloaded ${today})`),
    }),
  );
  stdout.write(`sources ready in ${cache}\n`);
  return 0;
}

/**
 * Unpacks `zip` into `into`, dropping the one folder the USDA zips wrap
 * everything in.
 */
async function unzip(zip: string, into: string): Promise<number> {
  mkdirSync(into, { recursive: true });
  let result = await capture(['tar', '-xf', zip, '-C', into, '--strip-components=1']);
  if (result.code !== 0) {
    result = await capture(['unzip', '-oq', zip, '-d', into]);
    if (result.code !== 0) {
      stderr.write(`Could not unzip ${zip}: ${result.stderr}\n`);
      rmSync(into, { recursive: true, force: true });
      return 1;
    }
    const entries = readdirSync(into);
    const inner = entries.filter((name) => statSync(`${into}/${name}`).isDirectory());
    if (inner.length === 1 && entries.length === 1) {
      for (const name of readdirSync(`${into}/${inner[0]}`)) {
        renameSync(`${into}/${inner[0]}/${name}`, `${into}/${name}`);
      }
      rmSync(`${into}/${inner[0]}`, { recursive: true, force: true });
    }
  }
  return 0;
}

const webApp = 'apps/mobile';

/**
 * `mm food fetch | build | package` (MM-52).
 *
 *   mm food fetch [--cache DIR]      download the sources (reused if present)
 *   mm food build [--cache DIR] [--out DIR] [--prefer recent|off|usda_branded]
 *                                     extract with DuckDB, then build the packs
 *   mm food package --base-url https://...   compress the packs and write the
 *                                     manifest to publish (uploads nothing)
 *
 * The cache defaults to `.food_cache/` and the output to `.food_cache/packs/`;
 * neither is committed. `build` needs the DuckDB command-line tool on PATH.
 */
export async function runFood(repoRoot: string, args: readonly string[]): Promise<number> {
  const option = (name: string): string | undefined => {
    const at = args.indexOf(name);
    return at >= 0 && at + 1 < args.length ? args[at + 1] : undefined;
  };

  const cache = option('--cache') ?? `${repoRoot}/.food_cache`;
  switch (args[0]) {
    case 'fetch':
      return fetchFoodSources(cache);
    case 'package': {
      const base = option('--base-url');
      if (base === undefined) {
        stderr.write('mm food package needs --base-url https://...\n');
        return 64;
      }
      return run(
        [
          'node',
          'scripts/food-package.mjs',
          '--packs',
          option('--packs') ?? `${cache}/packs`,
          '--out',
          option('--out') ?? `${cache}/publish`,
          '--base-url',
          base,
        ],
        { cwd: `${repoRoot}/${webApp}` },
      );
    }
    case 'build':
      return build(repoRoot, cache, option('--out') ?? `${cache}/packs`, option('--prefer') ?? 'recent');
    default:
      stderr.write('Usage: mm food <fetch|build|package> [--cache DIR] [--out DIR]\n');
      return 64;
  }
}

async function build(repoRoot: string, cache: string, out: string, prefer: string): Promise<number> {
  if (!existsSync(`${cache}/provenance.json`)) {
    stderr.write(`No sources in ${cache}. Run "mm food fetch" first.\n`);
    return 66;
  }
  const version = await capture(['duckdb', '--version']);
  if (version.code === 127) {
    stderr.write('The DuckDB command-line tool ("duckdb") is not on PATH. Install it from https://duckdb.org/install and run again.\n');
    return 69;
  }
  const extract = `${cache}/extract`;
  mkdirSync(extract, { recursive: true });
  const path = (dir: string) => dir.replaceAll('\\', '/');
  const sql = readFileSync(`${repoRoot}/${webApp}/src/foodPipeline/node/extract.sql`, 'utf8')
    .replaceAll('{{cache}}', path(cache))
    .replaceAll('{{out}}', path(extract));

  stdout.write('extracting with DuckDB\n');
  const temp = `${extract}/.extract.sql`;
  writeFileSync(temp, sql);
  const extracted = await run(['duckdb', '-init', temp, '-no-stdin'], { cwd: repoRoot });
  rmSync(temp, { force: true });
  if (extracted !== 0) return extracted;

  return run(
    [
      'node',
      'scripts/food-build.mjs',
      '--extract',
      path(extract),
      '--provenance',
      `${path(cache)}/provenance.json`,
      '--out',
      path(out),
      '--prefer',
      prefer,
    ],
    { cwd: `${repoRoot}/${webApp}` },
  );
}
