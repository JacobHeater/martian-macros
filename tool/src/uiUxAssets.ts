import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

/** Where the HTML UI/UX assets live, from the repository root (MM-210). */
export const uiUxAssetsFolder = 'requirements/ui-ux-assets';

/** The heading a ticket lists its assets under, exactly. */
export const uiUxAssetsHeading = '## UI/UX Assets';

/**
 * What an asset can be said to be. Linking one approves nothing.
 *
 * `current` is a drawing of what is built (MM-211); the others are designs.
 */
export const uiUxAssetStatuses = ['current', 'exploratory', 'proposed', 'accepted', 'superseded'];

const unresolvedHeading = '## Unresolved assets';
const notAssetsHeading = '## HTML that is not a UI/UX asset';

/** `- [Title](link) — Status. What it shows.` */
const entryPattern = /^- \[([^\]]+)\]\(([^)\s]+)\)\s*(?:—|–|-|:)\s*([A-Za-z-]+)\b[.:,]?\s*(.*)$/;

const slashed = (path: string) => path.replaceAll('\\', '/');

const short = (text: string) => (text.length <= 60 ? text : `${text.slice(0, 57)}...`);

/** `lines` without those inside a fenced code block. */
function* outsideFences(lines: readonly string[]): Generator<string> {
  let fenced = false;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      fenced = !fenced;
    } else if (!fenced) {
      yield line;
    }
  }
}

/** The top-level list items under `heading`, each joined onto one line. */
function items(lines: readonly string[], heading: string): string[] {
  const found: string[] = [];
  let inside = false;
  let open = false;
  for (const line of outsideFences(lines)) {
    if (line.startsWith('#')) {
      inside = line.trimEnd() === heading;
      open = false;
    } else if (!inside) {
      continue;
    } else if (line.startsWith('- ')) {
      found.push(line.trimEnd());
      open = true;
    } else if (line.trim() === '') {
      open = false;
    } else if (open && line.startsWith(' ')) {
      found[found.length - 1] = `${found.at(-1)} ${line.trim()}`;
    }
  }
  return found;
}

