# Observation vocabulary

- Applied head: the head a selected source reports as applied; not independent network-wide agreement.
- Validated proposal: a candidate validated by a source; not automatically canonical or final.
- Consensus instance: network, level, round and payload, with phase-specific votes and source/context attribution.
- Candidate: an observed proposal identified by block hash and matching context; candidates can share a payload.
- Voting power: committee power attached to observed distinct delegates, not token balance or operation count.
- Coverage: stated usable evidence scope for the selected source and instance; connectivity alone is insufficient.
- Missing/unobserved delegate: an expected participant whose relevant vote this source has not observed under stated coverage.
- Scheduled opportunity: protocol/clock-derived possible proposal time; not evidence a proposal arrived.
- Pin inspection: keep the selected historical instance while collection continues.
- Follow live: select the current supported live instance as observations arrive.
- Pause collection: stop external observation work; distinct from pinning.
- Session history: bounded observations retained in this browser session, not a chain archive.
