# GitHub Pages workflow independent review

Verdict: **GO / approve for publication review**. No correctness, security, regression, scope or maintainability findings in the two prepared workflow files. This is local review evidence; no GitHub Actions run, artifact upload, deployment, push, configuration mutation or commit was performed.

Reviewed 14 October 2026 at HEAD `dd4e199579a1275bd0425a321edcc64cc04fa6a3`, including the dirty tracked diff in `.github/workflows/quality.yml` and entire untracked `.github/workflows/pages.yml`. SHA-256: quality `d07214648ea486b1ad1c9deb1ca240df9649bd3ae25304660f83bff52e687260`; pages `ea3759a74d6630d2138074fd2a7688ddde194a4effc3bd6365ec2367bf118638`. Other concurrent application/spec work is outside this review.

## Findings and control assessment

- Pages has only `workflow_dispatch` and both jobs require `refs/heads/main` (pages lines 4–5, 16, 22). No push or PR automatically deploys.
- The same-commit reusable quality workflow retains clean install, type check, unit tests, Chromium/Firefox browser installation and tests, and production build (quality lines 24–34). Pages sets its typed boolean artifact input; ordinary quality runs default to false.
- Artifact validation/upload is success gated after all quality commands (quality lines 35–48). It requires the index, both SVG assets and assets directory, rejects symlinks/hard links, and uploads only `dist`. Reviewed build config uses `base: "./"`, source public assets are present, and locally built dist contains only index, the two SVGs and generated JS/CSS. No repository briefs or machine-local artifacts enter that build output.
- `deploy` depends on `verify`; GitHub's normal success condition prevents deployment when verification fails or is skipped. The upload and deploy actions share the default Pages artifact in the same workflow run; a separate download step is unnecessary.
- Read-only contents permission applies to verification; Pages write/OIDC write appear only on the deployment job. The environment URL is the deploy action output.
- The `pages` concurrency group does not cancel a running deployment. Quality concurrency incorporates the caller workflow name and ref, so direct Quality runs do not cancel the called Pages verification and caller/callee groups differ. Standard GitHub concurrency may replace an older pending run; this is not a FIFO deployment queue.

Official references: [reusable workflow same-commit reference and caller context](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows), [Pages custom workflow artifact and deployment dependency](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Independent verification

All shell invocations used `rtk`; `rtk proxy bash -c` wrapped the sequential npm checks.

| Command / inspection | Result |
| --- | --- |
| Read RTK, project authority, TypeScript patterns, reviewer skill, full workflow/package/Vite files; git diff/rev/status; asset references and file listing; hashes | Exit 0, except initial optional Node-path lookup exit 2 because guessed paths were absent |
| `/tmp/observatory-actionlint/actionlint .github/workflows/quality.yml .github/workflows/pages.yml` | Exit 0; no diagnostics |
| `node --version; npm run check && npm test && npm run test:e2e && npm run build` on default Node | Exit 0; Node 26.11.1; 38 unit and 30 browser tests pass |
| Same four gates under `/tmp/observatory-node22-5Lonl2/runtime/node_modules/node-linux-x64/bin` | Exit 0; Node 22.23.3; 38 unit and 30 browser tests pass |
| Exact Pages dist validation expressions after Node 22 build | Exit 0 |
| `gh api repos/mathiasbourgoin/tezos_observatory/pages` (GET) | Exit 0; workflow mode, expected project URL, HTTPS enabled |
| `gh api repos/mathiasbourgoin/tezos_observatory/environments/github-pages` (GET) | Exit 0; required reviewer `mathiasbourgoin`, self-review allowed, admin bypass allowed, custom branch policies |
| `gh api repos/mathiasbourgoin/tezos_observatory/environments/github-pages/deployment-branch-policies` (GET) | Exit 0; exactly one policy, branch `main` |

Fresh `npm ci` was not rerun in the shared checkout to avoid modifying shared dependencies; the production workflow explicitly executes it under Node 22, and clean-install reproducibility remains a separate QA evidence requirement. No coverage command exists in the requested workflow scope. Neither linting nor local tests establish GitHub runner execution, runtime artifact transfer, environment approval or successful public deployment.

Open questions: none blocking this scoped review. Publication/deployment still require the maintainer's approval of the concrete result under project authority. Required-reviewer configuration currently permits maintainer self-approval and admin bypass; these API facts do not represent an additional independent-review guarantee.
