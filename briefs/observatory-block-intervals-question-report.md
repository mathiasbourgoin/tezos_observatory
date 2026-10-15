# Question phase — observatory-block-intervals

Mode: full, supplied by root coordinator. Phase scope: neutral questions only.

Inputs read: `.agents/skills/roster-question/SKILL.md` (complete), user-provided AGENTS instructions, `/home/mathias/.codex/RTK.md`, `.harness/rules/project-authority.md`, `README.md`. `AGENTS.md` is absent on disk. No application code inspected.

Artifacts: `roster/observatory-block-intervals/questions.md`, `roster/observatory-block-intervals/task.md`. Root coordinator explicitly approved the reconciled nine questions under project-authority; manifest written after that approval. Technical IDs empty: no paths or code symbols were introduced in questions.

Execution evidence:
- Initial combined skill/RTK/authority read used an unprefixed shell command before RTK was loaded; subsequent shell commands use `rtk`.
- Hook lookup: `.harness/hooks/skills/roster-question` absent.
- Actual pre-hook invocation with `TASK=observatory-block-intervals`: `node .harness/bin/run-hook.js pre roster-question`; exit 1, `MODULE_NOT_FOUND` (runner absent). No hook behavior was simulated.
- `node .harness/bin/claims-reconcile.js --help`: exit 64, usage lists `manifest-neutral <path>`.

First draft prepared directly under the original root no-child assignment. Root then authorized the mandatory pure text transformation child, with no file access and fresh context; final questions reconcile its seven returned questions with the first draft: preserve all seven codebase domains, make existing TzKT integrations explicit without assuming they fetch blocks, and incorporate the child’s ecosystem focus on TzKT timestamp filters and average-block-time definitions. No research, implementation, infrastructure, remote mutation or commit performed.

Validation: `rtk proxy node .harness/bin/claims-reconcile.js manifest-neutral roster/observatory-block-intervals/questions.manifest.json` exited 0. Closed three-key schema and canonical digest accepted. SHA-256 questions digest: `950a22e529577327d8f98cec72edc519cdbc04367b123d6a498d45799821430a`.

Post-hook: not applicable; no roster-question pre/post hooks exist and the installed harness has no run-hook.js runner. No hook fixture or replacement was created.

Handoff: only `roster/observatory-block-intervals/questions.manifest.json` is blind-research machine input; task.md and this report contain task intent and must not be supplied to the researcher. Root owns dispatch. No commit performed.
