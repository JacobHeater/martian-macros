import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { stderr, stdout } from 'node:process';
import { capture } from './proc.ts';

/** A ticket as the progress page shows it. */
export interface RoadmapTicket {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly component: string;
}

const field = (text: string, name: string): string | undefined =>
  new RegExp(`^${name}: *(.+)$`, 'm').exec(text)?.[1]?.trim();

/** "Task: A register" becomes "A register". */
const title = (heading: string) => heading.replace(/^(Task|Story|Epic|Bug|Spike): */, '');

const number = (id: string) => Number(id.split('-').at(-1)) || 0;

/**
 * Reads every ticket under `requirements`: id, status, component and the
 * title from its first heading. Validation is `mm req`'s job, not this one's.
 */
export function readRoadmapTickets(requirements: string): RoadmapTicket[] {
  const tickets: RoadmapTicket[] = [];
  for (const dir of readdirSync(requirements)) {
    if (!statSync(`${requirements}/${dir}`).isDirectory()) continue;
    for (const name of readdirSync(`${requirements}/${dir}`)) {
      const path = `${requirements}/${dir}/${name}`;
      if (!statSync(path).isFile()) continue;
      const text = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
      const id = field(text, 'id');
      if (id === undefined) continue;
      const heading = /^# (.+)$/m.exec(text);
      tickets.push({
        id,
        title: title(heading?.[1] ?? id),
        status: field(text, 'status') ?? 'proposed',
        component: field(text, 'component') ?? '',
      });
    }
  }
  tickets.sort((a, b) => number(a.id) - number(b.id));
  return tickets;
}

/**
 * The JSON the progress page embeds: every ticket, and the roadmap's own
 * structure (milestones, workstreams). Status is taken from `tickets`.
 */
export function roadmapPageData({
  roadmap,
  tickets,
  generatedOn,
}: {
  roadmap: Record<string, unknown>;
  tickets: readonly RoadmapTicket[];
  generatedOn: string;
}): string {
  const data = {
    generatedOn,
    milestones: roadmap['milestones'],
    workstreams: (roadmap['workstreams'] as Record<string, unknown>[]).map((w) => ({
      id: w['id'],
      name: w['name'],
      intent: w['intent'],
      order: w['recommendedOrder'],
      risk: w['riskLevel'],
      dependsOn: w['dependsOn'],
      sequence: w['sequence'],
      gate: w['gate'],
      listed: w['sourceRequirements'],
    })),
    tickets: Object.fromEntries(
      tickets.map((t) => [t.id, { title: t.title, status: t.status, component: t.component }]),
    ),
  };
  // Keep "</script>" inside a string from ending the page's script block.
  return JSON.stringify(data).replaceAll('</', String.raw`<\/`);
}

const marker = '/*DATA*/null/*END*/';

/**
 * `mm roadmap [--check] [--no-open]`: writes `roadmap/progress.html`
 * (MM-166) and opens it, or with `--check` says whether the committed page
 * is out of date. It opens only at a terminal and never in CI.
 */
export async function runRoadmapReport(repoRoot: string, args: readonly string[]): Promise<number> {
  const templatePath = `${repoRoot}/tool/assets/roadmap_report.template.html`;
  const roadmapPath = `${repoRoot}/roadmap/roadmap.json`;
  if (!existsSync(templatePath) || !existsSync(roadmapPath)) {
    stderr.write('Missing the page template or roadmap/roadmap.json.\n');
    return 66;
  }
  const roadmap = JSON.parse(readFileSync(roadmapPath, 'utf8')) as Record<string, unknown>;
  const tickets = readRoadmapTickets(`${repoRoot}/requirements`);
  // The date is the roadmap's own, so the page only changes when its inputs do.
  const data = roadmapPageData({ roadmap, tickets, generatedOn: `${roadmap['asOf']}` });
  const html = readFileSync(templatePath, 'utf8').replaceAll('\r\n', '\n').replace(marker, `/*DATA*/${data}/*END*/`);
  const out = `${repoRoot}/roadmap/progress.html`;
  if (args.includes('--check')) {
    const current = existsSync(out) ? readFileSync(out, 'utf8') : '';
    if (current.replaceAll('\r\n', '\n') === html) return 0;
    stderr.write('roadmap/progress.html is out of date. Run "mm roadmap".\n');
    return 1;
  }
  writeFileSync(out, html);
  const opening = !args.includes('--no-open') && stdout.isTTY === true && process.env['CI'] === undefined;
  stdout.write(`Wrote roadmap/progress.html (${tickets.length} tickets). ${opening ? 'Opening it.' : 'Open it in a browser.'}\n`);
  if (opening) {
    // Opening is a convenience; the page is already written.
    const command =
      process.platform === 'win32' ? ['cmd', '/c', 'start', '', out] : process.platform === 'darwin' ? ['open', out] : ['xdg-open', out];
    await capture(command);
  }
  return 0;
}
