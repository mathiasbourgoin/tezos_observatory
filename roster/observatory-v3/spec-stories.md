# Observatory V3 accepted-input stories

Drafting input for fresh adversarial challenge, 14 October 2026. Derived from full validated intake (including four explicit root specification policy decisions), fresh research and resolved clarification. No specification gate or production implementation is claimed.

### US-1: Inspect exact selected evidence (Priority: P0)
As a consensus investigator, I want to select a precisely attributed observation and candidate so that I can read exact phase evidence without pooling unrelated identities.
**Why this priority**: The redesigned workspace must preserve the accepted evidence trust boundary.
**Scope**: Does NOT change foundation accounting, identities, coverage or finality authority.
**Independent Test**: On production `/`, deliver distinct candidates/payloads and source-qualified phases, select each and inspect exact identity/power/state without using navigation motion.
**Acceptance Scenarios**:
1. **Given** Shadownet source A has applied5489251/r118/hashH and coherent observed5489252/r0/payloadP with no proposal hash, **When** the investigator selects it, **Then** selected network/source/context/level/round/payload and votes-only status are explicit, actual applied H remains separate, producer/hash are unavailable, and both phase powers6689/7000, threshold4667, deficit0 and signers24/25 remain readable. [US-1-S1]
2. **Given** A observes candidatesH1/H2 at5489252/r0 sharingP and candidateH3 forQ, **When** the investigator selects H2 then H3, **Then** actual candidate hashes and matching-only producer are exposed, sharedP voting evidence is labelled, Q stays independent, and no selection emits a fabricated threshold event. [US-1-S2]
3. **Given** preattestations have a usable exact source snapshot with zero and attestations have interrupted/missing coverage, **When** the investigator opens phase details, **Then** justified source-snapshot zero is distinct from attestation partial/unavailable, context/receipt/age are visible, and disconnected observer does not become global chain stall. [US-1-S3]

### US-2: Navigate truthful observed branches (Priority: P0)
As a live consensus observer, I want a spatial branching navigator to follow actual rounds UP and actual levels RIGHT so that I can distinguish observed progress from forecasts and gaps.
**Why this priority**: Directional observation is the maintainer's central interaction model.
**Scope**: Does NOT create history for missing observations, flatten navigation into a list, or imply canonical/finalized blocks.
**Independent Test**: Feed accepted eligible transitions to production and inspect camera focus destinations and solid/dashed/gap relationships without participant search.
**Acceptance Scenarios**:
1. **Given** Follow live anchors A5489252/r0 and a coherent adjacent actual r1 arrives, **When** it is accepted, **Then** focus moves UP to observed r1, conditional r2 remains above and5489253/r0 remains right, with at most one160ms default/200ms maximum finite transition. **Given** next5489253/r0 then arrives coherently, **When** accepted, **Then** focus moves RIGHT. [US-2-S1]
2. **Given** observed5489252/r0 remains eligible while clock estimates r6→7 and its r1 prediction expires, **When** ticks and duplicate receipts occur, **Then** observed anchor/camera/history remain r0, no observedr1–r6 are created, and later clock context is separate. [US-2-S2]
3. **Given** first accepted destination skips to5489255/r0, or same-height reorg replaces contextH1 withH2, **When** live context updates, **Then** view directly/static recenters with explicit gap/reorg/status and no fabricated intermediate nodes, ancestry or motion; oldH1 authority is withdrawn and old r0 is historical/unresolved, not live. [US-2-S3]
4. **Given** several accepted adjacent observations arrive in one burst ending next level, **When** following live, **Then** at most one animation follows the final eligible destination with a single RIGHT next-level transition; no queued turn reenactment, document-scroll change or focus theft occurs. [US-2-S4]
5. **Given** coherent observed5489252/r118 and its actually observed adjacent successor5489253/r0, **When** Follow live advances, **Then** horizontal camera focus moves RIGHT while vertical focus stays stable; next-level round reset does not create diagonal/downward movement. **Given** same-levelr118→r119, **When** observed coherently, **Then** vertical focus moves UP while horizontal stays stable; numerical levels/rounds do not create unbounded rendered coordinates/resources. [US-2-S5]

