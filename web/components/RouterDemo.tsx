'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A faithful client-side reproduction of `npm run route`. It runs the same
// two-stage narrowing the CLI does: rank domains by term overlap, then pull the
// matching entity slices and cut them to the requested sections under a line
// budget. The slice bodies here are lifted verbatim from the compiled corpus.

const CONTRACT = [
  'Integer minor units for money. Never float.',
  'Every write carries an idempotency key, scoped per tenant, 24 h window.',
  'Authorization is asserted in the handler, not delegated to the gateway.',
  'Every mutation writes its audit row inside the same transaction.',
  'Soft delete via deleted_at. No physical delete outside the purge job.',
  'Optimistic locking on version. Reject stale writes with 409.',
];

const SLICES = [
  {
    ref: 'payments.ledger.ledger_transfer',
    terms: ['payment', 'payments', 'capture', 'ledger', 'transfer', 'money', 'checkout', 'refund', 'settle'],
    lines: [
      '#### api',
      '- POST /v1/payments/ledger/ledger_transfer op=payments.ledger.ledger_transfer.create',
      '- payments.ledger.ledger_transfer.create auth=bearer scope=payments:create',
      '- payments.ledger.ledger_transfer.create idempotent=header',
      '- payments.ledger.ledger_transfer.create success=201',
      '- payments.ledger.ledger_transfer.create timeout=4s retries=0',
      '#### fields',
      '- payments_ledger_transfer.amount_minor bigint :: integer minor units only',
      '- payments_ledger_transfer.currency char(3) :: ISO 4217',
      '- payments_ledger_transfer.idempotency_key text :: unique per tenant, 24 h window',
      '- payments_ledger_transfer.version int :: optimistic lock counter',
      '#### states',
      '- transition pending -> active guard=ledger_guard_1 actor=operator',
      '- transition active -> settled guard=ledger_guard_4 actor=service',
      '- transition held -> review guard=ledger_guard_3 actor=analyst',
      '#### security',
      '- ctl3 payments.ledger.ledger_transfer input length capped before parse',
      '- ctl5 payments.ledger.ledger_transfer audit row written in same transaction',
      '- ctl7 payments.ledger.ledger_transfer replay window enforced',
      '#### tests',
      '- t004 payments.ledger.ledger_transfer property :: list under concurrent',
      '- t017 payments.ledger.ledger_transfer contract :: approve under replayed key',
      '- t062 payments.ledger.ledger_transfer integration :: create under partial write',
    ],
  },
  {
    ref: 'commerce.core.core_request',
    terms: ['checkout', 'cart', 'order', 'commerce', 'catalog', 'basket', 'purchase'],
    lines: [
      '#### api',
      '- POST /v1/commerce/core/core_request op=commerce.core.core_request.create',
      '- commerce.core.core_request.create auth=bearer scope=commerce:create',
      '- commerce.core.core_request.list pagination=cursor, limit<=200',
      '#### indexes',
      '- uq btree (commerce_core_request.tenant_id, commerce_core_request.idempotency_key) where deleted_at is null',
      '- ix partial (commerce_core_request.tenant_id) where status = \'pending\'',
      '#### rbac',
      '- operator may create commerce.core.core_request = deny',
      '- auditor may export commerce.core.core_request = allow',
      '- guest may read commerce.core.core_request = deny',
      '#### slo',
      '- commerce.core.core_request p50 52ms p99 431ms',
      '- commerce.core.core_request degradation mode: serve cached read, queue writes',
    ],
  },
  {
    ref: 'identity.gateway.gateway_session',
    terms: ['auth', 'login', 'session', 'identity', 'token', 'kyc', 'consent', 'signin'],
    lines: [
      '#### api',
      '- POST /v1/identity/gateway/gateway_session op=identity.gateway.gateway_session.create',
      '- identity.gateway.gateway_session.read auth=bearer scope=identity:read',
      '#### security',
      '- ctl0 identity.gateway.gateway_session authz checked at handler not gateway',
      '- ctl2 identity.gateway.gateway_session secrets from KMS never env literal',
      '- ctl8 identity.gateway.gateway_session rate limit per tenant and per IP',
      '#### limits',
      '- limit identity.gateway.gateway_session guest 10 rpm burst 20',
      '#### events',
      '- emit identity.gateway.gateway_session.expired.v1 partition=tenant_id ordering=per-key',
    ],
  },
  {
    ref: 'logistics.workflow.workflow_schedule',
    terms: ['delivery', 'shipping', 'logistics', 'dispatch', 'courier', 'fulfil', 'fulfill', 'schedule', 'route'],
    lines: [
      '#### api',
      '- POST /v1/logistics/workflow/workflow_schedule op=logistics.workflow.workflow_schedule.create',
      '- logistics.workflow.workflow_schedule.create timeout=3s retries=0',
      '#### states',
      '- transition draft -> pending guard=workflow_guard_0 actor=owner',
      '- transition active -> held guard=workflow_guard_2 actor=operator',
      '- terminal expired=yes',
      '#### runbook',
      '- rb1 logistics.workflow.workflow_schedule inspect DLQ depth owner=logistics-workflow',
      '- rb3 logistics.workflow.workflow_schedule flip degradation flag owner=logistics-workflow',
    ],
  },
];

