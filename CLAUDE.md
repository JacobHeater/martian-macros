# Claude Code instructions

Read and follow the repository's canonical contributor guidance in
[AGENTS.md](AGENTS.md) before working. It covers requirements-first changes,
architecture, privacy, validation, and completion expectations. If any
instruction here appears inconsistent, follow `AGENTS.md`.

Project-specific Claude Code settings and read-only review subagents live in
[.claude/](.claude/). Use a subagent when its focused review is relevant; do
not treat a review as a substitute for running the applicable tests and
checks.

For cross-domain work, start with [agents/README.md](agents/README.md).
The `panel-*` specialists are thin read-only research adapters; `panel-chair`
coordinates artifacts and bounded reviews, with a single edit owner. See
[native surfaces and handoff examples](agents/native-surfaces.md).
