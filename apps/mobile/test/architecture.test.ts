import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * MM-246: the engineering rules in AGENTS.md, checked. Three of them can be
 * read off the source: one declaration per file, named for it; a library
 * imported only by its adapter folder; and no raw control in a screen.
 * Layering between the folders of `src/` is `layers.test.ts`.
 */
const src = resolve('src');

/**
 * Files that break the one-declaration rule today, with why, as MM-160 kept
 * for the Dart split. The list can only shrink: a file on it that now
 * follows the rule fails the test until it is removed.
 */
const oneDeclarationBaseline: Record<string, string> = {
  'data/columns.ts': 'Fifteen one-line readers of a row, a vocabulary used together by every repository.',
};

/**
 * Each library the app may import, and the folders (or files) that may do
 * it: the adapter that hides it behind an interface (MM-159, MM-231), or
 * the one place a framework is wired. Anything not listed fails.
 */
const libraries: Record<string, readonly string[]> = {
  react: ['*'],
  'react-dom/client': ['main.tsx'],
  '@sqlite.org/sqlite-wasm': ['sql/wasm/'],
  '@capacitor/core': ['platform/', 'sql/native/', 'foodCatalog/download/native/'],
  '@capacitor/app': ['platform/'],
  '@mui/icons-material/': ['ui/'],
  '@storybook/react-vite': ['gallery/'],
  'storybook/test': ['gallery/'],
  vitest: ['*.test.ts', '*.test.tsx'],
};

/** Controls a screen never writes itself: the design system has a component for each (rule 8). */
const rawControls = /<(button|input|select|textarea|dialog|progress|meter)\b/;

const files = (folder: string): string[] =>
  readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });

const pathOf = (file: string) => relative(src, file).split(sep).join('/');

const withoutComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const matches = (path: string, rule: string) =>
  rule === '*' || (rule.startsWith('*') ? path.endsWith(rule.slice(1)) : path === rule || path.startsWith(rule));

interface Declaration {
  readonly kind: 'type' | 'function' | 'const';
  readonly name: string;
}

/** Every exported top-level declaration of `text`, by kind and name. */
function declarationsOf(text: string): Declaration[] {
  const found: Declaration[] = [];
  const pattern =
    /^export\s+(?:declare\s+)?(?:abstract\s+)?(const|let|var|async function|function\*?|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)(.*)$/gm;
  for (const match of text.matchAll(pattern)) {
    const [, keyword, name, rest] = match as unknown as [string, string, string, string];
    const kind =
      keyword === 'class' || keyword === 'interface' || keyword === 'type' || keyword === 'enum'
        ? 'type'
        : keyword.startsWith('function') || keyword === 'async function' || /^\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_$][\w$]*\s*=>|function\b)/.test(rest)
          ? 'function'
          : 'const';
    found.push({ kind, name });
  }
  // `export { a, b };` of local names (not `from` another module).
  for (const match of text.matchAll(/^export\s+\{([^}]*)\}\s*;?\s*$/gm)) {
    for (const item of (match[1] as string).split(',')) {
      const name = item.trim().split(/\s+as\s+/)[0]?.replace(/^type\s+/, '') ?? '';
      if (name !== '') found.push({ kind: 'const', name });
    }
  }
  return found;
}

/**
 * What a file is allowed to export, as one of: one named thing (a type, or a
 * function with its `<Name>Props` type, or a union type with its same-named
 * value), or a group of constants, or nothing but re-exports.
 */
function oneDeclarationProblem(path: string, text: string): string | undefined {
  const declared = declarationsOf(text);
  if (/^export default\b/m.test(text)) return `${path}: exports a default; exports are named.`;
  if (declared.length === 0) return undefined;
  const names = new Set(declared.map((d) => d.name));
  // A union type and the value that carries its cases share a name: one declaration.
  const merged = declared.filter((d, at) => !(d.kind === 'type' && declared.some((o, i) => i !== at && o.name === d.name)));
  const functions = merged.filter((d) => d.kind === 'function');
  const constants = merged.filter((d) => d.kind === 'const');
  const types = merged.filter((d) => d.kind === 'type' && !(functions.length === 1 && d.name === `${functions[0]!.name}Props`));
  if (functions.length === 0 && types.length === 0 && constants.length > 0) return undefined; // a constants file
  const main = [...types, ...functions, ...constants];
  if (main.length > 1) {
    return `${path}: exports ${main.length} declarations (${[...names].join(', ')}); one per file, or only constants.`;
  }
  const name = main[0]!.name;
  const file = basename(path).replace(/\.tsx?$/, '');
  if (file !== name) return `${path}: exports ${name}, so the file is ${name}${path.endsWith('.tsx') ? '.tsx' : '.ts'}.`;
  return undefined;
}

