// MM-321: every part of a screen a person can see is drawn by a story. The
// stories are drawn under coverage (`npm run unseen`); this reads what they
// reached and lists the markup none of them did: a branch that renders
// markup, or a function holding markup that was never called (most often a
// sheet opened by a press no story walks). Each such place is a failure
// unless the register, test/gallery/unseen.json, names it with its reason.
// A place in the register that a story now draws is a failure too, so the
// register only shrinks. Places are named by file and the text of their
// line, not its number, so an edit elsewhere in the file does not move them.
import { readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const coverage = JSON.parse(readFileSync(`${root}coverage/stories/coverage-final.json`, 'utf8'));
const registerPath = `${root}test/gallery/unseen.json`;
const register = JSON.parse(readFileSync(registerPath, 'utf8'));

/** The source between two positions of a file's lines, to the column. */
function between(lines, { start, end }) {
  const part = lines.slice(start.line - 1, end.line ?? start.line);
  if (part.length === 0) return '';
  if (typeof end.column === 'number') part[part.length - 1] = part[part.length - 1].slice(0, end.column);
  part[0] = part[0].slice(start.column ?? 0);
  return part.join('\n');
}

/** Every place of markup no story drew, by its name, with whether it is a press's. */
function unseen() {
  const places = new Map();
  for (const [file, data] of Object.entries(coverage)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    const where = relative(root, file).replace(/\\/g, '/');
    const add = (line, pressed) => {
      const text = lines[line - 1].trim();
      let name = `${where}: ${text}`;
      for (let n = 2; places.has(name) && places.get(name).line !== line; n++) name = `${where}: ${text} #${n}`;
      if (!places.has(name)) places.set(name, { line, pressed });
    };
    for (const [id, branch] of Object.entries(data.branchMap)) {
      branch.locations.forEach((location, i) => {
        if (data.b[id][i] === 0 && location.start.line && /<[A-Za-z]/.test(between(lines, location))) {
          add(location.start.line, false);
        }
      });
    }
    for (const [id, fn] of Object.entries(data.fnMap)) {
      if (data.f[id] === 0 && /<[A-Z][A-Za-z]*[\s/>]/.test(between(lines, fn.loc))) add(fn.loc.start.line, true);
    }
  }
  return places;
}

const found = unseen();
if (process.argv.includes('--write')) {
  // Starts or refreshes the register, keeping the reasons already given.
  const reasons = new Map(register.map(({ place, reason }) => [place, reason]));
  const next = [...found.keys()].sort().map((place) => ({ place, reason: reasons.get(place) ?? '' }));
  writeFileSync(registerPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`unseen.json: ${next.length} places`);
  process.exit(0);
}

const known = new Set(register.map(({ place }) => place));
const fresh = [...found.keys()].filter((place) => !known.has(place)).sort();
const drawn = [...known].filter((place) => !found.has(place)).sort();
const unexplained = register.filter(({ place, reason }) => found.has(place) && reason.trim() === '').map(({ place }) => place);

if (fresh.length + drawn.length + unexplained.length === 0) {
  console.log(`Every part of every screen is drawn by a story, but ${register.length} places in the register.`);
  process.exit(0);
}
for (const place of fresh) console.error(`Drawn by no story (add one, MM-321): ${place}`);
for (const place of drawn) console.error(`Now drawn by a story; take it out of test/gallery/unseen.json: ${place}`);
for (const place of unexplained) console.error(`In the register with no reason: ${place}`);
process.exit(1);
