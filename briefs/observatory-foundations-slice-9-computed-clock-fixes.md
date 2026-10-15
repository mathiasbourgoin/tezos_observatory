# S9 review corrections — computed calendar bounds and independent clock attribution

INTERIM; parent implementation and fresh whole review/QA remain open. Pre-fix frozen source: `212bbe90b53003353e6c8be4bdb7be3bd7ac4a9a`. This correction preserves the earlier R1/R2 evidence and does not claim a live-network incident or deployment.

The independent reviewer and owner reproduced a supported computed-output boundary: minimum1/increment8640000000000, actual observed header100/r0 and client time+5s produce a clock next endpoint outside JavaScript's renderable calendar, although the selected branch's first boundary remains valid. The owner's direct production-helper assertion failed before the correction; both real-page engines completed assertions showing `Invalid Date`. The estimator now returns unavailable when its computed round is unsupported or either computed endpoint cannot be safely represented and rendered. All consumers handle that optional result. No arbitrary protocol parameter cutoff was added, and the selected branches remain independently known when their own proofs are valid.

The independent applied-head clock is now explicitly labelled “Independent clock estimate”, “next estimated round boundary”, and “separate from selected branch deadlines”. Its visible caption identifies the actual applied reference, observer, actual parameter responder, target and execution protocol. The responder can differ from the observer; neither receipt is relabelled. The existing text wrapping class is reused; no CSS or geometry redesign is included. A real-page fixture proves the independent18s clock versus each selected12s branch and the distinct actual TzKT observer/SmartPy parameter responder.

Owner RED: one actual helper assertion (`/tmp/observatory-s9-computed-calendar-red.json`) and four completed browser assertions (`/tmp/observatory-s9-clock-qualification-red.txt`), with no import/setup/runtime failures. After correction the same four browser scenarios passed. The former “Scheduled opportunity” legacy expectation is updated to the explicit independent-clock label while retaining its exact level/estimated-round assertions.

## Frozen correction gates

Node22.23.3: typecheck exit0; 258 unit tests across19files PASS; build exit0; full136browser scenarios PASS in Chromium/Firefox on immutable code. Original semantic commands AC12=29, AC15=2, AC33=2, AC34=33 assertion groups PASS; browser-required commands ran both engines. The original38 inventory in the base S9 artifact remains historical evidence, not a substituted final whole-source run. Fresh whole38 closure/review/QA remains S10.

Fresh S9 screenshots show this corrected visible clock qualification, preserving the old captures in Git history. SHA256:

- `slice-9-chromium.png`: `27219b02cbafd9279e719292b420d007e7d7c87fc698f71cea2979383584748c`.
- `slice-9-firefox.png`: `95ed299e944035dcef3a06294a545392032b5a7f3a4ac8d94217774cf4796f1f`.

S1/S4 unrelated screenshots are restored. No parent completion event, deployment, generated KB replacement or dependency change is included.
