# Story draft — observatory-foundations

Source: full accepted intake and fresh research. Scope covers all eleven observable acceptance obligations.

### US-1: Identity and exact power (Priority: P0)
As a consensus reader, I want to inspect distinct proposals and precise vote totals so that competing evidence cannot create a false quorum.

**Why this priority**: Evidence integrity is prerequisite to safe interpretation.
**Scope**: This story does NOT cover independent comparison and inspector interactions.
**Independent Test**: Feed same-round candidates and individual/aggregate replay into one source fixture.
**Acceptance Scenarios**:

1. **Given** observer A reports level 120 round 2 block hashes H1/H2 sharing payload P, **When** the reader inspects candidates, **Then** both identities remain selectable; no producer is inferred from shared payload. [US-1-S1]
2. **Given** committee has D1 power 3, D2 power 2, total 5 and threshold 4, **When** D1 arrives individually and twice through an aggregate for payload P, while D2 votes payload Q, **Then** P remains power 3, Q remains power 2; deficits are 1 and 2. [US-1-S2]
3. **Given** rights or consensus input contains NaN, Infinity, negative/fractional/unsafe integers, duplicate contradictory rights or threshold 6 for total 5, **When** data arrives, **Then** invalid evidence cannot drive gauges, signer totals, eviction or quorum. [US-1-S3]

### US-2: Attribution, coverage and independent health (Priority: P0)
As a on-call reader, I want to inspect provenance and phase availability separately from chain progress so that source silence is never mistaken for global inactivity.

**Why this priority**: Evidence integrity is prerequisite to safe interpretation.
**Scope**: This story does NOT cover history controls and secondary comparison.
**Independent Test**: Replay coherent and interrupted source snapshots while changing current transport provider.
**Acceptance Scenarios**:

1. **Given** instance 120/2/P is established from A with coherent head/parent/rights, **When** A supplies a full validated-pending snapshot afterwards with no phase votes, **Then** that phase reports source-snapshot measured zero, not global completeness. [US-2-S1]
2. **Given** only preattestation D1 has arrived or rights/identity is missing, **When** the attestation panel renders, **Then** the other phase remains unavailable/partial; positive observed power explicitly states partial coverage. [US-2-S2]
3. **Given** A reconnects while a valid head advances and old evidence came from B, **When** the panel refreshes, **Then** chain progress and observer health remain independent; old B evidence retains B requested/observed context and honest receipt/freshness. [US-2-S3]

### US-3: Context-safe auxiliary data and ahead evidence (Priority: P0)
As a consensus reader, I want to reconcile ahead observations with their observer context so that delayed heads and forks cannot corrupt counted evidence.

**Why this priority**: Evidence integrity is prerequisite to safe interpretation.
**Scope**: This story does NOT cover comparison user workflow and visual layout.
**Independent Test**: Drive same-height forks, slow responses and source-local ahead evidence in deterministic RPC fixtures.
**Acceptance Scenarios**:

1. **Given** global applied head A is 120 while B provides identifiable level 123 evidence, **When** that evidence arrives before B head/rights, **Then** retain it unresolved, with no quorum; once B coherent current 122 or 123 context establishes target and rights, count it without global clock/head rejection. [US-3-S1]
2. **Given** rights/eligibility were requested for head H1 and same-height reorg establishes H2, **When** H1 response arrives late, **Then** H1 cannot populate H2 context; eligibility exposes requested context, age, stale/unknown state; freshness lasts at most 60 seconds with exact coherent context, invalidation immediately stale; reuse requires contextual justification. [US-3-S2]
3. **Given** many unresolved observations refer to one new material context, **When** reconciliation fails or repeats, **Then** one workflow per network/source; at most one attempt per 15 seconds for new material context; no permanent polling/fallback cascade; failure stays unresolved; eligibility keeps bounded workers and no Mainnet fanout. [US-3-S3]

### US-4: Collection lifecycle (Priority: P0)
As a browser reader, I want to pause all observation work or hide the page so that privacy and resource limits apply to every external request.

**Why this priority**: Evidence integrity is prerequisite to safe interpretation.
**Scope**: This story does NOT cover pinning and comparison semantics.
**Independent Test**: Record all stream/helper/alias/comparison requests around lifecycle transitions.
**Acceptance Scenarios**:

1. **Given** document is initially hidden, **When** application initializes, **Then** no external collection or auxiliary work starts. [US-4-S1]
2. **Given** streams, rights, aliases, eligibility and comparison are in flight, **When** reader pauses or document becomes hidden or pagehide fires, **Then** all external work is cancelled and no cancelled response can commit. [US-4-S2]
3. **Given** reader resumes after repeated pause/hidden transitions, **When** new generation starts and old responses resolve, **Then** only current permitted generation commits; retries remain bounded. [US-4-S3]

### US-5: Bounded session inspection (Priority: P1)
As a investigating reader, I want to pin a candidate or past instance while collection continues so that inspection stays stable until intentionally returning live.