/** The part of `link` after `#`, or undefined. */
function fragment(link: string): string | undefined {
  const at = link.indexOf('#');
  return at === -1 || at === link.length - 1 ? undefined : link.slice(at + 1);
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whether `html` has something addressed by `id`: an element with that id,
 * or a frame the shared script is asked to draw with it.
 */
export function uiUxAssetHasAnchor(html: string, id: string): boolean {
  return new RegExp(`id="${escaped(id)}"|'${escaped(id)}'`).test(html);
}

/**
 * `link`, written in a file in `fromFolder`, as a path from the repository
 * root; undefined for a link that is not a relative path to a file.
 */
function resolve(fromFolder: string, link: string): string | undefined {
  let path = link.split('#')[0]!.split('?')[0]!;
  if (path === '' || path.startsWith('/') || path.includes('${') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
    return undefined;
  }
  path = decodeURIComponent(path);
  const parts = fromFolder.split('/');
  for (const part of path.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (parts.length === 0) return undefined;
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/**
 * What `html` refers to, and whether each is loaded to render the page (a
 * script, a stylesheet, an image, a font) and not just pointed at.
 */
function* references(html: string): Generator<[string, boolean]> {
  const tags = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  const attribute = /\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const tag of html.matchAll(tags)) {
    for (const found of tag[2]!.matchAll(attribute)) {
      const value = (found[2] ?? found[3])!.trim();
      if (value === '') continue;
      yield [value, found[1]!.toLowerCase() === 'src' || tag[1]!.toLowerCase() === 'link'];
    }
  }
  for (const found of html.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
    yield [found[1]!, true];
  }
}

const filesUnder = (folder: string): string[] =>
  readdirSync(folder).flatMap((name) => {
    const path = `${folder}/${name}`;
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

/**
 * What is wrong with how the HTML UI/UX assets are tracked (MM-210), each
 * problem named by a path from `requirements/`.
 *
 * `htmlFiles` is every HTML file in the repository that git does not
 * ignore, as paths from `repoRoot` with forward slashes, or undefined when
 * that could not be found out, in which case HTML outside the folder goes
 * unchecked.
 *
 * This checks that things exist and are written down. It cannot tell
 * whether an asset belongs with the ticket that links it, whether it looks
 * right, or whether the owner approved it.
 */
export function uiUxAssetProblems(repoRoot: string, htmlFiles?: readonly string[]): string[] {
  const problems: string[] = [];
  const root = slashed(repoRoot);
  const folder = `${root}/${uiUxAssetsFolder}`;
  const readmePath = `${folder}/README.md`;
  const readmeLines = existsSync(readmePath) ? readFileSync(readmePath, 'utf8').split(/\r?\n/) : [];

  // ---- what the tickets say
  const linked = new Set<string>();
  const requirements = `${root}/requirements`;
  const components = existsSync(requirements)
    ? readdirSync(requirements)
        .filter((name) => statSync(`${requirements}/${name}`).isDirectory())
        .sort()
    : [];
  for (const name of components) {
    if (name === uiUxAssetsFolder.split('/').at(-1)) continue;
    const files = readdirSync(`${requirements}/${name}`)
      .filter((file) => file.endsWith('.md') && statSync(`${requirements}/${name}/${file}`).isFile())
      .sort();
    for (const file of files) {
      const where = `${name}/${file}`;
      const lines = readFileSync(`${requirements}/${name}/${file}`, 'utf8').split(/\r?\n/);
      for (const line of outsideFences(lines)) {
        const heading = /^#{1,6}\s+(.*?)\s*$/.exec(line);
        if (heading === null || line === uiUxAssetsHeading) continue;
        if (/^ui\s*[/ ]?\s*ux\s+assets?:?$/i.test(heading[1]!)) {
          problems.push(`${where}: the heading must be exactly "${uiUxAssetsHeading}", not "${line}".`);
        }
      }
      if (!lines.includes(uiUxAssetsHeading)) continue;
      const listed = items(lines, uiUxAssetsHeading);
      if (listed.length === 0) problems.push(`${where}: "${uiUxAssetsHeading}" lists no asset.`);
      for (const item of listed) {
        const entry = entryPattern.exec(item);
        if (entry === null) {
          problems.push(
            `${where}: an asset entry must read "- [Title](relative/link) — Status. What it shows.": "${short(item)}".`,
          );
          continue;
        }
        const title = entry[1]!;
        const status = entry[3]!.toLowerCase();
        if (!uiUxAssetStatuses.includes(status)) {
          problems.push(
            `${where}: asset "${title}" has status "${entry[3]}"; it must be one of ${uiUxAssetStatuses.join(', ')}.`,
          );
        }
        if (entry[4]!.trim() === '') problems.push(`${where}: asset "${title}" does not say what it shows.`);
        const target = resolve(`requirements/${name}`, entry[2]!);
        if (target === undefined) {
          problems.push(`${where}: asset "${title}" needs a relative link, not "${entry[2]}".`);
        } else if (!target.startsWith(`${uiUxAssetsFolder}/`)) {
          problems.push(`${where}: asset "${title}" links ${target}, which is outside ${uiUxAssetsFolder}/. Assets live there.`);
        } else if (!existsSync(`${root}/${target}`)) {
          problems.push(`${where}: asset "${title}" links ${target}, which is missing.`);
        } else {
          linked.add(target);
          const frame = fragment(entry[2]!);
          if (frame !== undefined && !uiUxAssetHasAnchor(readFileSync(`${root}/${target}`, 'utf8'), frame)) {
            problems.push(`${where}: asset "${title}" links ${target}#${frame}, and that sheet has no frame "${frame}".`);
          }
        }
      }
    }
  }

  // ---- what the folder holds
  const unresolved = new Set<string>();
  for (const item of items(readmeLines, unresolvedHeading)) {
    const entry = /^- \[([^\]]+)\]\(([^)\s]+)\)(.*)$/.exec(item);
    const target = entry === null ? undefined : resolve(uiUxAssetsFolder, entry[2]!);
    if (entry === null || target === undefined) {
      problems.push(
        `ui-ux-assets/README.md: an unresolved asset must read "- [Title](file.html): what it seems to show and what must be decided": "${short(item)}".`,
      );
    } else if (!existsSync(`${root}/${target}`)) {
      problems.push(`ui-ux-assets/README.md: unresolved asset ${target} is missing.`);
    } else if (entry[3]!.replace(/[\s:—–.-]/g, '') === '') {
      problems.push(`ui-ux-assets/README.md: unresolved asset ${target} does not say what must be decided.`);
    } else {
      unresolved.add(target);
    }
  }

  const assets = new Map<string, string>();
  if (existsSync(folder)) {
    for (const path of filesUnder(folder).sort()) {
      if (!path.toLowerCase().endsWith('.html')) continue;
      assets.set(slashed(path).slice(root.length + 1), readFileSync(path, 'utf8'));
    }
  }
  const seen = new Map<string, string>();
  for (const [path, html] of assets) {
    if (linked.has(path) && unresolved.has(path)) {
      problems.push(
        `ui-ux-assets/README.md: ${path} is linked from a ticket, so it is no longer unresolved. Take it off that list.`,
      );
    } else if (!linked.has(path) && !unresolved.has(path)) {
      problems.push(
        `${path}: no ticket lists it under "${uiUxAssetsHeading}". Link it from the tickets it supports, or record it under "${unresolvedHeading}" in ${uiUxAssetsFolder}/README.md.`,
      );
    }
    const same = seen.get(html);
    if (same !== undefined) {
      problems.push(`${path}: the same file as ${same}. Keep one copy and link it from each ticket.`);
    } else {
      seen.set(html, path);
    }
    const at = path.slice(0, path.lastIndexOf('/'));
    for (const [reference, loaded] of references(html)) {
      if (/^(https?:)?\/\//i.test(reference)) {
        if (loaded) problems.push(`${path}: loads ${reference} from the network. An asset carries what it needs to render.`);
        continue;
      }
      const target = resolve(at, reference);
      if (target === undefined) continue;
      if (!existsSync(`${root}/${target}`)) {
        problems.push(`${path}: refers to ${reference}, which is missing.`);
        continue;
      }
      const frame = fragment(reference);
      if (
        frame !== undefined &&
        target.toLowerCase().endsWith('.html') &&
        !uiUxAssetHasAnchor(readFileSync(`${root}/${target}`, 'utf8'), frame)
      ) {
        problems.push(`${path}: links ${reference}, and that sheet has no frame "${frame}".`);
      }
    }
  }

  // ---- HTML anywhere else
  const notAssets = new Set<string>();
  for (const item of items(readmeLines, notAssetsHeading)) {
    const path = /^- `([^`]+)`(.*)$/.exec(item);
    if (path === null || path[2]!.replace(/[\s:—–.-]/g, '') === '') {
      problems.push(
        `ui-ux-assets/README.md: HTML kept elsewhere must read "- \`path/from/the/repository/root.html\`: what it is": "${short(item)}".`,
      );
      continue;
    }
    notAssets.add(path[1]!);
    if (!existsSync(`${root}/${path[1]}`)) {
      problems.push(`ui-ux-assets/README.md: ${path[1]} is listed as HTML kept elsewhere, and is missing. Take it off the list.`);
    }
  }
  for (const path of [...(htmlFiles ?? [])].sort()) {
    if (path.startsWith(`${uiUxAssetsFolder}/`) || notAssets.has(path)) continue;
    problems.push(
      `${path}: HTML outside ${uiUxAssetsFolder}/. If it shows a screen or a flow, move it there and link it from its tickets; if it does not, list it under "${notAssetsHeading}" in ${uiUxAssetsFolder}/README.md.`,
    );
  }
  if (!existsSync(readmePath) && (assets.size > 0 || problems.length > 0)) {
    problems.push(`${uiUxAssetsFolder}/README.md is missing.`);
  }
  return problems;
}
