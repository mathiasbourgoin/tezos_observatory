# Foundation interaction migration during V3 implementation

Work in progress. These changes preserve the evidence assertions while adapting interactions to V3: selecting a retained identity immediately pins it; startup follows coherent eligible observations.

| Scenario | Previous interaction | V3 interaction | Preserved assertions |
|---|---|---|---|
| Source B ahead / failed B / late B body | Startup implicitly inspected unresolved B | Explicitly select B before inspection | Original responder, unknown power before admission, independently applied A, late-body rejection and bounded retry |
| AC-13 coherent zero becomes stale | Candidate click remained LIVE | Select candidate, then Follow before interrupting its source | Measured zero, stale withdrawal, original receipt, historical peak, pause/resume |
| Supporting raw eviction | Candidate click remained LIVE | Follow before evicting supporting raw data | Both current phases unavailable, original stale receipt, retained positive maximum |
| AC-27 phase filters | Candidate click remained LIVE | Follow before source coverage interruption | Exact absence versus unknown filters, source/context and unknown signer evidence |
| AC-35 comparison after candidate selection | Selection labeled observed A | Selection labeled historical A | Exact A responder, single failed B read, no cascade, unchanged power and provenance |

Application fixes exposed by these scenarios: pinned inspection retains access to other active/unresolved candidates; selecting unresolved evidence clears the previous pin; explicit retry is exposed for the selected retained active identity; captured source/context includes both rights responder and observer. No current opportunity facts are substituted into an uncaptured pin.

Logs are intermediate author checks, not independent review or QA certification. Final source-bound bundle remains pending.

Read-only domain interface addition authorized by root: `ObservationStore.navigationUnits()` returns an immutable detached bounded copy of existing selectable identity/sequence authority; `NetworkMonitorView.navigationUnits` forwards it. It does not change admission, timestamps, retention or counters. The navigation projection associates the inherited unit sequence with the original instance receipt and siblings with their original candidate receipt. The first candidate eviction case has a domain regression test; the page tests also exercise dropdown selection and promotion chronology.

The standalone applied-head clock now uses one shared projection in live and pinned views. It is explicitly independent of the pin and never supplies historical branch facts. A pin selected before its branch capture stays unavailable; the cancellation scenario asserts that state before explicitly returning to Follow for a fresh capture.
