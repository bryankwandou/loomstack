#!/usr/bin/env node
// Concatenates every shard into a single MEGAPROMPT.md.
// The result exceeds GitHub's 100 MB per-file limit on purpose, so it ships as
// a Release asset (2 GB ceiling) rather than a tracked file. The shards in the
// repository remain the canonical, diffable source.

import { createWriteStream, createReadStream } from 'node:fs';
import { readFile, mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'release');

const manifest = JSON.parse(await readFile(path.join(DIST, 'manifest.json'), 'utf8'));
await mkdir(OUT, { recursive: true });
const target = path.join(OUT, 'MEGAPROMPT.md');
const sink = createWriteStream(target);

sink.write([
  '# Loomstack MEGAPROMPT',
  '',
  `Compiled ${manifest.stats.generatedAt} from ${manifest.shards.length} shards.`,
  `${manifest.stats.totalLines.toLocaleString()} lines, ${manifest.stats.entities.toLocaleString()} entities, ${manifest.stats.avgLineChars} chars per line.`,
  '',
  'Spec content licensed CC BY-NC-ND 4.0. Tooling licensed Apache-2.0.',
  '',
].join('\n'));

for (const shard of manifest.shards) {
  await pipeline(createReadStream(path.join(DIST, 'shards', shard.file)), sink, { end: false });
}
sink.end();
console.log(`wrote ${target}`);