### US-3: Read both conditional opportunities (Priority: P0)
As an opportunity reader, I want both selected-relative future targets, RPC proposers and qualified timers visible together so that I can assess alternatives without mistaking predictions for receipts.
**Why this priority**: Both branches are mandatory on phones and wide displays, even when one is unavailable.
**Scope**: Does NOT promise deadlines, invent future hashes or replace observed round with clock round.
**Independent Test**: On production `/`, supply coherent captured rights/timing then remove each independently and inspect both nodes plus text equivalent.
**Acceptance Scenarios**:
1. **Given** observed5489252/r0 with coherent fixed-head rights establishes proposerD1 for5489252/r1 andD2 for5489253/r0, **When** the reader views360/390px, **Then** both targets/proposers/timer labels are simultaneously readable in the local overview; future hashes unavailable; each source/context and timing assumption is inspectable. [US-3-S1]
2. **Given** same-level rights missing and next-level rights known but hypothetical predecessor timing unproven, **When** the reader inspects, **Then** each branch separately shows its exact target and rights/timing unavailable state, without borrowing the other branch's proposer/deadline. [US-3-S2]
3. **Given** live prediction captures deadline19:52:36Z and remaining6s at19:52:30Z, **When** pinned and live collection advances, **Then** opportunity deadline/remaining6s stay captured with actual19:52:30Z source/context/as-of label; selecting historical capture never recalculates using current rights. **When** following live again, **Then** current coherent branches resume their own qualified timers; expiry says elapsed/awaiting observation. [US-3-S3]

### US-4: Keep inspection stable while collecting (Priority: P1)
As a historical evidence reader, I want explicit receipt navigation, pinning, Follow live and collection pause so that incoming observations cannot displace my reading position.
**Why this priority**: Full session inspection is usable only when selection/control state survives updates.
**Scope**: Does NOT provide archival persistence or alter150/100/100 bounds, one frozen pin per network, source budgets or cancellation rules.
**Independent Test**: Pin a retained observation, send multiple new observations and eviction, then exercise navigation/follow/pause with request interception and stable controls.
**Acceptance Scenarios**:
1. **Given** startup Follow live and investigator focuses search, opens details and selects candidateH2 from retained history, **When** new identities arrive and same-H2 facts enrich, **Then** inspection stays pinned onH2 with stable camera/focus/scroll/search/order/disclosures; same-identity facts may enrich, captured opportunities remain fixed, and newer count excludes replay/enrichment/double-counted instance promotion. [US-4-S1]
2. **Given**150 retained instances and oldest pinned item is evicted by the151st, **When** reader inspects its frozen copy, **Then** one static per-network snapshot is labelled outside session history; Previous observation is unavailable there. **When** choosing Latest observed, **Then** one-off newest coherent LIVE item is pinned; **When** choosing Follow live, **Then** ongoing following resumes or explicit live unavailable appears. [US-4-S2]
3. **Given** accepted candidates share coordinates/payload and receipt chronology differs from height chronology, **When** choosing Previous observation repeatedly, **Then** distinct retained selected-network selectable identities traverse first accepted monotonic receipt with unavailable at oldest; navigation pins and never implies block ancestry or pauses collection. [US-4-S3]
4. **Given** collection paused or document hidden/pagehide while streams/rights/aliases/comparison run, **When** local inspection/theme/navigation occur then page resumes, **Then** no external work starts while disallowed, obsolete responses cannot commit, manual pause survives, and inspection mode remains independent; permitted resume uses foundation generation/bounds. [US-4-S4]

### US-5: Inspect participants and independent source context (Priority: P1)
As a source investigator, I want searchable phase-specific committee evidence and explicit independent comparison so that I can attribute missing/received power without global claims.
**Why this priority**: The inspector must make its evidence limitations operationally usable.
**Scope**: Does NOT add watched filters, receipt timelines, undisclosed source aggregation or comparison polling.
**Independent Test**: On selected production observation, exercise committee search/sort and an explicit second-source request without requiring graph progression.
**Acceptance Scenarios**:
1. **Given** validated-rights delegateD1 aliasBaker Alpha power3/5 has received preattestation only, **When** searching' alpha ' orD1 address then sorting alias/address/power, **Then** case-insensitive substring matching and exact phase receipt/power/share/eligibility/context work, empty query restores all, and new alias/matching rows never reorder existing reader order without explicit resort. [US-5-S1]
2. **Given** unproven rights signerD2 and interrupted attestation coverage, **When** viewing committee and source evidence, **Then** D2 remains separately inspectable raw observation, validated-rights rows show phase-specific unavailable/partial/absent-qualified states, and no network-wide inactive/missing set is claimed. [US-5-S2]
3. **Given** sourceA selected contextH1 and configured sourceB, **When** explicitly comparing and B reports conflicting headH2 or insufficient historical context, **Then** exact compared fields/context/time/age yield divergence/partial/unavailable, no powers pool, maxthree reads/8s each/24s workflow and one in-flight hold, no retries/periodic refresh; age≥60s or invalidation gives stale without silent extra reads. [US-5-S3]

