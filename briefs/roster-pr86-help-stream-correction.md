# PR86 extension help stream correction

Exact candidate `2608681b9062b0d9d8929755a1c0b59282dffecf`, tree `496016e268fe54d7a50c28e65032d254ee98ce5f`, parent `38634df6ed5b4bc46531051bb4ef72cbb1c3a364`, is frozen in `/tmp/roster-pr86-help` on branch `fix/pr86-help-output`. Earlier reviewed candidates remain unchanged. No external publication occurred.

The independent reviewer found that the public executable printed successful `--help` text to stderr after a PR refactor, whereas upstream main used stdout for exit0. Actual before/after subprocess evidence was retained by the reviewer; parser seam tests could not detect this stream regression. The entrypoint now selects stdout for success and stderr for usage errors or other failures, preserving exit codes and messages.

Two actual compiled-CLI regressions cover both `--help`/`-h` and empty/malformed invocation. Before correction, the new successful-help assertion completed RED because stdout was empty:14 existing/negative cases passed, one failed. After correction, clean Node22 install/build, **59 targeted executable/parser/extension tests**, full **638/638 across42 runner summaries** and whitespace checks pass; no skipped/cancelled/failed runner tests. Logs are `/tmp/roster-pr86-help-focused.log` and `/tmp/roster-pr86-help-full.log`. Test-created Python bytecode was removed before committing. Existing optional-postinstall and advisory schema warnings remain qualified.

This is implementation evidence. Independent review on386 confirmed the scope and Beta corrections but did not cover this two-file change; new exact-candidate review, remaining specialist/convergence gates and separate QA remain required. Observatory S9 review retains priority.
