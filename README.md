<div align="center">
  <img src="brand/loomstack-mark.svg" width="88" alt="Loomstack">
  <h1>Loomstack</h1>
  <p><strong>A spec compiler that weaves five million addressable spec lines into context packs an agent can actually build from.</strong></p>
</div>

---

## The number

```
lines       5,001,816
bytes       356,085,247  (356.1 MB)
avg line    71.19 chars
entities    6,048
shards      24
digests     all match
```

The previous longest published prompt document sits at 927,551 lines. Loomstack
clears that by a margin of roughly 4.07 million lines. Do not take that on
trust. Clone the repository and recount it yourself:

```bash
git clone https://github.com/VincentiusBryanKwandou/loomstack
cd loomstack
npm run verify
```

`verify` rereads every shard from disk, recounts newlines, recomputes SHA-256,
and diffs the totals against `dist/manifest.json`. It exits non-zero on any
divergence. It trusts nothing that this repository asserts about itself.

You can go further and regenerate the whole corpus from source:

```bash
npm run build      # roughly two minutes on a laptop
npm run verify     # digests must match the committed SHA256SUMS byte for byte
```

The build is deterministic. Same input, same bytes, same hashes, every time.

## The part most long-prompt projects get wrong

A five million line document is around 75 million tokens. The largest context
window available today holds about one million. So a megaprompt of this size
cannot be fed to any model, on any provider, at any price. Projects that claim
"paste this and an app falls out" are describing something that does not run.

Loomstack does not make that claim. The corpus is not the interface. The router
is.

```bash
npm run route -- "checkout with idempotent payment capture"
```

The router resolves a task description down to the specific entity slices that
task needs, attaches the global contract that governs every slice, and prints a
pack sized to a real context window. One task, one pack, built to completion.
Then the next task. The corpus is a queryable substrate, not a thing you paste.

You can aim it precisely:

```bash
npm run route -- --entity payments.ledger.ledger_transfer --sections api,rbac,tests --budget 2500
```

## What is actually in the corpus

Not prose. Every line is a single machine-checkable assertion with a stable
address. The grammar walks 24 domains, 18 modules per domain, and 14 entity
roots per module, giving 6,048 entities. Each entity expands into 827 lines
across these sections:

| Section | What it pins down |
| --- | --- |
| `fields` | Column, type, nullability, redaction class |
| `indexes` | Btree, BRIN, GIN, partial predicates, foreign keys, row level security |
| `states` | Transitions, guards, the actor permitted to fire them, terminal flags |
| `rbac` | The full role by action matrix, allow or deny, no gaps |
| `api` | Verb, path, scope, idempotency, status codes, timeout, retry policy |
| `validation` | Rejection and normalisation rules per field |
| `errors` | Stable codes with retryability |
| `events` | Topic, version, partition key, ordering guarantee |
| `telemetry` | Metric name, instrument type, label cardinality |
| `i18n` | Message keys across eight locales, plural and RTL flags |
| `ui` | Per surface view contracts, required empty, loading and error states |
| `tests` | 120 named cases per entity across six test kinds |
| `acceptance` | Criteria bound to specific test IDs and dashboard panels |
| `slo` | Availability, latency percentiles, error budget, degradation mode |
| `security` | Thirty named controls per entity |
| `cache`, `limits` | TTLs, invalidation, per role rate ceilings |
| `migration` | Ordered, reversible steps |
| `sdk` | TypeScript, Swift, Kotlin and CLI signatures |
| `runbook` | Named operator procedures with an owning team |
| `invariants` | Cross-cutting role, state, action and field consistency rules |

Address any of it directly. `payments.ledger.ledger_transfer` is a real handle
the router resolves.

## The global contract

Six rules bind every slice, and the router prepends them to every pack, because
a slice without them is a slice an agent will get wrong:

- Money is integer minor units. Never a float.
- Every write carries an idempotency key, scoped per tenant, 24 hour window.
- Authorization is asserted in the handler, never delegated to the gateway.
- Every mutation writes its audit row inside the same transaction.
- Deletion is `deleted_at`. Physical delete happens only in the purge job.
- Optimistic locking on `version`. Stale writes are rejected with 409.

## Repository layout

```
specs/grammar/taxonomy.mjs      domains, modules, roles, states, field types
packages/compiler/src/expand.mjs   entity to spec lines, deterministic
packages/compiler/src/build.mjs    grammar to sharded corpus plus digests
packages/compiler/src/route.mjs    task to context pack
packages/compiler/src/verify.mjs   independent recount and digest audit
scripts/bundle.mjs              shards to a single MEGAPROMPT.md release asset
dist/shards/                    24 shards, each comfortably under 50 MB
dist/manifest.json              shard index the router reads
dist/SHA256SUMS                 per shard digests
web/                            the showcase site
```

## Why the corpus is sharded

GitHub hard-blocks any single file above 100 MB. The full corpus is roughly
356 MB, so a single tracked `MEGAPROMPT.md` is not a thing that can exist in a
git repository. Shards keep every tracked file diffable and under the ceiling.
The concatenated single file is built with `npm run bundle` and published as a
Release asset, where the ceiling is 2 GB.

## Licence

The tooling is Apache-2.0. The compiled spec content under `dist/` and
`release/` is CC BY-NC-ND 4.0: read it, verify it, redistribute it verbatim with
credit, but do not sell it and do not ship derivatives. Full terms and the
reasoning behind the split are in [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

Publishing the corpus is what makes the count checkable. It is not an invitation
to monetise it.
