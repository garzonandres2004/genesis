// Duplicate-PR adoption helper. Before creating a PR for a task branch, call
// this to find an already-open PR and adopt it instead of creating a duplicate.
// This script never creates a PR.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Parses `gh pr list --head <branch> --json url,state` output.
// Returns { url, anomaly }: url of the first open PR or null; anomaly is a
// string when the input is malformed or several open PRs exist, else null.
export function findExistingPr(ghListJson) {
  let list;
  try {
    list = typeof ghListJson === 'string' ? JSON.parse(ghListJson) : ghListJson;
  } catch {
    return { url: null, anomaly: 'malformed JSON from gh pr list' };
  }
  if (!Array.isArray(list)) return { url: null, anomaly: 'gh pr list output is not an array' };
  const open = list.filter(
    (p) => p && typeof p === 'object' && typeof p.url === 'string' && String(p.state).toUpperCase() === 'OPEN',
  );
  if (open.length === 0) return { url: null, anomaly: null };
  const anomaly = open.length > 1 ? `${open.length} open PRs for branch; adopting first (${open[0].url})` : null;
  return { url: open[0].url, anomaly };
}

export function listPrsForBranch(branch) {
  return execFileSync('gh', ['pr', 'list', '--head', branch, '--state', 'all', '--json', 'url,state'], {
    encoding: 'utf8',
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const branch = process.argv[2];
  if (!branch) {
    console.error('usage: node scripts/pr-adopt.mjs <branch>');
    process.exit(2);
  }
  try {
    const { url, anomaly } = findExistingPr(listPrsForBranch(branch));
    if (anomaly) console.error(`warning: ${anomaly}`);
    console.log(url ?? 'none');
  } catch (e) {
    console.error(`gh pr list failed: ${e.message.split('\n')[0]}`);
    process.exit(1);
  }
}
