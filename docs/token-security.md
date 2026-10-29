# Runner token scopes: findings and a narrowing procedure

Written 2026-10-29 for the stabilization gate. **This gate does not narrow
anything.** It records the orchestrator's findings and prepares a procedure
for the user to approve and run. No credential was read, requested, or
changed in producing this doc, and no token value appears in it.

Sourcing: every finding below is from the orchestrator's verification on
2026-10-29 (`gh auth status`, a scripts inventory, and the cron body). The
builder who wrote this doc did not re-run those checks.

## 1. Findings

| Item | Finding |
|---|---|
| Account / protocol | `garzonandres2004`, https |
| Current scopes | `gist`, `read:org`, `repo`, `workflow` |
| Remote URL | Clean https URL, no embedded token. Auth goes through the `gh` credential helper |
| Token file | `~/.config/gh/hosts.yml` has mode 600 (metadata only; the content was not read) |
| CI | Uses GitHub's ephemeral `GITHUB_TOKEN`, not this token |
| Substation deploy token | Separate (`vercel-refresh-dispatch`), already scoped to the `substation-rush-hour` repo only |

**What the runner actually uses** (inventory of `scripts/*.mjs` and the cron
body): `git push` / `git fetch`, `gh pr list` (adopt), `gh pr create`,
`gh pr checks` (CI wait), `gh auth status` (preflight). It uses no gist
commands, no org endpoints, no workflow-run commands, and no `gh api` calls.
`gh repo list` appears only in `scripts/inventory.mjs`, a repo-inventory
generator that is not on the runner path.

## 2. Conclusion

The minimum OAuth scope for the runner is **`repo` alone**: it covers
private-repo read and write, pull requests, and checks. `gist`, `read:org`
and `workflow` are unused by the runner.

**Caveat.** The same token also serves the user's other VM repos
(`tyburon-estimator`, `substation-rush-hour`) through git and `gh`. Dropping
scopes is safe for the runner but is not yet shown safe for those. The
procedure's first two steps exist to close that gap before anything changes.

## 3. Narrowing procedure (not executed)

Run only after the user approves. The user performs steps 3 and 6 themselves.

1. **Inventory other VM uses.** List every repo on the VM that authenticates
   through this token (at least genesis, `tyburon-estimator`,
   `substation-rush-hour`) and the `gh`/git commands each one uses (scripts,
   cron jobs, hooks).
2. **Confirm nothing needs the dropped scopes.** Nothing may use gists, org
   reads (`read:org`, such as org or team listings), or workflow management
   (editing `.github/workflows` files through the token, or dispatching
   workflows). If anything does, stop here and report which.
3. **Refresh the scopes.** The user runs `gh auth refresh -s repo` in a
   terminal and completes the web OAuth step themselves. The token is never
   pasted anywhere and never shown in chat. Note: check the `gh auth refresh`
   help first, because `-s` adds scopes and may not remove existing ones. If
   it only adds, removing `gist`, `read:org` and `workflow` needs a fresh
   `gh auth login` with `repo` only (or revoking the old authorization in the
   GitHub settings after logging in again). The user decides which; do not
   improvise.
4. **Verify.** `gh auth status` (it lists scopes and does not display the
   token), then a read-only `gh pr list` on genesis. Preflight should also
   pass on the next tick.
5. **Negative control, without writing.** Confirm branch protection on `main`
   still blocks a direct push by reading the protection settings (GitHub
   repository settings, branch rules). The rule itself is the evidence. Do not
   test-push to `main`.
6. **Rollback.** If any step fails, stop and restore the previous scopes by
   re-running the refresh with them (`gist`, `read:org`, `repo`, `workflow`).
   Record what failed and the rollback in the task record. Do not improvise.

## 4. Optional stronger follow-up (not executed)

Replace the OAuth token with a fine-grained personal access token limited to
exactly the repos the VM touches (genesis, `tyburon-estimator`,
`substation-rush-hour`) with:

- Contents: read and write
- Pull requests: read and write
- Checks: read-only

Store it with `gh auth login --with-token` from standard input, typed or
piped by the user from where they hold it. Never put it in chat or in a file.
Two things to check before choosing this: fine-grained tokens expire and need
a rotation date, and `gh pr checks` may need more than Checks read-only (for
example Commit statuses); verify with a read-only call before relying on it.
These two points are the builder's caution, not an orchestrator finding.

## 5. Status

Not performed. Needs the user's approval, the inventory in step 1, and the
user's own hands for the OAuth step.