const PRESETS = [
  'checkout with idempotent payment capture',
  'session auth and rate limiting',
  'delivery dispatch scheduling',
];

const STOP = new Set(['the', 'a', 'an', 'with', 'and', 'for', 'to', 'of', 'in', 'on', 'my', 'build', 'add', 'make']);

export default function RouterDemo() {
  const [query, setQuery] = useState(PRESETS[0]);
  const [budget, setBudget] = useState(24);

  const result = useMemo(() => {
    const terms = query.toLowerCase().split(/[^a-z0-9_.]+/).filter((t) => t.length > 2 && !STOP.has(t));
    const ranked = SLICES.map((s) => {
      let hit = 0;
      for (const t of terms) {
        if (s.ref.toLowerCase().includes(t)) hit += 5;
        for (const term of s.terms) if (term.startsWith(t) || t.startsWith(term)) hit += 3;
      }
      return { ...s, hit };
    })
      .filter((s) => s.hit > 0)
      .sort((a, b) => b.hit - a.hit);

    const packed: { ref: string; lines: string[] }[] = [];
    let used = 0;
    for (const s of ranked) {
      const room = budget - used;
      if (room <= 2) break;
      const take = s.lines.slice(0, room);
      packed.push({ ref: s.ref, lines: take });
      used += take.length;
    }
    return { packed, used, scanned: ranked.length };
  }, [query, budget]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-2/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="font-mono text-[11px] text-mist">npm run route --</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Task description"
          placeholder="describe the task"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-ink px-3 py-1.5 font-mono text-[12px] text-weft outline-none transition-colors placeholder:text-mist/50 focus:border-warp/70"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setQuery(p)}
            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
              query === p ? 'border-warp/60 bg-warp/15 text-white' : 'border-line text-mist hover:border-mist/50'
            }`}
          >
            {p}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 font-mono text-[11px] text-mist">
          budget
          <input
            type="range"
            min={8}
            max={44}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="accent-[#7c5cff]"
            aria-label="Line budget"
          />
          <span className="w-8 tabular-nums text-right text-weft">{budget}</span>
        </label>
      </div>

      <div className="grid gap-3 border-b border-line px-4 py-3 sm:grid-cols-3">
        <Stat label="Corpus" value="5,001,816 lines" />
        <Stat label="Slices resolved" value={`${result.packed.length} of ${result.scanned} matched`} />
        <Stat label="Pack size" value={`${result.used + CONTRACT.length + 4} lines`} />
      </div>

      <pre className="max-h-[420px] overflow-auto px-4 py-4 font-mono text-[11.5px] leading-relaxed">
        <code>
          <span className="text-mist"># Loomstack context pack</span>
          {'\n'}
          <span className="text-mist">Task: {query || '—'}</span>
          {'\n\n'}
          <span className="text-weft">## Global contract</span>
          {'\n'}
          {CONTRACT.map((c) => (
            <span key={c} className="text-[#c9cfe6]">{`- ${c}\n`}</span>
          ))}
          {'\n'}
          <AnimatePresence mode="popLayout">
            {result.packed.length === 0 && (
              <motion.span
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-mist"
              >
                {'No slice matched. Try naming a capability: payment, session, delivery, checkout.\n'}
              </motion.span>
            )}
            {result.packed.map((s) => (
              <motion.span
                key={s.ref}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                <span className="text-warp">{`### ${s.ref}\n`}</span>
                {s.lines.map((l, i) => (
                  <span key={i} className={l.startsWith('####') ? 'text-weft' : 'text-[#c9cfe6]'}>
                    {`${l}\n`}
                  </span>
                ))}
                {'\n'}
              </motion.span>
            ))}
          </AnimatePresence>
        </code>
      </pre>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-mist">{label}</p>
      <p className="mt-0.5 font-mono text-[12px] text-white">{value}</p>
    </div>
  );
}
