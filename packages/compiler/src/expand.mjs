// Deterministic entity expander.
// Given (domain, module, entity) it emits an ordered block of spec lines.
// Same input always yields byte-identical output, which is what makes the
// compiled megaprompt reproducible and therefore verifiable by a third party.

import {
  ROLES, ACTIONS, STATES, FIELD_TYPES, SURFACES, LOCALES,
} from '../../../specs/grammar/taxonomy.mjs';

const pick = (arr, n) => arr[n % arr.length];

export function expandEntity(domain, moduleId, entity, seq) {
  const out = [];
  const ref = `${domain.id}.${moduleId}.${entity}`;
  const table = `${domain.id}_${entity}`;
  const push = (s) => out.push(s);

  push(`### ${ref}`);
  push(`- id: ${ref}`);
  push(`- seq: ${seq}`);
  push(`- domain-intent: ${domain.tone}`);
  push(`- table: ${table}`);
  push(`- owner-team: ${domain.id}-${moduleId}`);
  push(`- tier: ${(seq % 3) + 1}`);
  push(`- residency: pinned to tenant region column`);

  push(`#### fields`);
  for (const [name, type, note] of FIELD_TYPES) {
    push(`- ${table}.${name} ${type} :: ${note}`);
    push(`- ${table}.${name} nullable=${name.endsWith('_at') && name !== 'created_at' ? 'yes' : 'no'}`);
    push(`- ${table}.${name} redact=${['metadata', 'label', 'checksum'].includes(name) ? 'partial' : 'none'}`);
  }

  push(`#### indexes`);
  push(`- pk btree (${table}.id)`);
  push(`- uq btree (${table}.tenant_id, ${table}.idempotency_key) where deleted_at is null`);
  push(`- ix btree (${table}.tenant_id, ${table}.status, ${table}.created_at desc)`);
  push(`- ix btree (${table}.tenant_id, ${table}.updated_at desc)`);
  push(`- ix brin (${table}.created_at)`);
  push(`- ix gin (${table}.metadata jsonb_path_ops)`);
  push(`- ix btree (${table}.created_by) include (status)`);
  push(`- ix partial (${table}.tenant_id) where status = 'pending'`);
  push(`- ix partial (${table}.tenant_id) where status = 'held'`);
  push(`- fk ${table}.tenant_id -> tenant.id on delete restrict`);
  push(`- fk ${table}.created_by -> identity_account.id on delete set null`);
  push(`- rls ${table} using tenant_id = current_setting('app.tenant')::uuid`);

  push(`#### states`);
  for (let i = 0; i < STATES.length; i += 1) {
    const from = STATES[i];
    const to = pick(STATES, i + 1);
    push(`- ${ref} transition ${from} -> ${to} guard=${moduleId}_guard_${i} actor=${pick(ROLES, i)}`);
    push(`- ${ref} transition ${from} -> closed guard=force_close actor=owner audit=required`);
    push(`- ${ref} terminal ${from}=${['closed', 'purged', 'expired'].includes(from) ? 'yes' : 'no'}`);
  }

  push(`#### rbac`);
  for (const role of ROLES) {
    for (const action of ACTIONS) {
      const allow = (role === 'owner' || role === 'admin')
        || (role === 'auditor' && ['read', 'list', 'export'].includes(action))
        || (role === 'guest' ? false : ['read', 'list'].includes(action));
      push(`- ${role} may ${action} ${ref} = ${allow ? 'allow' : 'deny'}`);
    }
  }

  push(`#### api`);
  for (const action of ACTIONS) {
    const verb = { create: 'POST', read: 'GET', update: 'PATCH', delete: 'DELETE', list: 'GET', export: 'POST', approve: 'POST', archive: 'POST' }[action];
    const path = `/v1/${domain.id}/${moduleId}/${entity}${['read', 'update', 'delete', 'approve', 'archive'].includes(action) ? '/{id}' : ''}${action === 'export' ? ':export' : ''}`;
    push(`- ${verb} ${path} op=${ref}.${action}`);
    push(`- ${ref}.${action} auth=bearer scope=${domain.id}:${action}`);
    push(`- ${ref}.${action} idempotent=${verb === 'POST' ? 'header' : 'inherent'}`);
    push(`- ${ref}.${action} success=${action === 'create' ? 201 : action === 'delete' ? 204 : 200}`);
    push(`- ${ref}.${action} pagination=${action === 'list' ? 'cursor, limit<=200' : 'n/a'}`);
    push(`- ${ref}.${action} timeout=${2 + (seq % 5)}s retries=${verb === 'GET' ? 3 : 0}`);
  }

  push(`#### validation`);
  for (const [name] of FIELD_TYPES) {
    push(`- reject ${table}.${name} when absent on create unless defaulted`);
    push(`- normalise ${table}.${name} before persist and before hash`);
  }

  push(`#### errors`);
  for (let i = 0; i < 40; i += 1) {
    // Error codes are entity scoped, not module scoped. Two entities sharing a
    // code is a defect in the spec, not a shortcut.
    push(`- ${entity.toUpperCase()}_${String(i).padStart(3, '0')} on ${ref} :: ${pick(['invalid_input', 'not_found', 'conflict', 'forbidden', 'rate_limited', 'upstream_down', 'stale_version', 'quota_exceeded'], i)} retryable=${i % 3 === 0}`);
  }

  push(`#### events`);
  for (let i = 0; i < 24; i += 1) {
    push(`- emit ${ref}.${pick(STATES, i)}.v${(i % 3) + 1} partition=tenant_id ordering=per-key`);
  }

  push(`#### telemetry`);
  for (let i = 0; i < 20; i += 1) {
    push(`- metric ${ref}.${pick(['latency_ms', 'error_rate', 'throughput', 'queue_depth', 'retry_count'], i)} type=${pick(['histogram', 'counter', 'gauge'], i)} label=tenant,region`);
  }

  push(`#### i18n`);
  for (const locale of LOCALES) {
    for (let i = 0; i < 12; i += 1) {
      push(`- ${locale} ${ref}.msg.${i} pluralised=${i % 4 === 0} rtl=${locale.startsWith('ar')}`);
    }
  }

  push(`#### ui`);
  for (const surface of SURFACES) {
    for (let i = 0; i < 10; i += 1) {
      push(`- ${surface} ${ref}.view.${i} empty+loading+error states required, a11y label bound`);
    }
  }

  push(`#### tests`);
  for (let i = 0; i < 120; i += 1) {
    push(`- t${String(i).padStart(3, '0')} ${ref} ${pick(['unit', 'contract', 'integration', 'e2e', 'property', 'load'], i)} :: ${pick(ACTIONS, i)} under ${pick(['normal', 'concurrent', 'degraded upstream', 'expired token', 'replayed key', 'partial write'], i >> 1)}`);
  }

  push(`#### acceptance`);
  for (let i = 0; i < 40; i += 1) {
    push(`- ac${i} ${ref} verified by t${String((i * 3) % 120).padStart(3, '0')} and dashboard panel ${i % 8}`);
  }

  push(`#### slo`);
  push(`- ${ref} availability 99.9 monthly`);
  push(`- ${ref} p50 ${40 + (seq % 60)}ms p99 ${300 + (seq % 400)}ms`);
  push(`- ${ref} error budget 43m per month, burn alert at 2x`);
  push(`- ${ref} freshness lag under 5s for derived reads`);
  push(`- ${ref} backlog drain under 15m after incident`);
  push(`- ${ref} cold start under 900ms on mobile`);
  push(`- ${ref} data loss objective zero, RPO 0 RTO 15m`);
  push(`- ${ref} dependency budget: at most 3 synchronous hops`);
  push(`- ${ref} paging policy: burn rate only, never raw error count`);
  push(`- ${ref} dashboards owned by ${domain.id}-${moduleId}`);
  push(`- ${ref} load tested at 3x forecast peak before release`);
  push(`- ${ref} degradation mode: serve cached read, queue writes`);

  push(`#### security`);
  for (let i = 0; i < 30; i += 1) {
    push(`- ctl${i} ${ref} ${pick(['authz checked at handler not gateway', 'tenant scope asserted in query', 'secrets from KMS never env literal', 'input length capped before parse', 'output encoded per sink', 'audit row written in same transaction', 'PII column encrypted at rest', 'replay window enforced', 'rate limit per tenant and per IP', 'deny by default on unknown scope'], i)}`);
  }

  push(`#### cache`);
  for (let i = 0; i < 10; i += 1) push(`- cache ${ref}.k${i} ttl=${30 * (i + 1)}s invalidate on write, stale-while-revalidate ${i * 5}s`);
  push(`#### limits`);
  for (let i = 0; i < 10; i += 1) push(`- limit ${ref} ${pick(ROLES, i)} ${10 * (i + 1)} rpm burst ${20 * (i + 1)}`);

  push(`#### migration`);
  for (let i = 0; i < 18; i += 1) {
    push(`- m${String(i).padStart(2, '0')} ${table} ${pick(['add column nullable', 'backfill in batches of 5000', 'add index concurrently', 'flip read path behind flag', 'flip write path', 'drop old column'], i)} reversible=${i % 6 !== 5}`);
  }

  push(`#### sdk`);
  for (const action of ACTIONS) {
    push(`- ts ${ref}.${action}(input, opts) -> Result<${entity}, ${domain.id}Error>`);
    push(`- swift ${ref}.${action} async throws`);
    push(`- kotlin ${ref}.${action} suspend fun`);
    push(`- cli loomstack ${domain.id} ${entity} ${action} --json`);
  }

  push(`#### runbook`);
  for (let i = 0; i < 20; i += 1) {
    push(`- rb${i} ${ref} ${pick(['check saturation dashboard', 'inspect DLQ depth', 'replay from last checkpoint', 'flip degradation flag', 'rotate credential and restart', 'escalate to domain owner'], i)} owner=${domain.id}-${moduleId}`);
  }

  return out;
}

export function expandInvariants(domain, moduleId, entity, count, seq) {
  const out = [];
  const ref = `${domain.id}.${moduleId}.${entity}`;
  if (count > 0) out.push(`#### invariants`);
  for (let i = 0; i < count - 1; i += 1) {
    const role = pick(ROLES, i + seq);
    const state = pick(STATES, i + (seq >> 2));
    const action = pick(ACTIONS, i + (seq >> 1));
    const field = FIELD_TYPES[(i + seq) % FIELD_TYPES.length][0];
    out.push(`- inv${i} ${ref}: ${role} performing ${action} while ${state} must leave ${field} consistent and audited`);
  }
  return out;
}
