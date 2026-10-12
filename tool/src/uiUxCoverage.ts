import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { uiUxAssetHasAnchor, uiUxAssetsFolder } from './uiUxAssets.ts';

/** The manifest of every UI surface and the HTML that draws it (MM-211). */
export const uiUxCoverageFile = `${uiUxAssetsFolder}/coverage.json`;

/** Where the app's components are. */
export const uiSourceFolder = 'apps/web/src';

export const uiUxSurfaceKinds = ['view', 'part', 'component', 'sheet', 'dialog', 'navigation', 'painter', 'host'];
export const uiUxVerifications = ['screenshot-compared', 'source-only', 'not-drawn'];
export const uiUxCoverageStatuses = ['covered', 'incomplete', 'not-drawn'];

/**
 * A file that draws something: a `.tsx` file that returns JSX. A component
 * that renders nothing of its own (an effect returning null) is not
 * counted by itself.
 */
const drawsSomething = /(?:return|=>)\s*\(?\s*</;

const filesUnder = (folder: string): string[] =>
  readdirSync(folder).flatMap((name) => {
    const path = `${folder}/${name}`;
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

/**
 * Every file under `uiSourceFolder` that draws something, as paths from
 * `repoRoot`, sorted.
 */
export function uiSurfaceSources(repoRoot: string): string[] {
  const root = repoRoot.replaceAll('\\', '/');
  const folder = `${root}/${uiSourceFolder}`;
  if (!existsSync(folder)) return [];
  return filesUnder(folder)
    .filter((path) => path.endsWith('.tsx') && !path.endsWith('.test.tsx') && drawsSomething.test(readFileSync(path, 'utf8')))
    .map((path) => path.replaceAll('\\', '/').slice(root.length + 1))
    .sort();
}

/**
 * What is wrong with the coverage manifest (MM-211): a component file it
 * does not account for, an entry for a file or a frame that does not exist,
 * a missing field, a ticket that does not exist, or an HTML sheet the index
 * does not link.
 *
 * It checks that every surface is accounted for and that what the manifest
 * points at exists. It cannot tell whether a drawing looks like the screen.
 */
export function uiUxCoverageProblems(repoRoot: string, ticketIds: ReadonlySet<string>): string[] {
  const root = repoRoot.replaceAll('\\', '/');
  const sources = uiSurfaceSources(repoRoot);
  const path = `${root}/${uiUxCoverageFile}`;
  if (!existsSync(path)) {
    return sources.length > 0
      ? ['ui-ux-assets/coverage.json is missing: every view and component is listed there with the HTML that draws it (MM-211).']
      : [];
  }
  const problems: string[] = [];
  const problem = (what: string) => problems.push(`ui-ux-assets/coverage.json: ${what}`);

  let decoded: unknown;
  try {
    decoded = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return [`ui-ux-assets/coverage.json: not valid JSON (${error instanceof Error ? error.message : error}).`];
  }
  if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded) || (decoded as Record<string, unknown>)['schema'] !== 1) {
    return ['ui-ux-assets/coverage.json: expected an object with "schema": 1.'];
  }
  const manifest = decoded as Record<string, unknown>;
  const surfaces = manifest['surfaces'];
  if (!Array.isArray(surfaces)) return ['ui-ux-assets/coverage.json: "surfaces" must be a list.'];

  const htmlCache = new Map<string, string | undefined>();
  const assetProblem = (asset: unknown): string | undefined => {
    if (typeof asset !== 'string' || asset === '') return 'has no "asset"';
    const parts = asset.split('#');
    if (parts.length !== 2 || parts[1] === '') return `asset "${asset}" must be "file.html#frame"`;
    if (!htmlCache.has(parts[0]!)) {
      const target = `${root}/${uiUxAssetsFolder}/${parts[0]}`;
      htmlCache.set(parts[0]!, existsSync(target) ? readFileSync(target, 'utf8') : undefined);
    }
    const html = htmlCache.get(parts[0]!);
    if (html === undefined) return `asset ${parts[0]} is missing`;
    if (!uiUxAssetHasAnchor(html, parts[1]!)) return `asset ${parts[0]} has no frame "${parts[1]}"`;
    return undefined;
  };

  const requirementProblems = (who: string, requirements: unknown) => {
    if (!Array.isArray(requirements) || requirements.length === 0) {
      problem(`${who} lists no requirements. If none fits, put it under "unresolved" and say what must be decided.`);
      return;
    }
    for (const id of requirements) {
      if (!ticketIds.has(id as string)) problem(`${who} names ${id}, which no ticket has.`);
    }
  };

  const seen = new Set<string>();
  for (const entry of surfaces) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      problem('every surface must be an object.');
      continue;
    }
    const surface = entry as Record<string, unknown>;
    const source = surface['source'];
    if (typeof source !== 'string' || source === '') {
      problem('a surface has no "source".');
      continue;
    }
    if (seen.has(source)) problem(`${source} is listed twice.`);
    seen.add(source);
    if (!existsSync(`${root}/${source}`)) {
      problem(`${source} no longer exists. Remove its entry, or point it at what replaced it.`);
      continue;
    }
    const symbol = surface['symbol'];
    if (typeof symbol !== 'string' || symbol === '') {
      problem(`${source} has no "symbol".`);
    } else if (!readFileSync(`${root}/${source}`, 'utf8').includes(symbol)) {
      problem(`${source} does not declare "${symbol}".`);
    }
    if (!uiUxSurfaceKinds.includes(surface['kind'] as string)) {
      problem(`${source}: kind must be one of ${uiUxSurfaceKinds.join(', ')}.`);
    }
    if (!uiUxVerifications.includes(surface['verification'] as string)) {
      problem(`${source}: verification must be one of ${uiUxVerifications.join(', ')}.`);
    }
    const status = surface['status'];
    if (!uiUxCoverageStatuses.includes(status as string)) {
      problem(`${source}: status must be one of ${uiUxCoverageStatuses.join(', ')}.`);
    }
    const states = surface['states'];
    if (!Array.isArray(states) || states.length === 0) problem(`${source} lists no states.`);
    const limits = surface['limits'];
    if (status !== 'covered' && (typeof limits !== 'string' || limits.trim() === '')) {
      problem(`${source} is ${status} and does not say why under "limits".`);
    }
    requirementProblems(source, surface['requirements']);
    const wrong = assetProblem(surface['asset']);
    if (wrong !== undefined) problem(`${source}: ${wrong}.`);
  }
  for (const source of sources) {
    if (!seen.has(source)) {
      problem(`${source} draws something and is not listed. Draw it, add its entry, and link the sheet from its tickets.`);
    }
  }

  const flows = manifest['flows'];
  for (const flow of Array.isArray(flows) ? flows : []) {
    if (typeof flow !== 'object' || flow === null || typeof (flow as Record<string, unknown>)['id'] !== 'string') {
      problem('every flow needs an "id".');
      continue;
    }
    const who = `flow ${(flow as Record<string, unknown>)['id']}`;
    requirementProblems(who, (flow as Record<string, unknown>)['requirements']);
    const wrong = assetProblem((flow as Record<string, unknown>)['asset']);
    if (wrong !== undefined) problem(`${who}: ${wrong}.`);
  }

  const unresolved = manifest['unresolved'];
  for (const item of Array.isArray(unresolved) ? unresolved : []) {
    const entry = item as Record<string, unknown> | null;
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof entry['what'] !== 'string' ||
      typeof entry['decision'] !== 'string' ||
      entry['decision'].trim() === ''
    ) {
      problem('an unresolved item needs "what" and the "decision" to be made.');
    }
  }

  // The index is how a person finds a sheet.
  const index = `${root}/${uiUxAssetsFolder}/index.html`;
  if (!existsSync(index)) {
    problems.push('ui-ux-assets/index.html is missing.');
  } else {
    const text = readFileSync(index, 'utf8');
    for (const asset of [...htmlCache.keys()].sort()) {
      if (htmlCache.get(asset) !== undefined && !text.includes(`href="${asset}`)) {
        problems.push(`ui-ux-assets/index.html does not link ${asset}.`);
      }
    }
  }
  return problems;
}
