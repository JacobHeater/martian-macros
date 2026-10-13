/** What the roadmap checker needs to know about a ticket. */
export interface RoadmapTicketFacts {
  readonly id: string;
  readonly status: string;
  readonly type: string;
}

interface Step {
  readonly step: number;
  readonly tickets: readonly string[];
  readonly milestone?: string;
}

interface Workstream {
  readonly id: string;
  readonly dependsOn?: readonly string[];
  readonly unlocks?: readonly string[];
  readonly sourceRequirements?: { readonly built?: readonly string[]; readonly remaining?: readonly string[] };
  readonly sequence?: readonly Step[];
}

interface Edge {
  readonly from: string;
  readonly to: string;
  readonly type: string;
  /** The steps of `to` the edge blocks, or "all". */
  readonly scope?: readonly number[] | 'all';
  readonly satisfiedBy?: readonly string[];
}

interface Milestone {
  readonly id: string;
  readonly requires?: readonly { readonly workstream: string; readonly tickets: readonly string[] }[];
}

/** The edge types that make `dependsOn` and `unlocks`, and must not form a cycle. */
const orderingEdgeTypes = new Set(['hard-blocker', 'contract-dependency']);

const sorted = (ids: Iterable<string>) => [...ids].sort((a, b) => a.localeCompare(b));

const same = (a: Iterable<string>, b: Iterable<string>) => sorted(a).join(',') === sorted(b).join(',');

/**
 * Finds one cycle among `edges` (from → to), as the ids on it, or nothing.
 */
function findCycle(nodes: readonly string[], edges: readonly Edge[]): string[] | undefined {
  const next = new Map<string, string[]>();
  for (const edge of edges) next.set(edge.from, [...(next.get(edge.from) ?? []), edge.to]);
  const state = new Map<string, 'open' | 'done'>();
  const path: string[] = [];
  const visit = (node: string): string[] | undefined => {
    const seen = state.get(node);
    if (seen === 'done') return undefined;
    if (seen === 'open') return [...path.slice(path.indexOf(node)), node];
    state.set(node, 'open');
    path.push(node);
    for (const to of next.get(node) ?? []) {
      const cycle = visit(to);
      if (cycle !== undefined) return cycle;
    }
    path.pop();
    state.set(node, 'done');
    return undefined;
  };
  for (const node of nodes) {
    const cycle = visit(node);
    if (cycle !== undefined) return cycle;
  }
  return undefined;
}

/**
 * What is wrong with `roadmap.json` against the tickets in `requirements/`
 * (MM-245). The rules are the ones `roadmap/README.md` lists under "Keeping
 * the roadmap current":
 *
 * - every ticket is in exactly one workstream, as built when it is done and
 *   as remaining otherwise;
 * - every remaining ticket that is not an epic is in exactly one step of its
 *   workstream, and no step names a ticket from another workstream;
 * - every ticket an edge is satisfied by belongs to the edge's `from`
 *   workstream, and the edge's scope names steps the `to` workstream has;
 * - `dependsOn` and `unlocks` are exactly the ordering edges;
 * - the ordering edges contain no cycle;
 * - a milestone's ticket list is exactly the tickets of the steps tagged
 *   with it, for every milestone that has a list.
 */
