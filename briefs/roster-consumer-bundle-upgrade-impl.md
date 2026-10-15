# Observatory local review bundle 1.9 implementation

Implementation-only handoff; independent review and QA remain required. No publication, deployment, global settings or installed-skill refresh.

Base: `4b67dc3f40f1f10fa3b921743eb9ee4cc7b0ab17`. Branch: `chore/roster-bundle-1.9`. Worktree: `/var/tmp/observatory-roster-bundle-1.9`.

Published upstream source `107fbe751136dd8ddeddb806ecefb63f2ab8e4c7` and reviewed candidate `c5eaf9836b45ee215bf70dd21d66853a3838f623` both resolve to tree `d3bb4b47bf2bb4a82a8b3d42b8bb4eedaa3a3b09`. Extracted the published commit with git archive to `/var/tmp/roster-published-107fbe7`; no upstream checkout changed. Read canonical library index and reused its existing Roster tool distribution; no dependency introduced. Root owns the index update after independent acceptance.

Ran the official archived installer, without force:

```sh
bash /var/tmp/roster-published-107fbe7/scripts/review-bundle-install.sh upgrade --from-checkout /var/tmp/roster-published-107fbe7 --target /var/tmp/observatory-roster-bundle-1.9
```

Before: installed verifier PASS, 28 SHA-matched files, version 1.8.0. Upgrade: exit 0, no collision or skipped file. After: installed verifier PASS, same 28 files, version 1.9.0. Only generated consumer notes and manifest changed: scope custody is now explicitly shared and removal semantics documented. Runtime JS/schema bytes already matched published upstream and remain identical.

Hashed all 530 tracked regular files before installation and again after checks: exactly these two generated paths changed; all other 528 files match, including app src/tests, root packages, unrelated scripts, local rules and CJS scope. Raw before hashes and custody result: `/var/tmp/observatory-roster-bundle-evidence/before-sha256.json`, `custody.json`.

Current hashes:

- `scripts/REVIEW-BUNDLE.md`: `751ccd4bad8579a719b3dcd1e7e3f832f8a540b74ad675f8989aa5a02d0a4d74`
- `scripts/review-bundle.manifest.json`: `15de5ce401dc376d59eff9d11e0f84a99d66b86862db46bae60d0e8042faa509`
- `scripts/package.json`: `8005a3491db7d92f36ac66369861589f9c47123d3a7c71e643fc2c06168cd45a`
- `package.json`: `4152fa0b2b90cfd4f09d973dee42c34e5d457057c67d6e8a22fd02e60840ffd1`
- `package-lock.json`: `82cbfe2f92668f5e6323bc0969b25eebc66d56f2d8308b993eca398d2d146fba`

Actual installed CLI probes under the existing ESM consumer (Node 22.23.3):

- Published upstream QA fixtures: below cap 0, cap hit 1, missing audit 3, malformed schema 2, legacy missing counter 0 with warning, cross-runtime nonqualifying case 0.
- Normalizer empty array: exit 0 with no findings/rejections; fresh lifecycle: exit 0, round 1/cycle 1/fresh true.
- Review convergence legacy GO fixture: full gate exit 0, no violations; legacy warning retained, no claim of fan-out trace validation.
- QA xruntime provider-free availability: first call correctly refused exit 2 without a persisted GO review fixture; added a temporary explicit GO fixture, reran exit 0 `available`, source `review-go`, then removed it. The availability classification is not an external model run. No write flag, provider request or MCP action. Both logs preserved; nonignored-briefs warning retained.

Probe source/receipts: `/var/tmp/observatory-roster-bundle-evidence/qa-*.log`, `normalize.log`, `lifecycle.log`, `review-convergence.log`, `xruntime-availability.log`, `xruntime-availability-corrected.log`. Initial mistaken discovery paths (manifest spelling and absent source tests/fixtures) were corrected before mutations/probes; these were read failures, not successful gates.

Clean npm ci PASS, TypeScript check PASS, unit tests **264/19 files PASS**, production build PASS under Node 22.23.3. Actual durations and exits in `application-results.json`; respective raw logs adjacent. No separate lint script exists. No browser run: no product/DOM/CSS/browser behavior or dependencies changed. No claim to repeat the 38 foundation criteria or full V3 QA. SHA custody checked again after those commands. `git diff --check` required before commit.

No unresolved implementation finding. Required next: separate reviewer and QA validate the exact generated diff, upstream identity, SHA custody and meaningful installed CLI behavior before root integration.
