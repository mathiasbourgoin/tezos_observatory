# PR86 concrete shipping preparation

Prepared 2026-10-15 under root delegation. No publication, push, merge, comment, candidate code change or ship event. This prepares the concrete maintainer gate.

Exact HEAD c5eaf9836b45ee215bf70dd21d66853a3838f623, tree d3bb4b47bf2bb4a82a8b3d42b8bb4eedaa3a3b09. Porcelain status clean; merge base=current main254e36b2ef2c0ca5ed65a9606e8689189a26b329. Six linear commits, zero merges;46 changed paths,2871 insertions/163 deletions. Whitespace check passes. Origin git@github.com:mathiasbourgoin/roster.git. No rebase needed while main stays unchanged; any base change requires reassessment and exact-source gates.

Commits oldest first:64f5e278 installed ESM tools;0269b279 Beta overflow;38634df module scope protection;2608681 successful help stdout;4cd0f78 shared CommonJS scope custody;c5eaf98 portable friction. All conventional fix subjects.

Read complete canonical review.json, gate-report.json, qa.md, qa-state.json, state.json and impl.md. Review GO exact c5 with four independent roles, actual nonstatic convergence exit0/six trace entries/no findings. QA GO exact c5: own Node22 clean ci/build/full640/focused83/smoke/manifest/diff and ten supplemental consumer probe groups. Independently recomputed anchored raw totals: tests640/pass640/fail0/skipped0, focused83/pass83/fail0/skipped0. QA convergence raw has no warnings/violations, round1/cycle1 qualifying0/5. Logs `/home/mathias/.cache/observatory-review/roster-pr86-qa-logs` present. Ledger current_phase qa preserves actual final review and QA source-qualified events. Historical pending statements in impl are superseded by actual current gate artifacts.

Code-intel conditional skip; actual current QA OpenCode breaker skipped-degraded after historical connection failure. No second-runtime success or live MCP promotion claimed.

## Remote facts and risks

Actual read-only GETs: PR86 OPEN DRAFT, head7f78adff66417f64156ba06bf403993d34a42833 on fix/esm-consumer-runtime; base/main254e36b2ef2c0ca5ed65a9606e8689189a26b329. Old draft dirty/nonmergeable/nonrebaseable. Its stale body still describes bundle1.8 and obsolete unresolved catalog failure; prepared replacement `briefs/roster-pr86-pr-body.md` contains no machine-local information. Old head has0 check runs and0 statuses; combined pending proves no running/passing CI. Repo permits rebase only, main protected but checks absent/admin enforcement false/force allowed, rulesets empty. These settings never authorize bypass. CI active, Node22, PR main/next and push main/next triggers. Remote updated-head CI remains mandatory before merge, regardless empty required checks.

## Action prepared, not executed

Supplemental CI commands executed by this preparation agent on exact c5 with explicit Node22.23.3: `npm run test:review-bundle` PASS30/fail0/skip0,26.489s; `npm run claims:check` fresh f8b28ee754c4e720fd5e4c55696a0162a3a921b36e52454fbd308200ec8de2e9; `node scripts/populate-manifest-skills.js --check` current42skills; `bash scripts/check-leak-diff.sh 254e36b2ef2c0ca5ed65a9606e8689189a26b329` PASS2841 added lines/45changedfiles. Receipt `briefs/roster-pr86-pre-ship-gates.json` contains exact outcomes/tool receipts. Initial host default Node26 run also passed30 but all required results were then actually obtained with explicit Node22; no failed product gate or source change. No CI run remotely yet.

Update existing PR86 to reviewed c5, replace public description, mark ready, await actual current-head CI; obtain applicable maintainer merge authority, rebase merge exact head. No new PR or invented closing issue. Before action repeat GET PR/main/source cleanliness. Stop if head differs from7f78adf, main differs from254e36b or candidate differs fromc5. Existing old objects/worktrees remain preserved. Explicit lease prevents overwriting concurrent feature updates; never force main.

```sh
rtk proxy git push --force-with-lease=refs/heads/fix/esm-consumer-runtime:7f78adff66417f64156ba06bf403993d34a42833 origin c5eaf9836b45ee215bf70dd21d66853a3838f623:refs/heads/fix/esm-consumer-runtime
rtk proxy gh pr edit 86 --repo mathiasbourgoin/roster --body-file /home/mathias/dev/tezos_observatory/.git/local-briefs/roster-pr86-publication-body.md
rtk proxy gh pr ready 86 --repo mathiasbourgoin/roster
```

Verify resulting PR head and actual CI workflow run head_sha/jobs/conclusions. Empty required-check output is insufficient. Only after current-head CI success and applicable explicit merge approval:

```sh
rtk proxy gh pr merge 86 --repo mathiasbourgoin/roster --rebase --delete-branch --match-head-commit c5eaf9836b45ee215bf70dd21d66853a3838f623
```

Verify merged_at/merge_commit_sha/main ancestry and delivered tree. Rebase can change SHAs; tree equivalence and actual ancestry matter. CI failure or moved main stops merging and requires correction/requalification. Preserve local worktrees when deleting remote branch.

Read complete roster-ship1.7.0, human-validation, escalation and project-authority. Skill Step4: “Wait for explicit human confirmation after the quiz passes”; Rules: “Never push without an explicit human gate.” Project authority delegates intermediate quizzes to root but says “Maintainer approval remains required for publication and deployment of the concrete reviewed result.” Root interprets persistent authorization and owns any concrete question. Preparation does not invent a ship BLOCKED or COMPLETED event.

After actual merge, conditional KB sync and advisory metabolism/cost/friction housekeeping remain; no broad git add or attribution of new source to reviewed c5. No auto-install cost tooling. Full roadmap remains active.