**Why this priority**: Makes accepted evidence usable for investigation independently of other inspection controls.
**Scope**: This story does NOT cover ASTRA composition/palette/assets and archival completeness.
**Independent Test**: Run overflow and multi-update browser fixtures with keyboard focus and nested scroll.
**Acceptance Scenarios**:

1. **Given** two accepted same-round candidates and a retained historical instance exist, **When** reader pins one and new observations arrive, **Then** pin, source/context/phase signer committee evidence, peaks, receipts, disclosures/sort/search/focus/scroll remain stable; newer-items count/action is shown. [US-5-S1]
2. **Given** 150 histories, 100 accepted candidates and 100 unresolved candidates are retained per network, **When** one additional entry arrives in each category, **Then** oldest receipt eviction enforces independent bounds; replay does not duplicate; unresolved cannot evict accepted; enormous claimed level does not determine eviction. [US-5-S2]
3. **Given** pinned history is oldest and evicted, **When** collection advances and reader chooses follow-live, **Then** one frozen snapshot per network remains clearly outside retained history until coherent follow-live; pause remains separate. [US-5-S3]

### US-6: Searchable committee evidence (Priority: P1)
As a delegate investigator, I want to search alias or address with phase-specific evidence so that participation and eligibility can be inspected without losing place.

**Why this priority**: Makes accepted evidence usable for investigation independently of other inspection controls.
**Scope**: This story does NOT cover watched-delegate filters and network-wide inactivity claims.
**Independent Test**: Search and sort a long real-page fixture across several incoming votes.
**Acceptance Scenarios**:

1. **Given** committee D1 alias Baker Alpha has power 3 of total 5 and only preattestation observed, **When** reader searches Alpha or D1 address, **Then** same delegate shows phase-specific receipt, exact power/share, eligibility and context. [US-6-S1]
2. **Given** reader sets a sort and focuses search while scrolling committee, **When** multiple operations/aliases arrive, **Then** sorting/disclosure/search/focus/scroll remain stable; new alias can match without moving inspection target unexpectedly. [US-6-S2]
3. **Given** source has interrupted coverage or missing rights/eligibility, **When** reader filters absent phase receipt, **Then** absence remains source-limited/unavailable and cannot label delegate network-wide inactive or falsely complete missing set. [US-6-S3]

### US-7: Independent bounded comparison (Priority: P1)
As a source investigator, I want to explicitly compare selected context to one different provider so that agreement and divergence are visible without pooled voting power.

**Why this priority**: Makes accepted evidence usable for investigation independently of other inspection controls.
**Scope**: This story does NOT cover automatic polling, archive and cascading fallback.
**Independent Test**: Trigger authentic browser comparison against controlled second-source endpoint fixtures.
**Acceptance Scenarios**:

1. **Given** selected A context 120/H1/2/P and compatible B head/rights are available, **When** reader triggers comparison, **Then** display independently attributed agreement/divergence/partial with head hash/level/round/time/network identity; optional pending snapshot uses only coherent rights; never sum A/B power. [US-7-S1]
2. **Given** B has wrong network, unproven rights, fails or exceeds timeout, **When** reader triggers comparison, **Then** unknown-power raw observations or unavailable are honest; at most three endpoint reads, eight seconds each, one workflow, no retry/cascade/periodic refresh. [US-7-S2]
3. **Given** comparison result or request belongs to prior selected context, **When** selection changes, pause or hidden occurs, **Then** cancel obsolete work; old result remains stale/attributed rather than agreement for new context; same-context results become stale after 60 seconds without auto-refresh and always expose receipt time. [US-7-S3]

### US-8: Identity-safe events and applied values (Priority: P0)
As a consensus reader, I want to inspect trustworthy progression and threshold events so that selection changes cannot fabricate consensus.

**Why this priority**: Evidence integrity is prerequisite to safe interpretation.
**Scope**: This story does NOT cover verified finality and timeline redesign.
**Independent Test**: Replay threshold boundaries while changing source/candidate/payload and historical selection.
**Acceptance Scenarios**:

1. **Given** same precise network/level/round/payload/candidate/source/context rises from power 3 to 4 with threshold 4, **When** the accepted observation commits, **Then** one justified threshold event retains exact identity/provenance and history. [US-8-S1]
2. **Given** old selected instance power 3 and newly selected candidate/source/history power 4, **When** reader changes selection, **Then** no fabricated crossing or progression event joins different identities or contexts. [US-8-S2]
3. **Given** applied block level 120 round 2/time T and calculated opportunity level 121 exist, **When** reader inspects current values, **Then** actual applied values remain primary and separate from selected consensus/opportunity; planned 121 cannot masquerade as applied level; exact threshold/deficit audited without percentage rounding; observed blocks expose block hash, and conditional same-level next round versus next-level round zero opportunities expose expected proposer from coherent RPC rights, source/context and protocol-prediction countdown or unavailable state; future hash stays unavailable until observed; same-level round progression is distinguished from applied next-level advancement. [US-8-S3]

