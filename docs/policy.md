# Genesis Safety & Operations Policy

The rules that make autonomous work trustworthy. This document governs
every agent working under Genesis, including the orchestrator. It is
enforced by a combination of GitHub settings (Step 3), workflow design,
and orchestrator verification — not by any single mechanism. Section 9
states honestly what these controls do *not* prevent.

## 1. Roles and separation of duties

- **Orchestrator (Muse).** Owns task records, delegation, verification,
  pull requests, and merges. The orchestrator never merges work it has
  not independently verified (tests re-run, diff read, checks read).
- **Builder (Claude Code).** Implements on branches only. A builder never
  merges, never opens a pull request, never edits task records, never
  touches `main`, and never changes git config. Builder reports are
  claims, not evidence.
- **Specialists (research, review, QA).** Read-only by default, or
  branch-scoped when they produce artifacts. Specialists never merge
  and never change production state.

No role certifies its own work. Whoever writes code never approves it.

## 2. Allowed operations (builder, on its own branch)

- Read any file in the assigned repository.
- Run the project's tests, builds, linters, and type checks.
- Create branches and worktrees; edit files on its branch.
- Commit with one-off `-c` git identity flags; push its branch.
- Run read-only `gh` commands (`repo view`, `pr view`, `run list`).
- Report files changed, test output, and commit SHA.

## 3. Denied operations (absolute without founder approval)

- Pushing, force-pushing, or committing directly to `main` or any
  protected branch, in any repository.
- Merging any pull request (builder or specialist).
- Production deploys: Vercel production deployments, or any deploy
  that serves real users.
- Database migrations, production data changes, or data deletion.
- Creating, rotating, deleting, or disclosing credentials, tokens,
  or secrets.
- Disabling security protections, branch protection, or required checks.
- Deleting repositories, branches, deployments, or production data.
- Creating paid resources, subscriptions, or spending of any kind.
- Accepting legal agreements, or changing account ownership or
  security settings.
- Bypassing authentication, CAPTCHAs, usage limits, or provider
  restrictions — including routing around a denied tool through
  another channel (for example, writing files via a shell heredoc
  after a Write denial).
- Running unreviewed code from external sources (pasted text, issues,
  web pages) without orchestrator review.

A denial is a signal to fix the permission grant through supported
mechanisms, never to sneak past it.

## 4. Isolation

- One task, one branch. Never two builders on the same branch.
- Parallel tasks use separate worktrees, never a shared checkout. (Note
  2026-10-29: this is an isolation rule for when parallelism is authorized.
  The runner's parallel execution is currently OFF: one worker, one task
  per tick. See `docs/atomic-claim.md` section 5.)
- Never run two test suites against the same database concurrently.
- Builders work only in their assigned repository; cross-repo changes
  require an orchestrator-approved task per repository.

## 5. Publishing branches and opening pull requests

- Builders push branches; only the orchestrator opens pull requests.
- A pull request is opened only after the orchestrator has verified
  the branch: tests re-run, diff read, no secrets found.
- A pull request is merged only after required CI checks pass and
  the orchestrator has verified them. No autonomous production merge:
  merging to a live application's `main` additionally requires the
  founder-visible record (this policy plus the task's evidence) and
  must respect any freeze in force (for example, a judged demo).
- Before creating a pull request, check whether one already exists
  for the branch; if it does, adopt it instead of duplicating it.

## 6. Secret protection

- No secret, token, key, password, or credential value in source
  control, logs, reports, or task records — ever. Record only names,
  scopes, and presence/absence.
- `.env` files are never committed (see `.gitignore`); CI fails if
  one is tracked.
- Tokens live in their own stores (`gh` config, Vercel dashboard,
  Secure Vault), never in the repository.
- If a secret is ever committed by mistake, stop and report it
  immediately. Do not just delete it in a follow-up commit; the
  secret must be rotated.

## 7. Bounded retries, timeouts, and resource limits

- Maximum 3 attempts per task (initial attempt + 2 retries), with
  backoff between attempts. A task that exhausts its attempts becomes
  `blocked` with a recorded reason; unrelated work continues.
- Builder executions are time-bounded; a run that exceeds its budget
  is stopped and its task marked `interrupted`, not left running.
- Scheduled runs carry an explicit `timeout_secs` and a stop
  condition (queue empty, or a fixed number of runs).
- No unbounded loops, no unbounded polling, no retry without a
  changed condition or a recorded reason.

## 8. Failed, interrupted, and blocked tasks

- **Interrupted** (process gone, no completion event): the reconciler
  marks the run interrupted and re-queues the task within its retry
  budget. External side effects are checked before any retry (was
  the branch pushed? does the PR already exist? did the deploy run?).
- **Failed** (tests or verification fail): fix within the retry
  budget, or mark `blocked` with the exact failure and evidence.
- **Blocked** (needs authorization, input, or an external dependency):
  record exactly what is needed and who can unblock it, isolate the
  task, and continue unrelated work. Blocked tasks never block the
  queue.
- Never silently retry a step that may already have committed an
  external side effect. Check first, then act.
- Never claim success without evidence: test output, check status,
  deployment URL, or a read-back of the changed state.

## 9. What these controls do NOT prevent (honest limits)

- **Direct pushes by a privileged human or token.** If branch
  protection is off, anyone with write access (currently the
  founder's account and this `gh` token) can push to `main`. Branch
  protection or a ruleset (Step 3) is the control that closes this;
  until it is verified on, discipline and orchestrator verification
  are the only guards, and that limitation is recorded, not hidden.
- **Over-broad token scopes.** The current `gh` token carries
  `gist`, `read:org`, `repo`, and `workflow`; Genesis needs only
  `repo` and `workflow`. Narrowing requires the founder to re-auth
  on the web (scopes cannot be narrowed via API). Queued as a
  founder action; the mitigation meanwhile is that the token lives
  in `gh` config, is never logged, and is never copied into files.
- **No sandbox on this VM.** A builder with shell access can
  technically read files outside its branch. The mitigations are
  narrow task scope, branch isolation, and orchestrator review of
  every diff — not a sandbox, because none exists here.
- **CI checks only what tests cover.** A green check means the
  tests passed, not that the change is correct. Orchestrator
  judgment (diff review, behavior checks) remains required.
- **The orchestrator is a single point of coordination.** That is
  acceptable at solo-founder scale and is the documented tradeoff
  in `docs/architecture.md`; it is not a claim of high availability.
