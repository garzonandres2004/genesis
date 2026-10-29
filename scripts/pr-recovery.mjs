// Crash-after-PR recovery. Before creating a PR for a task branch, call
// adoptPr: if the branch already has an open PR (e.g. a previous run created it
// and crashed before recording the URL), adopt it instead of creating a second.
// This script never creates a PR.
import { execFileSync } from 'node:child_process';
import { findExistingPr } from './pr-adopt.mjs';

const defaultGhRunner = (args) => execFileSync('gh', args, { encoding: 'utf8' });

// ghRunner(args: string[]) => stdout string of `gh <args>`; injected so tests never run real gh.
// expectedHeadSha (optional): head the caller expects the branch PR to have.
// Returns null when there is no open PR (caller may create fresh), else
// { url, headSha, anomaly }. anomaly is a string for multiple open PRs, malformed
// gh output, or a head mismatch; when set, the caller must not silently create.
export function adoptPr({ branch, expectedHeadSha, ghRunner = defaultGhRunner }) {
  const out = ghRunner(['pr', 'list', '--head', branch, '--state', 'all', '--json', 'url,state,headRefOid']);
  const { url, anomaly } = findExistingPr(out);
  if (!url) return anomaly ? { url: null, headSha: null, anomaly } : null;

  const entry = JSON.parse(out).find((p) => p && p.url === url);
  const headSha = entry?.headRefOid ?? null;
  const problems = [];
  if (anomaly) problems.push(anomaly);
  if (expectedHeadSha && headSha !== expectedHeadSha) {
    problems.push(`open PR ${url} head ${headSha} does not match expected ${expectedHeadSha}`);
  }
  return { url, headSha, anomaly: problems.length ? problems.join('; ') : null };
}
