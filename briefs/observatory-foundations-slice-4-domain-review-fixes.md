# Slice 4 frozen domain review fixes

Status: INTERIM; no full AC3/18 or parent acceptance claim. Independent review of be46aeb reproduced three accepted-API contradictions. Each was reproduced locally as a genuine Vitest assertion failure before correction.

NetworkData.reconcile now rejects a supplied execution protocol that contradicts the proven target helper context, including successor execution protocol across activation. ObservationStore refuses omitted lifecycle epochs after a noninitial collection or observer generation, so a stripped pre-pause proof cannot regain authority. Admission compares concrete rights and constants context facts with its proof context rather than trusting an equal opaque key alone. Existing context-fact accounting is reused.

Focused actual store and monitor tests: 29 PASS. Whole current worktree: 103 unit tests PASS, check/build PASS. Two new production B-promotion browser checks PASS, but those monitor/page edits are intentionally outside this narrow review-fix commit and remain in-progress consumer work. Frozen domain compatibility was previously established by 38 browsers; no broad browser criterion or complete S4 acceptance is asserted by this correction.
