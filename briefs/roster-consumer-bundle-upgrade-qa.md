# Independent QA: local review bundle 1.9

GO — result: pass for implementation `dde42ad99e289dc5f6e8b132d7b056e5cde3ae2a`, consuming published Roster `107fbe751136dd8ddeddb806ecefb63f2ab8e4c7`. No observed defect or unresolved failing gate. This is local acceptance evidence; publication and deployment remain subject to maintainer approval.

Fresh detached checkout: `/var/tmp/observatory-roster-fresh-qa`. Evidence: `/var/tmp/observatory-roster-fresh-qa-evidence`. Read RTK instructions, QA skill, project authority, TypeScript rules, independent review and author implementation report. No application changes, global settings, external model calls or remote writes.

## Integrity and scope

Independently compared candidate against base `4b67dc3f40f1f10fa3b921743eb9ee4cc7b0ab17`: exactly `scripts/REVIEW-BUNDLE.md` and `scripts/review-bundle.manifest.json` changed. Therefore all tracked app, DOM/CSS, tests, root dependency manifests/lock and other scripts remain byte-identical. Diff whitespace check passes.

Manifest version is 1.9.0 with 28 files. Recomputed every installed SHA-256, compared each installed file directly against upstream git objects at the exact published commit, and compared manifest bytes against that commit: all match. This establishes exact immutable source independently of the retained distribution convention `source_ref: main`. Raw file/source proof: `integrity.json` in evidence directory.

## Executed checks

All application commands ran independently under Node **22.23.3**, with a fresh npm cache and own clean install: `rtk npm ci`, `rtk npm run check`, `rtk npm test`, `rtk npm run build`, each exit 0. Unit suite: **264 tests across 19 files pass**. No separate lint script exists. Commands, exits, timing and raw logs are in `commands.json` and adjacent logs.

Installed CLI checks, recorded in `cli-results.json` and adjacent logs:

- Verifier before and after official idempotent upgrade: exit 0, all 28 files verified. Upgrade from published archive without force: exit 0; final checkout remains clean.
- QA convergence using published below-cap, cap-hit, missing-audit, malformed, legacy-no-counter and cross-runtime fixtures: expected exits **0, 1, 3, 2, 0, 0**, all observed. Nonzero exits are expected fail-closed behavior, not failed checks.
- Normalizer on explicit empty array: exit 0, empty findings and rejections.
- Review convergence on explicit legacy GO fixture: exit 0. This checks installed dependency/schema closure; legacy warnings retained and modern trace enforcement is not claimed.
- Provider-free QA availability: exit 2 without persisted review GO; exit 0 after temporary synthetic GO fixture; fixture removed. No provider invocation or cross-runtime QA completion is claimed.
- Published focused bundle suite: exit 0, 19 tests pass. Full upstream test suite was not repeated.
- Official remover in a disposable consumer copy: exit 0. Shared `scripts/package.json` and `scripts/xruntime-exec.sh`, unrelated foundation script and synthetic consumer CommonJS script retain identical hashes. Bundle-owned QA CLI and manifest removed. `removal.json` records before/after hashes. Original QA checkout remained clean.

Browser `npm run test:e2e` was deliberately not run: exact whole-tree scope comparison proves application, browser tests and dependency bytes unchanged. This acceptance concerns generated metadata and installed CLI custody; no new browser behavior or broader V3/provider coverage is asserted.

Initial read-only discovery commands referenced an absent normalizer alias and absent upstream review fixture, then were corrected to actual installed normalizer and an explicit local legacy fixture. These were setup read failures, not product test failures. Every executed gate has complete passing or expected-negative evidence.
