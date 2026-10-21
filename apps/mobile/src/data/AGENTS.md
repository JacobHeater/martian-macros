# The database (`src/data/`)

Read with [apps/mobile/AGENTS.md](../../AGENTS.md) and the root
[AGENTS.md](../../../../AGENTS.md).

- A change to any table bumps `currentSchemaVersion.ts` by one, changes
  `currentSchema.ts` and adds the migration step to `migrationSteps.ts`. The
  migration tests hold every released version's upgrade path.
- **Never edit a step or a version's shape after any build of it has run
  anywhere** (a panel build, the owner's phone): add a new version instead
  (MM-325). Version 4 gained a column after the owner's phone had it, and the
  sodium limit stopped switching on there. `test/data/schemaFingerprint.test.ts`
  fails when the schema changes without a new version.
- Only one schema change at a time across open branches: check the open PRs
  before taking the next version.
- Screens and state never use SQL or a concrete store. Every repository has an
  interface in `domain/`, a SQL implementation here, an in-memory fixture in
  `fixtures/`, and a contract suite in `test/contracts/` run against both.
