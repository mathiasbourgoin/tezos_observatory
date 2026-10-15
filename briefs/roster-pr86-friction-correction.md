# PR86 portable friction definition — implementation evidence

Final commit **`c5eaf9836b45ee215bf70dd21d66853a3838f623`**, tree **`d3bb4b47bf2bb4a82a8b3d42b8bb4eedaa3a3b09`**, sole parent **`4cd0f7800683aa957eaceb50bc84657bb1e2a2aa`**. Commit `fix: embed portable shadow friction instructions`. Final own checkout status empty; committed whitespace check exit0.13 changed paths,354+/25−, including three official generated shadow projections containing the canonical fragment. This ignored evidence artifact is outside the committed source tree.

Worktree `/home/mathias/.cache/observatory-review/roster-pr86-friction-fix`, branch `fix/pr86-portable-friction`, sole base `4cd0f7800683aa957eaceb50bc84657bb1e2a2aa`. Author implements root-adjudicated MEDIUM portable instruction gap. Original independent spec review, its two completed assertion failures and exact4cd source remain unchanged. This is author evidence, not independent review, QA, review GO or publication permission.

## Cause and correction

Shadow mandated a source-only template path without `friction_log: true`. Adding that flag alone would still fail in an official initialized consumer: init-harness installs flat `.harness/skills`, while the renderer previously looked for a core preamble only under consumer `skills/shared`.

Reuse the existing renderer and canonical fragment: select consumer core preamble when present, otherwise existing source-Roster core preamble. Friction fragment similarly keeps a local override and otherwise uses the existing source-Roster fragment. A requested friction definition without an available core or fragment now fails explicitly, rather than silently projecting an incomplete instruction. No new resource copies, framework, dependencies, global absolute path or environment override. This fallback also provides requested core preambles to other `preamble: true` skills in flat installed consumers; existing source checkouts retain their local preambles. Pipeline remains gated by non-null phase, friction by true flag.

Shadow1.3.1 opts into injection and explicitly uses the complete injected template and closed vocabulary. Its source-only path remains a qualified provenance link to satisfy structural checker contract, without requiring that path in consumers. Feedback was read and has no explicit friction obligation; its friction flag remains absent and tests verify no friction fragment is injected there. Routing, outcome submission/verification and external MCP contracts are unchanged.

Canonical manifest populated by official `node scripts/populate-manifest-skills.js --update`; official `bash scripts/sync-harness.sh` refreshes three shadow projections, Claude manifest and generated AGENTS version row. Installer mapping version updated consistently. Consumer documentation and Unreleased changelog describe portable definitions. Review-bundle manifest remains unchanged and its official --check passes: none of its distributed files changed.

## Actual RED → GREEN

Node22.23.3, all shells rtk, PATH begins supplied Node22 directory followed by `/home/mathias/.cargo/bin:/usr/local/bin:/usr/bin:/bin`. TMPDIR and all logs under `/home/mathias/.cache/observatory-review/friction-fix-{tmp,logs}`; no new /tmp worktree or test residue.

Added initialized-consumer regression to existing `scripts/test-chamallaw-roster-install.sh`: official fresh developer init→actual Chamallaw install, then require the full canonical fragment body, including template and closed vocabulary, embedded in each Codex/Claude/OpenCode shadow projection. Original source4cd completes init/install successfully, then assertion REDexit1: complete canonical definition absent. `red.log`. This is a behavior assertion, not setup/import failure, and does not demand a source-tree file when correct inline instructions suffice.

Same regression after correction passes exit0, `green.log`. Extended smoke additionally verifies core preamble, no pipeline fragment for phase:null, no friction for feedback, idempotent projection bytes, initialized consumer custom core override preserved verbatim with canonical missing-local-fragment fallback, dry-run mapping preservation, collision refusal/local hook byte identity, force+dryrun no writes and intentional force replacement. `installer-final.log`, exit0. Its two EC-7 warnings are accurate: the minimal developer initialization lacks pipeline skills roster-intake/roster-ship; no live pipeline/MCP execution claimed.

Existing sync test suite plus two new tests passes13/13,0fail/cancelled/skipped: local core/fragment overrides preserved verbatim; friction:false and phase:null suppress their fragments; absent required core or fragment yields explicit error. `sync-focused.log`, exit0. Missing-definition scenarios use isolated copies of the existing sync script, not a new test harness.

Final override audit caught an additional corner in my initial correction: a consumer-local friction fragment without a local core was ignored because fragment selection followed the fallback core directory. Added a real assertion to the local-override test; it completed RED1fail/0pass, `fragment-only-red.log`. One-line correction resolves local friction independently of core selection. `sync-final.log`13/13 passes. This is author correction during implementation, not an independently reviewed finding. The first full/focused runs below are retained but superseded for final-source evidence by final executions after this executable change.

## Final gates

- Clean Node22 `npm ci`: exit0, `final-ci.log`;8 packages, no vulnerabilities, blocked optional esbuild postinstall qualified.
- `npm run build:ts`: exit0, `final-build.log`.
- Initial `npm test`: exit0,640pass/0fail/cancelled/skipped across42 summaries, `full.log`; final rerun after fragment-only correction also completed actual exit0,640pass/0fail/cancelled/skipped across42 anchored summaries (`full-final.log`). Eight existing unused-schema-value warnings and absent advisory cost log remain qualified. All catalog/friction/manifest/projection checks pass.
- Initial combined focused installed bundle/sync/shadow/help cases: exit0,83pass/0fail/cancelled/skipped, `focused.log`; final-source focused execution also completed exit0,83pass/0fail/cancelled/skipped (`focused-final.log`). Includes30 lifecycle installer cases,19 bundle generator cases,13 sync cases,6 shadow report/gate cases and15 compiled CLI cases. Final-source extended initialized-consumer installer smoke completed exit0 (`installer-complete.log`).
- Official review-bundle generator `--check`: exit0, current unchanged v1.9.0 bundle.
- Whitespace check: exit0 before final gates.

Independent review of the final correction revision remains required. Root owns library-index annotation/render/commit; upstream Roster mechanisms reused, no dependency selected. Earlier260 architect review and4cd custody authorship are not relabeled as independent review of this revision. No source changes in previous checkouts, no central trace/ledger/phase events, no remote action.

Phase friction retained here rather than mutating unrelated shared skills-meta logs: the initial proposed flag-only solution was insufficient for flat initialized consumers; own later override audit disproved the initial core-derived fragment selection and was repaired with a completed RED→GREEN. Classes:evidence. Canonical central phase/trace/ledger writes remain coordinator-owned. Source-only Python test cache removed after tests; no tracked generated residue outside the official projections.
