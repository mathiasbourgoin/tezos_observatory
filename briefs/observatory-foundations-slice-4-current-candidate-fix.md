# S4 current-level candidate correction

Status: INTERIM correction for independent frozen review; parent implementation remains in progress.

The independent reviewer reproduced a genuine assertion failure on frozen `1ca36e34e0957ebeacabf7ddc984d6fa11a86109`: after actual same-source head B123 was observed, a validated B123 candidate arrived before its committee was admitted. The facade replaced the observer with verified parent B122. Its proof then contradicted the immutable receipt's observed B123 context and the store correctly withheld admission.

The owner reproduced that exact behavioral RED in the actual ObservationStore/NetworkData consumer: `expect(store.target(record.identity)?.admission).toBeDefined()` received undefined. The correction preserves an already observed same-level source head as the observer and keeps the verified candidate parent as the execution-rights anchor. If no same-level observed head exists, the previously supported candidate-parent proof remains available; it is not emitted as an observed applied-head packet. No receipt compatibility guard was weakened and original candidate receipt identity remains untouched.

A second genuine RED checked the newly selected head's source boundary: injecting observer A's head into a B candidate previously resolved with borrowed A context. Reconciliation now rejects an unproven or different-source observer head before helper work. Its source network and exact URL must match the candidate workflow. Both regressions pass.

Verification: Node22 TypeScript check, 122 unit tests /17 files, build, native AC3=23 and AC18=21 assertion groups PASS. Final unchanged-code browser gate: 46 Chromium/Firefox scenarios PASS in17.3 seconds. No parent phase completion, history/comparison closure, deployment or publication is claimed.

The S5 work in guards/pending completeness/store coverage was saved as a local temporary patch, removed before this correction and is restored only after this clean correction commit. It is not part of this review revision. Prior S4 screenshots remain the original separately hashed evidence; ordinary suite-generated screenshot changes are restored after the run.