const everyFile = files(src);
const isStory = (path: string) => path.endsWith('.stories.tsx');
const isTest = (path: string) => /\.test\.tsx?$/.test(path);

describe('the one-declaration rule, on samples', () => {
  const cases: [string, string, string | undefined][] = [
    ['Bar.ts', 'export interface Bar { x: number }\n', undefined],
    ['MmButton.tsx', 'interface MmButtonProps { label: string }\nexport function MmButton(p: MmButtonProps) {}\n', undefined],
    ['MmButton.tsx', 'export interface MmButtonProps { label: string }\nexport function MmButton(p: MmButtonProps) {}\n', undefined],
    ['Meal.ts', "export type Meal = 'a' | 'b';\nexport const Meal = { values: ['a', 'b'] };\n", undefined],
    ['limits.ts', 'export const low = 1;\nexport const high = 2;\n', undefined],
    ['index.ts', "export * from './Bar';\nexport { Meal } from './Meal';\n", undefined],
    ['two.ts', 'export function a() {}\nexport function b() {}\n', '2 declarations'],
    ['mixed.ts', 'export const low = 1;\nexport function bodyMassIndex() {}\n', '2 declarations'],
    ['arrow.ts', 'export const low = 1;\nexport const f = (x: number) => x;\n', '2 declarations'],
    ['pair.ts', 'export interface A {}\nexport interface B {}\n', '2 declarations'],
    ['util.ts', 'export function computeTargets() {}\n', 'the file is computeTargets.ts'],
    ['Thing.ts', 'export default function Thing() {}\n', 'exports a default'],
  ];
  for (const [name, text, expected] of cases) {
    it(`${name}: ${expected ?? 'fine'}`, () => {
      const problem = oneDeclarationProblem(name, text);
      if (expected === undefined) expect(problem).toBeUndefined();
      else expect(problem).toContain(expected);
    });
  }
});

describe('architecture', () => {
  it('every file exports one declaration and is named for it (rule 5)', () => {
    const broken: string[] = [];
    const clean: string[] = [];
    for (const file of everyFile) {
      const path = pathOf(file);
      if (isStory(path) || isTest(path) || path === 'main.tsx') continue;
      const problem = oneDeclarationProblem(path, readFileSync(file, 'utf8'));
      const excused = path in oneDeclarationBaseline;
      if (problem !== undefined && !excused) broken.push(problem);
      if (problem === undefined && excused) clean.push(`${path} follows the rule now: remove it from the baseline.`);
    }
    expect([...broken, ...clean]).toEqual([]);
  });

  it('a library is imported only where it is listed (rule 2)', () => {
    const broken: string[] = [];
    for (const file of everyFile) {
      const path = pathOf(file);
      const text = withoutComments(readFileSync(file, 'utf8'));
      for (const match of text.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
        const specifier = match[1] as string;
        if (specifier.startsWith('.') || specifier.startsWith('node:')) continue;
        const library = Object.keys(libraries).find((name) => (name.endsWith('/') ? specifier.startsWith(name) : specifier === name));
        if (library === undefined) {
          broken.push(`${path} imports ${specifier}, which no folder is allowed; add it to the libraries list with its adapter.`);
        } else if (!libraries[library]!.some((rule) => matches(path, rule))) {
          broken.push(`${path} imports ${specifier}; only ${libraries[library]!.join(', ')} may.`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('a screen uses components, never a raw control (rule 8)', () => {
    const broken: string[] = [];
    for (const file of everyFile) {
      const path = pathOf(file);
      if (path.startsWith('ui/') || !path.endsWith('.tsx')) continue;
      const found = rawControls.exec(withoutComments(readFileSync(file, 'utf8')));
      if (found !== null) broken.push(`${path} writes <${found[1]}>; use the design-system component.`);
    }
    expect(broken).toEqual([]);
  });
});
