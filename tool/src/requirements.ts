import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { stderr, stdout } from 'node:process';
import { roadmapProblems } from './roadmapChecker.ts';
import type { Ticket } from './ticket.ts';

interface RequirementsScan {
  readonly tickets: Ticket[];
  readonly problems: string[];
  readonly highestNumber: number;
}

const key = 'MM';
const statuses = ['proposed', 'in-progress', 'done'];
const fileNamePattern = /^(STORY|TASK|BUG|EPIC|SPIKE)\.([a-z0-9]+(?:-[a-z0-9]+)*)\.(MM-(\d+))\.md$/;
const idPattern = /^MM-\d+$/;

/** The living handoff document every agent keeps (MM-174). */
export const handoffFileName = 'HANDOFF.md';

/** The most sessions the handoff document may hold. */
export const handoffSessionLimit = 3;

/**
 * What is wrong with the handoff document's `lines`: it must sum up between
 * one and `handoffSessionLimit` sessions, each under a `## Session` heading,
 * newest first, so it stays short enough to read at the start of a session.
 */
export function handoffProblems(lines: readonly string[]): string[] {
  const sessions = lines.filter((line) => line.startsWith('## Session ')).length;
  const problems: string[] = [];
  if (sessions === 0) problems.push(`${handoffFileName}: needs at least one "## Session ..." section.`);
  if (sessions > handoffSessionLimit) {
    problems.push(
      `${handoffFileName}: holds ${sessions} sessions; keep the latest ${handoffSessionLimit} and drop the oldest.`,
    );
  }
  return problems;
}

const baseName = (path: string) => path.split(/[/\\]/).at(-1) ?? path;

const lines = (path: string) => readFileSync(path, 'utf8').split(/\r?\n/);

/** Reads `key: value` pairs between the leading `---` fences. */
function frontmatter(text: readonly string[]): Map<string, string> | undefined {
  if (text.length === 0 || text[0]!.trim() !== '---') return undefined;
  const end = text.findIndex((line, at) => at > 0 && line.trim() === '---');
  if (end === -1) return undefined;
  const fields = new Map<string, string>();
  for (const line of text.slice(1, end)) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    fields.set(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
  }
  return fields;
}

/** Parses a YAML flow list such as `[MM-1, MM-2]`. */
function flowList(value: string | undefined): string[] {
  if (value === undefined) return [];
  const inner = value.replace(/^\[|\]$/g, '').trim();
  if (inner === '') return [];
  return inner.split(',').map((item) => item.trim());
}

function scan(root: string): RequirementsScan {
  const tickets: Ticket[] = [];
  const problems: string[] = [];
  if (!existsSync(`${root}/${handoffFileName}`)) {
    problems.push(`${handoffFileName} is missing: every agent keeps it up to date (MM-174).`);
  }

  for (const name of readdirSync(root).sort()) {
    const path = `${root}/${name}`;
    if (statSync(path).isFile()) {
      if (name === handoffFileName) {
        problems.push(...handoffProblems(lines(path)));
      } else if (name !== 'README.md') {
        problems.push(`${name}: tickets belong in a component folder.`);
      }
      continue;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      problems.push(`${name}/: component folders are kebab-case.`);
    }
    for (const fileName of readdirSync(path).sort()) {
      const where = `${name}/${fileName}`;
      if (!statSync(`${path}/${fileName}`).isFile()) {
        problems.push(`${where}: component folders hold ticket files only.`);
        continue;
      }
      const match = fileNamePattern.exec(fileName);
      if (match === null) {
        problems.push(`${where}: expected TYPE.brief-description.MM-<n>.md (TYPE is STORY, TASK, BUG, EPIC or SPIKE).`);
        continue;
      }
      const id = match[3]!;
      const front = frontmatter(lines(`${path}/${fileName}`));
      if (front === undefined) {
        problems.push(`${where}: missing frontmatter.`);
        continue;
      }
      if (front.get('id') !== id) {
        problems.push(`${where}: frontmatter id "${front.get('id')}" does not match the filename id "${id}".`);
      }
      if (front.get('component') !== name) {
        problems.push(`${where}: frontmatter component "${front.get('component')}" does not match its folder "${name}".`);
      }
      const status = front.get('status') ?? '';
      if (!statuses.includes(status)) {
        problems.push(`${where}: status "${status}" is not one of ${statuses.join(', ')}.`);
      }
      const related = flowList(front.get('related'));
      for (const relation of related) {
        if (!idPattern.test(relation)) {
          problems.push(`${where}: related "${relation}" is not a short_id.`);
        } else if (relation === id) {
          problems.push(`${where}: a ticket cannot be related to itself.`);
        }
      }
      tickets.push({
        component: name,
        fileName,
        type: match[1]!,
        slug: match[2]!,
        id,
        number: Number(match[4]!),
        status,
        related,
      });
    }
  }

  const byId = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    byId.set(ticket.id, [...(byId.get(ticket.id) ?? []), ticket]);
  }
  for (const [id, sharing] of byId) {
    if (sharing.length > 1) {
      problems.push(
        `${id} is used by ${sharing.length} tickets: ${sharing.map((t) => `${t.component}/${t.fileName}`).join(', ')}.`,
      );
    }
  }
  for (const ticket of tickets) {
    for (const relation of ticket.related) {
      if (idPattern.test(relation) && !byId.has(relation)) {
        problems.push(`${ticket.component}/${ticket.fileName}: related ${relation} does not exist.`);
      }
    }
  }

  tickets.sort((a, b) => a.number - b.number);
  return { tickets, problems, highestNumber: tickets.at(-1)?.number ?? 0 };
}

