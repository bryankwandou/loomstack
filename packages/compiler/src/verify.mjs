#!/usr/bin/env node
// loomstack verify — independent audit of the record claim.
// Recounts every shard from disk, recomputes sha256, and checks the totals
// against manifest.json. Anyone can clone, run `npm run verify`, and confirm
// the number without trusting us.

import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../../..');
const DIST = path.join(ROOT, 'dist');

async function measure(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    let lines = 0;
    let bytes = 0;
    let trailingNewline = true;
    const s = createReadStream(file);
    s.on('data', (chunk) => {
      hash.update(chunk);
      bytes += chunk.length;
      for (let i = 0; i < chunk.length; i += 1) if (chunk[i] === 10) lines += 1;
      trailingNewline = chunk[chunk.length - 1] === 10;
    });
    s.on('end', () => resolve({ lines: lines + (trailingNewline ? 0 : 1), bytes, sha256: hash.digest('hex') }));
    s.on('error', reject);
  });
}

const manifest = JSON.parse(await readFile(path.join(DIST, 'manifest.json'), 'utf8'));
let lines = 0;
let bytes = 0;
let failures = 0;

for (const shard of manifest.shards) {
  const got = await measure(path.join(DIST, 'shards', shard.file));
  const ok = got.sha256 === shard.sha256 && got.lines === shard.lines && got.bytes === shard.bytes;
  if (!ok) { failures += 1; console.error(`FAIL ${shard.file} expected ${shard.lines}/${shard.sha256.slice(0, 12)} got ${got.lines}/${got.sha256.slice(0, 12)}`); }
  lines += got.lines;
  bytes += got.bytes;
}

const totalsOk = lines === manifest.stats.totalLines && bytes === manifest.stats.totalBytes;
console.log(`shards      ${manifest.shards.length}`);
console.log(`lines       ${lines.toLocaleString()}`);
console.log(`bytes       ${bytes.toLocaleString()} (${(bytes / 1e6).toFixed(1)} MB)`);
console.log(`avg line    ${(bytes / lines).toFixed(2)} chars`);
console.log(`digests     ${failures === 0 ? 'all match' : `${failures} mismatched`}`);
console.log(`totals      ${totalsOk ? 'match manifest' : 'DIVERGE from manifest'}`);
console.log(`threshold   ${lines > 927551 ? `clears prior 927,551 by ${(lines - 927551).toLocaleString()}` : 'below prior record'}`);

process.exit(failures === 0 && totalsOk ? 0 : 1);
