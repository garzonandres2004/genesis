# Capability Matrix — Phase 0 audit (verified 2026-10-28)

Every row below was verified by inspection or command in this environment.
"Verified" means observed, not assumed. Secret values are never recorded;
only presence/absence and scopes are noted.

| Integration | Auth method | Permissions / scope | Supported operations | Limitations | Cost | Works unattended? | How tested |
|---|---|---|---|---|---|---|---|
| Muse (orchestrator) | Runtime | Full tool set: terminal, browser, files, crons, hooks, subagents, goals/tracking | Schedule, delegate, verify, report, manage files/repos | Single orchestrator; context compacts (long history summarizes) | Included | Yes | In use for this audit |
| Claude Code CLI | User's Max subscription, auth in ~/.claude | Builder sessions on this VM | Implement, test, commit on branches | Binary is VM-ephemeral (dies on restart); reinstalled 2.1.312 on 2026-10-28. Session + weekly usage limits apply | Existing subscription | Yes, once installed | `claude --version` → 2.1.312 after reinstall |
| GitHub | gh CLI, account garzonandres2004 | Scopes: gist, read:org, repo, workflow | List/create repos, branches, PRs, issues, Actions runs, secrets (names only) | Cannot create fine-grained PATs via API (web UI only); cannot read secret values | Free (private repos) | Yes | `gh auth status`, `gh repo list`, PR merge verified 2026-10-28 |
| Vercel | Browser dashboard session + GitHub Actions (VERCEL_TOKEN/ORG_ID/PROJECT_ID repo secrets) | Deploy via GitHub workflows; dashboard via browser | Preview + production deploys, env vars, cron jobs | No working local Vercel CLI (/opt/hatch/bin/vercel is a wrapper, not the CLI). Env var changes need a redeploy to take effect | Existing plan; no new cost | Yes, via GitHub workflows | Deploy workflow success + live checks 2026-10-28 (torus project) |
| Local Postgres 16 | Peer auth, role root | Local databases | SQL state, tests | EPHEMERAL: no cluster present at audit (wiped by VM replacements); must be reinstalled + re-migrated from repo files. No Docker, so no containerized stack | Free | No — needs reinstall after VM replacement | `pg_lsclusters` empty; psql client 16.15 present |
| Node / npm | — | — | Builds, tests, scripts | Egress proxy can break some downloads (curl works where Node fetch fails) | Free | Yes | node v24.22.1, npm 10.9.4 |
| Git | — | — | Version control | No identity configured on the VM; commits use one-off `-c` flags, never a git config change | Free | Yes | git 2.43.0 |
| Gemini API | None installed | — | Nothing yet | No GEMINI_API_KEY / GOOGLE_API_KEY in environment at audit. Key must be installed via the secure API-access flow; quota unknown until then | Unknown until key + quota known | No — blocked on key | Env presence check 2026-10-28 (absent) |
| Gemini Pro (browser) | Browser login (not established) | — | Nothing verified | Browser-only subscription, no API. Login + terms + usage limits unverified; never bypass them | Existing subscription | Unknown — needs founder login + terms check | Not tested; no session established |
| Perplexity Pro (browser) | Browser login (not established) | — | Nothing verified | Same as Gemini Pro: browser-only, no API, limits unverified | Existing subscription | Unknown — needs founder login + terms check | Not tested; no session established |
| Docker | — | — | Nothing | Not installed on the VM; no local container stack path | — | No | `docker` command not found |

## What this means for Phase 1

- Everything Phase 1 needs is already verified working: Muse, Claude Code
  (after reinstall), GitHub, Vercel-via-GitHub, Node, git, files.
- Nothing Phase 1 needs depends on an unverified integration. Gemini API,
  browser subscriptions, local Postgres, and a workflow engine are all
  Phase 2+ candidates, each gated on its own verification.
- The first repairs already done: Claude Code reinstalled (2.1.312).
