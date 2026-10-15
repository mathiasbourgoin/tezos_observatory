# Proposed acceptance interface — draft

No runner exists or runs in this phase. No application pass is claimed. Reuse native project test tooling; no generic harness or new dependency is authorized.

Each final CHECK-N maps to its AC and invokes a planned feature runner through a guarded module import:

```bash
rtk proxy node --input-type=module -e 'try { const m = await import("./scripts/check-observatory-block-intervals.mjs"); if (typeof m.run !== "function") throw new Error("runner export missing"); const r = await m.run(process.argv.slice(1)); if (!r || !Number.isInteger(r.assertions) || r.assertions < 1 || ![0,1].includes(r.code)) throw new Error("missing assertions or invalid result"); process.exitCode = r.code; } catch (error) { console.error(error); process.exitCode = 2; }' AC-N --browsers chromium,firefox
```

The implementation planner may resolve a proportionate module structure, but preserves this public interface after validation. run(args) returns {code:0|1, assertions:positiveInteger} only following actual execution of all selected criterion assertions. Runner/setup/import/build/fixture/browser/unsupported-AC/missing production-consumer invocation/zero assertions/unhandled page execution errors throw and become ERROR exit>=2. A mismatch is exit1 only after an actual behavioral assertion fired. Both requested engines must execute actual served production build for reader/lifecycle ACs; one engine, test source inspection, a fake browser, runner child exit0 alone, report-file presence or a unit-only reimplementation cannot satisfy that boundary. Criterion evidence names immutable integrated source revision, command, engine, actual cases/assertions and outcomes. No assertions count alone proves coverage: each AC obligation must be demonstrated. Missing runner presently yields ERROR>=2, never a contractual RED (assertion) and never GREEN.

Candidate grouping to avoid an epic-sized acceptance interface:
1. endpoint arithmetic and nominal fixed T/cutoffs; include n1, irregular/protocol/skipped levels.
2. floor equality and crossing interval, including long stall.
3. shared earliest partial and forbidden invalid-floor fallback.
4. missing/no-recent-E/unsafe/malformed/future/offset/zero/reverse endpoints and fine formatting.
5. exact bounded TzKT request plan/privacy/network independence.
6. fixed-E recheck versus ordinary growth/reorg/removal/identity contradiction.
7. streaming cap, ignored-abort deadlines, concurrency/read caps and cleanup.
8. same-response indexer metadata versus filtered E; unknown neverzero.
9. permitted starts/cooldown/coalescing/failure triggers/no timer reads.
10. interruption/initial hidden/BFCache/manual pause/generation late completion.
11. monotonic stale120s/walljump/sticky invalidation/old-block age and immutable mean.
12. production compact three means/source/coverage/native refresh/details/reader preservation/non-live-announcement.
13. production responsive/theme/zoom/contrast/text sizes/current-two-future preservation, with independent visual inspection where automation cannot establish readability.
14. README/source-limitation wording and preserved foundation/V3 claim+check interfaces.

Final FR/AC/check IDs await fresh formalizer and challenge resolutions. No claims metadata is generated from this draft.
