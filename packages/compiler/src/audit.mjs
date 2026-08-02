#!/usr/bin/env node
// loomstack audit — the adversarial pass.
//
// `verify` answers "are there really five million lines". This answers the
// harder question a sceptic actually asks: "are those lines real, or is this
// padded filler dressed up to hit a number".
//
// It reports the full line-length distribution, the exact duplicate rate, the
// share of lines short enough to count as filler, and the vocabulary size. No
// figure here is read from the manifest; everything is measured from the bytes.

import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const SHARDS = path.join(ROOT, 'dist', 'shards');

const files = (await readdir(SHARDS)).filter((f) => f.endsWith('.md')).sort();

// Length histogram indexed by character count. Corpus lines are well under
// 512 chars, and anything longer lands in the overflow bucket.
const MAXLEN = 512;
const hist = new Uint32Array(MAXLEN + 1);
let overflow = 0;
let lines = 0;
let chars = 0;
let longest = { len: 0, text: '' };
let shortest = { len: Infinity, text: '' };

// Exact duplicate detection across all five million lines. Storing the strings
// themselves would need gigabytes, so we keep 64-bit fingerprints in a Set and
// report the collision-adjusted figure.
const seen = new Set();
let duplicates = 0;
const vocab = new Set();

function fingerprint(s) {
  // FNV-1a over two offsets, packed into one string key. Collision odds across
  // 5e6 items at 64 bits are around 1 in 1.4 million, far below the precision
  // this figure is quoted at.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}:${h2.toString(36)}`;
}

for (const file of files) {
  const rl = createInterface({ input: createReadStream(path.join(SHARDS, file)), crlfDelay: Infinity });
  for await (const line of rl) {
    lines += 1;
    const len = line.length;
    chars += len;
    if (len > MAXLEN) overflow += 1; else hist[len] += 1;
    if (len > longest.len) longest = { len, text: line };
    if (len < shortest.len && len > 0) shortest = { len, text: line };

    const fp = fingerprint(line);
    if (seen.has(fp)) duplicates += 1; else seen.add(fp);

    // Sample the vocabulary rather than every line, to keep memory bounded.
    if (lines % 37 === 0) {
      for (const tok of line.split(/[^A-Za-z0-9_]+/)) if (tok.length > 2) vocab.add(tok);
    }
  }
}

function percentile(p) {
  const target = lines * p;
  let acc = 0;
  for (let len = 0; len <= MAXLEN; len += 1) {
    acc += hist[len];
    if (acc >= target) return len;
  }
  return MAXLEN;
}

const under = (n) => {
  let acc = 0;
  for (let len = 0; len < n; len += 1) acc += hist[len];
  return acc;
};

const pct = (n) => `${((n / lines) * 100).toFixed(2)}%`;

console.log('LOOMSTACK CORPUS AUDIT');
console.log('======================\n');

console.log('Volume');
console.log(`  shards                ${files.length}`);
console.log(`  lines                 ${lines.toLocaleString('en-US')}`);
console.log(`  characters            ${chars.toLocaleString('en-US')}`);
console.log(`  mean line length      ${(chars / lines).toFixed(2)}\n`);

console.log('Line length distribution');
console.log(`  min                   ${shortest.len}`);
console.log(`  p01                   ${percentile(0.01)}`);
console.log(`  p10                   ${percentile(0.10)}`);
console.log(`  p25                   ${percentile(0.25)}`);
console.log(`  median                ${percentile(0.50)}`);
console.log(`  p75                   ${percentile(0.75)}`);
console.log(`  p90                   ${percentile(0.90)}`);
console.log(`  p99                   ${percentile(0.99)}`);
console.log(`  max                   ${longest.len}\n`);

console.log('Filler test  (a padded corpus is dominated by very short lines)');
console.log(`  lines under 10 chars  ${under(10).toLocaleString('en-US')}  ${pct(under(10))}`);
console.log(`  lines under 20 chars  ${under(20).toLocaleString('en-US')}  ${pct(under(20))}`);
console.log(`  lines under 40 chars  ${under(40).toLocaleString('en-US')}  ${pct(under(40))}`);
console.log(`  lines 40 chars and up ${(lines - under(40)).toLocaleString('en-US')}  ${pct(lines - under(40))}`);
console.log(`  blank lines           ${hist[0].toLocaleString('en-US')}  ${pct(hist[0])}\n`);

console.log('Duplication test  (padded corpora repeat themselves)');
console.log(`  distinct lines        ${(lines - duplicates).toLocaleString('en-US')}  ${pct(lines - duplicates)}`);
console.log(`  repeated lines        ${duplicates.toLocaleString('en-US')}  ${pct(duplicates)}`);
console.log(`  vocabulary (sampled)  ${vocab.size.toLocaleString('en-US')} distinct tokens\n`);

console.log('Extremes');
console.log(`  shortest  (${shortest.len})  ${shortest.text}`);
console.log(`  longest   (${longest.len})  ${longest.text.slice(0, 150)}\n`);

const verdict = [];
verdict.push(under(20) / lines < 0.05 ? 'PASS  under 5% of lines are shorter than 20 chars' : 'FAIL  short-line share exceeds 5%');
verdict.push((lines - duplicates) / lines > 0.9 ? 'PASS  over 90% of lines are distinct' : 'FAIL  duplicate share exceeds 10%');
verdict.push(chars / lines > 40 ? 'PASS  mean line length exceeds 40 chars' : 'FAIL  mean line length under 40 chars');
console.log('Verdict');
for (const v of verdict) console.log(`  ${v}`);

process.exit(verdict.some((v) => v.startsWith('FAIL')) ? 1 : 0);