### US-6: Use one original full-width visual system (Priority: P1)
As a consensus reader on phone or ultrawide display, I want a coherent inspector-first workspace with persistent theme choice so that exact values and useful evidence remain readable across sizes and states.
**Why this priority**: A palette-only repaint or generic equal card grid fails the accepted product intent.
**Scope**: Does NOT copy reference graphics, add a capped central app shell, astronomy decoration or marketing slogans.
**Independent Test**: Render production normal/dense/error/long-value states across all eight widths and themes, then exercise explicit light/dark/system and failed storage.
**Acceptance Scenarios**:
1. **Given** a dense150-instance history, many committee delegates, competing candidates, long aliases and full hashes, **When** rendering360/390/768/1440/1920/2560/3440/5120 in light and dark, **Then** the full available width serves deliberate meaningful navigator/history/inspector/committee/provenance regions, exact values remain legible, no overlapping/clipped controls or document horizontal scrolling occurs, and phone overview retains both future options together. [US-6-S1]
2. **Given** reader choosesdark/light/system and reloads with available storage, **When** OS preference changes, **Then** explicit chosen theme persists and OS affects only system choice. **Given** storage denied/corrupt, **When** theme is changed, **Then** usable in-memory selection remains with honest fallback and no crash. [US-6-S2]
3. **Given** loading/empty/zero/unavailable/partial/stale/failure/divergent/pinned/frozen/paused/hidden-resumed/expired/missing-rights/missing-timing states, **When** inspecting rendered light/dark variants and interactive hover/focus/selected/disabled/disclosure/tooltips, **Then** original non-blue/violet roles, non-color network/phase/state cues, coherent type/strokes/icons/mark and readable exact paired scales hold with actual measured applicable contrast. [US-6-S3]

### US-7: Navigate accessibly with restrained motion (Priority: P0)
As a keyboard or touch reader, including one requesting reduced motion, I want native accessible navigation and stable updates so that the spatial view cannot block inspection or distract me.
**Why this priority**: Directional novelty must not remove readable controls or accessible evidence.
**Scope**: Does NOT require dragging, specialist keyboard knowledge, continuous animation or decorative external work.
**Independent Test**: Complete production selection/branches/history/search/disclosures/pause/theme/comparison using keyboard and touch, with reduced motion enabled and multiple incoming updates.
**Acceptance Scenarios**:
1. **Given** phone360px with keyboard focus on Previous observation, **When** activating controls/candidates/text equivalents/search/disclosures/theme/pause/comparison and local history navigation, **Then** controls have semantic names, visible focus, logical reading order, readable target labels and usable touch targets; graph dragging is optional and no evidence requires document-wide sideways scroll. [US-7-S1]
2. **Given** reduced motion and coherent round/level advances, **When** following live, **Then** camera snaps to actual destination with static direction/state equivalent; meaningful status announcement is coalesced rather than narrating each vote and focus/document scroll stays unchanged. [US-7-S2]
3. **Given** normal motion, pinned inspection and changing clock/power/health, **When** updates arrive, **Then** there is no decorative pulse, continuous loop, recovery celebration or clock-driven observed movement; finite motion only approved actual-progress following transitions, and no effect triggers external requests. [US-7-S3]

### US-8: Release only with independent production evidence (Priority: P0)
As a release coordinator, I want complete deterministic and independent rendered evidence so that study acceptance and passing mocks cannot substitute for production correctness.
**Why this priority**: Foundation trust and full design contract require independent gates before maintainer publication review.
**Scope**: Does NOT authorize deployment or claim bounded live checks certify global provider coverage.
**Independent Test**: Inspect reviewable release artifacts tying source revision to real Node22 checks, production browser assertions, state/viewport screenshots, measured contrast and independent reviewer/QA findings.
**Acceptance Scenarios**:
1. **Given** foundations implementation has independent review/QA GO and V3 spec/plan approval, **When** fresh ASTRA directly implements, **Then** it reads integrated interfaces first, preserves original foundation38 acceptance checks and meaningful existing coverage, and independent fresh reviewer/QA—not ASTRA—verify Node22 install/check/unit/e2e/build and Chromium/Firefox production behavior. [US-8-S1]
2. **Given** a candidate release, **When** generating state/viewport and contrast evidence, **Then** actual production screenshots cover the full required width/theme/state/interaction matrix, reports identify exact tested source revision and measured surfaces, and independent reasoned critique judges original composition, dense usability and wide space rather than just overflow/screenshot existence. Missing commands/browsers/data/report failures are errors, never fabricated green passes. [US-8-S2]
3. **Given** one origin/provider bounded read succeeds and another fails, **When** reporting verification, **Then** source coverage remains separately bounded/unknown, studies are explicitly preparation, active claims are obligations not implementation proof, and reviewed concrete result still requires maintainer publication/deployment approval. [US-8-S3]