/**
 * The roadmap's problems against the tickets (MM-245): every ticket is in
 * one workstream and one step, on the side its status says. A missing
 * roadmap is a problem too, since `mm roadmap` and the agents read it.
 */
function roadmapCheck(repoRoot: string, tickets: readonly Ticket[]): string[] {
  const path = `${repoRoot}/roadmap/roadmap.json`;
  if (!existsSync(path)) return ['roadmap/roadmap.json is missing.'];
  try {
    return roadmapProblems(JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>, tickets);
  } catch (error) {
    return [`roadmap/roadmap.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`];
  }
}

const option = (args: readonly string[], name: string): string | undefined => {
  const at = args.indexOf(name);
  return at === -1 || at + 1 >= args.length ? undefined : args[at + 1];
};

/**
 * The requirements tracker: validates `requirements/` against the rules in
 * its README and answers questions about tickets.
 *
 *   mm req                 validate, then print a status summary
 *   mm req list [--status S] [--component C]
 *   mm req next            print the next unused short_id
 *   mm req show MM-42      print the path of a ticket
 */
export async function runRequirements(repoRoot: string, args: readonly string[]): Promise<number> {
  const root = `${repoRoot}/requirements`;
  if (!existsSync(root)) {
    stderr.write(`No requirements/ folder at ${repoRoot}.\n`);
    return 66;
  }
  const found = scan(root);

  switch (args[0]) {
    case 'next':
      stdout.write(`${key}-${found.highestNumber + 1}\n`);
      return 0;
    case 'show': {
      const id = args[1];
      const matches = found.tickets.filter((ticket) => ticket.id === id);
      if (matches.length === 0) {
        stderr.write(`No ticket with id "${id}".\n`);
        return 1;
      }
      for (const ticket of matches) stdout.write(`requirements/${ticket.component}/${ticket.fileName}\n`);
      return 0;
    }
    case 'list': {
      const status = option(args, '--status');
      const component = option(args, '--component');
      for (const ticket of found.tickets) {
        if (status !== undefined && ticket.status !== status) continue;
        if (component !== undefined && ticket.component !== component) continue;
        stdout.write(
          `${ticket.id.padEnd(7)} ${ticket.status.padEnd(12)} ${ticket.type.padEnd(6)} ${ticket.component}/${ticket.slug}\n`,
        );
      }
      return found.problems.length === 0 ? 0 : 1;
    }
    case undefined:
      break;
    default:
      stderr.write('Usage: mm req [list [--status S] [--component C] | next | show <id>]\n');
      return 64;
  }

  const problems = [...found.problems, ...roadmapCheck(repoRoot, found.tickets)];
  if (problems.length > 0) {
    for (const problem of problems) stderr.write(`  ${problem}\n`);
    stderr.write(`\n${problems.length} requirements problem(s).\n`);
    return 1;
  }

  const components = new Map<string, Map<string, number>>();
  for (const ticket of found.tickets) {
    const counts = components.get(ticket.component) ?? new Map<string, number>();
    components.set(ticket.component, counts);
    counts.set(ticket.status, (counts.get(ticket.status) ?? 0) + 1);
  }
  stdout.write(`${'component'.padEnd(20)} ${statuses.map((s) => s.padStart(12)).join('')}\n`);
  for (const name of [...components.keys()].sort()) {
    const counts = components.get(name)!;
    stdout.write(`${name.padEnd(20)} ${statuses.map((s) => `${counts.get(s) ?? 0}`.padStart(12)).join('')}\n`);
  }
  const totals = statuses.map((s) => `${found.tickets.filter((t) => t.status === s).length}`.padStart(12));
  stdout.write(`${'total'.padEnd(20)} ${totals.join('')}\n`);
  stdout.write(`\n${found.tickets.length} tickets, all valid. Next id: ${key}-${found.highestNumber + 1}\n`);
  return 0;
}