export function roadmapProblems(roadmap: Record<string, unknown>, tickets: readonly RoadmapTicketFacts[]): string[] {
  const problems: string[] = [];
  const workstreams = (roadmap['workstreams'] ?? []) as readonly Workstream[];
  const edges = (roadmap['dependencyEdges'] ?? []) as readonly Edge[];
  const milestones = (roadmap['milestones'] ?? []) as readonly Milestone[];
  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const byWorkstream = new Map(workstreams.map((ws) => [ws.id, ws]));
  const say = (text: string) => problems.push(`roadmap.json: ${text}`);

  // Each ticket in exactly one workstream, on the side its status says.
  const placedIn = new Map<string, string[]>();
  for (const ws of workstreams) {
    const built = ws.sourceRequirements?.built ?? [];
    const remaining = ws.sourceRequirements?.remaining ?? [];
    for (const id of [...built, ...remaining]) placedIn.set(id, [...(placedIn.get(id) ?? []), ws.id]);
    for (const id of built) {
      const ticket = byId.get(id);
      if (ticket === undefined) say(`${ws.id} lists ${id} as built, but there is no such ticket.`);
      else if (ticket.status !== 'done') say(`${ws.id} lists ${id} as built, but its status is ${ticket.status}.`);
    }
    for (const id of remaining) {
      const ticket = byId.get(id);
      if (ticket === undefined) say(`${ws.id} lists ${id} as remaining, but there is no such ticket.`);
      else if (ticket.status === 'done') say(`${ws.id} lists ${id} as remaining, but it is done: move it to built.`);
    }
  }
  for (const ticket of tickets) {
    const where = placedIn.get(ticket.id) ?? [];
    if (where.length === 0) say(`${ticket.id} is in no workstream: add it to one's sourceRequirements and a step.`);
    else if (where.length > 1) say(`${ticket.id} is in ${where.length} workstreams (${where.join(', ')}); it belongs to one.`);
  }

  // Each remaining ticket in exactly one step of its workstream.
  const stepOf = new Map<string, string[]>();
  for (const ws of workstreams) {
    const listed = new Set([...(ws.sourceRequirements?.built ?? []), ...(ws.sourceRequirements?.remaining ?? [])]);
    for (const step of ws.sequence ?? []) {
      for (const id of step.tickets) {
        stepOf.set(id, [...(stepOf.get(id) ?? []), `${ws.id} step ${step.step}`]);
        if (!listed.has(id)) say(`${ws.id} step ${step.step} names ${id}, which is not in ${ws.id}'s sourceRequirements.`);
      }
    }
    for (const id of ws.sourceRequirements?.remaining ?? []) {
      const ticket = byId.get(id);
      if (ticket === undefined || ticket.type === 'EPIC') continue;
      if ((stepOf.get(id) ?? []).length === 0) say(`${id} is remaining in ${ws.id} but in none of its steps.`);
    }
  }
  for (const [id, steps] of stepOf) {
    if (steps.length > 1) say(`${id} is in ${steps.length} steps (${steps.join('; ')}); it belongs to one.`);
  }

  // Edges name real workstreams, steps and tickets of the right workstream.
  for (const edge of edges) {
    const from = byWorkstream.get(edge.from);
    const to = byWorkstream.get(edge.to);
    if (from === undefined) say(`an edge runs from ${edge.from}, which is no workstream.`);
    if (to === undefined) say(`an edge runs to ${edge.to}, which is no workstream.`);
    if (from === undefined || to === undefined) continue;
    const fromTickets = new Set([...(from.sourceRequirements?.built ?? []), ...(from.sourceRequirements?.remaining ?? [])]);
    for (const id of edge.satisfiedBy ?? []) {
      if (!fromTickets.has(id)) say(`the edge ${edge.from} → ${edge.to} is satisfied by ${id}, which is not in ${edge.from}.`);
    }
    const toSteps = new Set((to.sequence ?? []).map((step) => step.step));
    for (const step of edge.scope === 'all' ? [] : (edge.scope ?? [])) {
      if (!toSteps.has(step)) say(`the edge ${edge.from} → ${edge.to} scopes step ${step}, which ${edge.to} does not have.`);
    }
  }

  // dependsOn and unlocks are the ordering edges, and those have no cycle.
  const ordering = edges.filter((edge) => orderingEdgeTypes.has(edge.type));
  for (const ws of workstreams) {
    const expectedDependsOn = new Set(ordering.filter((edge) => edge.to === ws.id).map((edge) => edge.from));
    const expectedUnlocks = new Set(ordering.filter((edge) => edge.from === ws.id).map((edge) => edge.to));
    if (!same(ws.dependsOn ?? [], expectedDependsOn)) {
      say(`${ws.id} dependsOn [${sorted(ws.dependsOn ?? []).join(', ')}] but its ordering edges say [${sorted(expectedDependsOn).join(', ')}].`);
    }
    if (!same(ws.unlocks ?? [], expectedUnlocks)) {
      say(`${ws.id} unlocks [${sorted(ws.unlocks ?? []).join(', ')}] but its ordering edges say [${sorted(expectedUnlocks).join(', ')}].`);
    }
  }
  const cycle = findCycle(
    workstreams.map((ws) => ws.id),
    ordering,
  );
  if (cycle !== undefined) say(`the ordering edges form a cycle: ${cycle.join(' → ')}.`);

  // A milestone's list is the tickets of the steps tagged with it.
  for (const milestone of milestones) {
    if (milestone.requires === undefined) continue;
    const listed = new Set(milestone.requires.flatMap((entry) => entry.tickets.map((id) => `${entry.workstream}:${id}`)));
    const tagged = new Set(
      workstreams.flatMap((ws) =>
        (ws.sequence ?? [])
          .filter((step) => step.milestone === milestone.id)
          .flatMap((step) => step.tickets.map((id) => `${ws.id}:${id}`)),
      ),
    );
    const missing = [...tagged].filter((key) => !listed.has(key));
    const extra = [...listed].filter((key) => !tagged.has(key));
    if (missing.length > 0) say(`${milestone.id} does not list ${sorted(missing).join(', ')}, though their steps are tagged ${milestone.id}.`);
    if (extra.length > 0) say(`${milestone.id} lists ${sorted(extra).join(', ')}, but no step tagged ${milestone.id} has them.`);
  }

  return problems;
}
