#!/usr/bin/env node
// loomstack route — the part that makes a five million line spec actually usable.
//
// No model can read 5M lines. It does not need to. The router resolves a task
// description to the minimum set of spec slices required to build that slice of
// the system, and prints a context pack sized for a real context window.
//
//   node packages/compiler/src/route.mjs "checkout with idempotent payment capture"
//   node packages/compiler/src/route.mjs --entity payments.ledger.ledger_transfer --sections api,rbac,tests
//
// Output is a self-contained prompt: it carries the global contract plus the
// slice, so an agent can be handed one pack per task and build to completion.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const DIST = path.join(ROOT, 'dist');

const STOP = new Set(['the', 'a', 'an', 'with', 'and', 'for', 'to', 'of', 'in', 'on', 'my', 'build', 'add', 'make']);

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
}

function score(text, terms) {
  const hay = text.toLowerCase();
  let s = 0;
  for (const t of terms) {
    let idx = -1;
    while ((idx = hay.indexOf(t, idx + 1)) !== -1) s += 1;
  }
  return s;
}

// Split a shard into entity blocks without holding the whole file as one string
// longer than necessary. Shards top out around 16 MB so a single read is fine.
function blocksOf(shardText) {
  const blocks = [];
  let current = null;
  for (const line of shardText.split('\n')) {
    if (line.startsWith('### ')) {
      if (current) blocks.push(current);
      current = { ref: line.slice(4).trim(), lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function sliceSections(block, wanted) {
  if (!wanted) return block.lines;
  const keep = new Set(wanted.split(',').map((s) => s.trim()));
  const out = [block.lines[0]];
  let on = false;
  for (const line of block.lines.slice(1)) {
    if (line.startsWith('#### ')) on = keep.has(line.slice(5).trim());
    if (on || !line.startsWith('#')) { if (on) out.push(line); }
  }
  return out;
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(DIST, 'manifest.json'), 'utf8'));
  const entityFilter = arg('entity');
  const sections = arg('sections');
  const budget = Number(arg('budget') ?? 4000);
  const query = process.argv.slice(2).filter((a) => !a.startsWith('--') && process.argv[process.argv.indexOf(a) - 1]?.startsWith('--') !== true).join(' ');

  const terms = (entityFilter ?? query).toLowerCase().split(/[^a-z0-9_.]+/).filter((t) => t.length > 2 && !STOP.has(t));
  if (terms.length === 0) {
    console.error('usage: route.mjs "<task description>" | --entity <ref> [--sections api,rbac,tests] [--budget 4000]');
    process.exit(2);
  }

  // Rank shards by manifest metadata first so we only read what we need.
  const ranked = manifest.shards
    .map((s) => ({ ...s, hit: score(`${s.domain} ${s.file}`, terms) }))
    .sort((a, b) => b.hit - a.hit);
  const candidates = ranked.filter((s) => s.hit > 0).slice(0, 3);
  const toRead = candidates.length ? candidates : ranked.slice(0, 3);

  const picked = [];
  for (const shard of toRead) {
    const text = await readFile(path.join(DIST, 'shards', shard.file), 'utf8');
    for (const block of blocksOf(text)) {
      const hit = score(block.ref, terms) * 5 + score(block.lines.slice(0, 40).join('\n'), terms);
      if (hit > 0) picked.push({ ...block, hit, shard: shard.file });
    }
  }
  picked.sort((a, b) => b.hit - a.hit);

  const pack = [];
  let lines = 0;
  for (const block of picked) {
    const body = sliceSections(block, sections);
    if (lines + body.length > budget) continue;
    pack.push(body.join('\n'));
    lines += body.length;
    if (lines >= budget * 0.95) break;
  }

  process.stdout.write([
    '# Loomstack context pack',
    `Task: ${entityFilter ?? query}`,
    `Resolved ${pack.length} entity slices, ${lines} lines, from ${manifest.stats.totalLines.toLocaleString()} total.`,
    '',
    '## Global contract',
    '- Integer minor units for money. Never float.',
    '- Every write carries an idempotency key, scoped per tenant, 24 h window.',
    '- Authorization is asserted in the handler, not delegated to the gateway.',
    '- Every mutation writes its audit row inside the same transaction.',
    '- Soft delete via deleted_at. No physical delete outside the purge job.',
    '- Optimistic locking on version. Reject stale writes with 409.',
    '',
    '## Slices',
    '',
    pack.join('\n\n'),
    '',
  ].join('\n'));
}

main().catch((err) => { console.error(err.message); process.exit(1); });
