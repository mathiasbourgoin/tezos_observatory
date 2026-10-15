# Deployment check — header-layout-hotfix

**Date:** 2026-10-14T19:45:35.325112+00:00
**Status:** verified served revision631de28

Real public-origin Chromium30s and Firefox30s browser runs, no mocked RPC. Both visibly identify631de28. HTML, JS, CSS and observatory-mark.svg HTTP200 with exact SHA256 match immutable reviewed release manifest in both browsers. Firefox additionally requested favicon200/matching hash; Chromium did not request it, so independent HTTP read verified favicon200/matching hash. No application-asset404 or uncaught page exceptions.

Desktop1440 and mobile390 screenshots captured. Mobile actual geometry both browsers: loaded mark in40px slot, title height38.4px equals one line, monitoring/eyebrow boxes do not intersect, document scroll width390 equals viewport. Chromium mobile screenshot visually inspected: approved mark, title and separated control rows readable. Geometry/hashes in /tmp/observatory-deployed-631de28/summary.json.

Mainnet applied15373940→15373943 Chromium and15373945→15373948 Firefox, round0. Notice explicitly names Observed votes with level/round. Powers bounded by7000, quorum4667. Shadownet primary applied5489251/r117 timestamp21:40:33; secondary observed votes5489252/r0 payload-bound6689/7000,24/25signers. Secondary schedule0→1 boundary21:46:36. Actual screenshot cards show Next scheduled proposal and Following level conditional when rights available.

Provider limitations: Chromium68 HTTP200 responses; Firefox68 HTTP200 and6 RPC404 responses (URLs in summary), no public-asset404. RPC404/CORS or intentional aborts during changing requests/page closure do not imply broken release files. Uniform provider coverage and Shadownet level progression are not established by this bounded check. Initial scratch screenshot-ordering repair preceded completed run and did not affect production.

Artifacts/screenshots/network/snapshots: /tmp/observatory-deployed-631de28. Both browsers closed. No code change, remote mutation or deployment by this QA agent.
