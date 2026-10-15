# Foundations slice 2 — root integration evidence

Status: INTERIM. Root accepted the independently reviewed lifecycle checkpoint and classifier correction; the complete foundations implementation and its final independent review/QA remain in progress.

Owned checkpoints `3d5fae608766c3c3adbea267c642cb8a7b3e45ed`, `35ff4557d99b7c687ce95355e7ae7859e1c12944` and `9e783f66b9f07201f187081f456aa694aae82c76` were integrated sequentially as root commits `784c468`, `b10d7f5` and `0a21b5f`. No merge conflict or app edit was required. Existing combined V3 obligations were preserved. No deployment occurred.

Root independently ran the following under Node 22.23.3 after integration:

| Command | Actual result |
| --- | --- |
| `rtk npm run check` | Exit 0 |
| `rtk npm test -- tests/unit/checkRunner.test.ts` | Exit 0; seven classifier regressions |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-4 --browsers chromium,firefox` | Exit 0; six assertion groups, actual production `/` in both engines |
| `rtk proxy node scripts/check-observatory-foundations.mjs AC-21 --browsers chromium,firefox` | Expected ERROR exit 2: comparison cancellation remains unimplemented; no full AC-21 pass claimed |

The independent [lifecycle review](observatory-foundations-slice-2-review.md) records the exact clean-install/check/build/57-unit/38-browser baseline and critical mixed-engine classification reproduction. The [C1 disposition](observatory-foundations-slice-2-c1-disposition.md) closes that critical issue with actual mixed-error exit 2, genuine assertion-only exit 1 and the final incomplete-criterion guard. The prior lifecycle-subset AC-21 exit 0 is historical partial evidence, not accepted full-criterion completion.

Context-compatible cache authority, ahead reconciliation, complete source-snapshot zero, full history/pins, search, comparison, opportunities and glossary closure remain assigned later slices. No parent COMPLETED, review GO or QA GO follows from this checkpoint.
