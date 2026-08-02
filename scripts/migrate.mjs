#!/usr/bin/env node
// Applies the generated schema to Postgres, then proves it landed.
//
// One database holds all 24 domains. Separation is by Postgres schema, so
// commerce.core_request and health.core_request are different tables with the
// same clean name, and no query can reach across a domain by accident.
//
//   node scripts/migrate.mjs            # apply, then report
//   node scripts/migrate.mjs --report   # report only, change nothing

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');

// Minimal .env.local reader. The file is gitignored and never leaves the machine.
async function loadEnv() {
  try {
    const raw = await readFile(path.join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch { /* fall through to ambient env */ }
}

// Splits on statement terminators while respecting single quotes and
// dollar-quoted bodies. A plain split on ";" cuts $$ ... $$ blocks in half and
// hands Postgres an unterminated string.
function splitSql(sql) {
  const out = [];
  let buf = '';
  let inSingle = false;
  let tag = null;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];

    if (tag) {
      buf += ch;
      if (ch === '$' && sql.startsWith(tag, i)) {
        buf += sql.slice(i + 1, i + tag.length);
        i += tag.length - 1;
        tag = null;
      }
      continue;
    }

    if (inSingle) {
      buf += ch;
      if (ch === "'") inSingle = sql[i + 1] === "'" ? (buf += sql[++i], true) : false;
      continue;
    }

    if (ch === "'") { inSingle = true; buf += ch; continue; }

    if (ch === '$') {
      const m = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (m) { tag = m[0]; buf += tag; i += tag.length - 1; continue; }
    }

    if (ch === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl;
      buf += '\n';
      continue;
    }

    if (ch === ';') { const s = buf.trim(); if (s) out.push(s); buf = ''; continue; }
    buf += ch;
  }

  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

await loadEnv();

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Put it in .env.local or the environment.');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const reportOnly = process.argv.includes('--report');

if (!reportOnly) {
  const sql = await readFile(path.join(ROOT, 'db', 'schema.sql'), 'utf8');
  // Statement-at-a-time so a failure names the statement that broke rather than
  // rolling the whole file back with an unhelpful message.
  const statements = splitSql(sql);

  process.stdout.write(`applying ${statements.length} statements\n`);
  let done = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch (err) {
      console.error(`\nfailed on statement ${done + 1}:\n${stmt.slice(0, 240)}\n${err.message}`);
      await client.end();
      process.exit(1);
    }
    done += 1;
    if (done % 250 === 0) process.stdout.write(`  ${done}/${statements.length}\n`);
  }
  process.stdout.write(`applied ${done} statements\n\n`);
}

const { rows: schemas } = await client.query(`
  select table_schema, count(*)::int as tables
  from information_schema.tables
  where table_type = 'BASE TABLE'
    and table_schema not in ('pg_catalog', 'information_schema')
  group by table_schema
  order by table_schema
`);
const { rows: [totals] } = await client.query(`
  select
    (select count(*) from information_schema.tables
      where table_type='BASE TABLE' and table_schema not in ('pg_catalog','information_schema'))::int as tables,
    (select count(*) from pg_indexes
      where schemaname not in ('pg_catalog','information_schema'))::int as indexes,
    (select count(*) from pg_policies)::int as policies,
    pg_size_pretty(pg_database_size(current_database())) as size
`);

console.log('SCHEMA REPORT');
console.log('=============\n');
for (const s of schemas) console.log(`  ${s.table_schema.padEnd(14)} ${String(s.tables).padStart(4)} tables`);
console.log(`\n  schemas        ${schemas.length}`);
console.log(`  tables         ${totals.tables}`);
console.log(`  indexes        ${totals.indexes}`);
console.log(`  RLS policies   ${totals.policies}`);
console.log(`  database size  ${totals.size}`);

await client.end();
