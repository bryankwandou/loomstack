import Loom from '@/components/Loom';
import Counter from '@/components/Counter';
import ShardGrid from '@/components/ShardGrid';
import RouterDemo from '@/components/RouterDemo';
import Reveal from '@/components/Reveal';
import manifest from '@/data/manifest.json';

const REPO = 'https://github.com/VincentiusBryanKwandou/loomstack';
const PRIOR = 927551;
const stats = manifest.stats;

export default function Page() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Proof />
      <Problem />
      <Router />
      <Shards />
      <Anatomy />
      <Licence />
      <Foot />
    </main>
  );
}

function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="w1" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
        <mask id="m1">
          <rect width="64" height="64" fill="#fff" />
          <rect x="19" y="19" width="10" height="6" rx="3" />
          <rect x="35" y="27" width="10" height="6" rx="3" />
          <rect x="19" y="35" width="10" height="6" rx="3" />
          <rect x="35" y="43" width="10" height="6" rx="3" />
        </mask>
      </defs>
      <g fill="url(#w1)">
        <rect x="19" y="8" width="6" height="48" rx="3" />
        <rect x="29" y="8" width="6" height="48" rx="3" />
        <rect x="39" y="8" width="6" height="48" rx="3" />
      </g>
      <g fill="#dfe4f5" mask="url(#m1)" opacity=".92">
        <rect x="8" y="19" width="48" height="6" rx="3" />
        <rect x="8" y="27" width="48" height="6" rx="3" />
        <rect x="8" y="35" width="48" height="6" rx="3" />
        <rect x="8" y="43" width="48" height="6" rx="3" />
      </g>
    </svg>
  );
}

function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <Mark />
          <span className="text-[15px] font-semibold tracking-tight">Loomstack</span>
        </a>
        <div className="ml-auto hidden items-center gap-7 text-[13px] text-mist md:flex">
          <a href="#router" className="transition-colors hover:text-white">Router</a>
          <a href="#shards" className="transition-colors hover:text-white">Shards</a>
          <a href="#anatomy" className="transition-colors hover:text-white">Anatomy</a>
          <a href="#licence" className="transition-colors hover:text-white">Licence</a>
        </div>
        <a
          href={REPO}
          className="rounded-md border border-line px-3.5 py-1.5 text-[13px] transition-colors hover:border-mist/50 hover:bg-white/5"
        >
          Source
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section id="top" className="grain relative overflow-hidden border-b border-line pt-40 pb-28">
      <Loom />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2/80 px-3.5 py-1.5 font-mono text-[11px] text-mist">
            <span className="h-1.5 w-1.5 rounded-full bg-weft" />
            Prior longest published prompt: {PRIOR.toLocaleString('en-US')} lines
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-8 max-w-4xl text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            Five million spec lines.
            <br />
            <span className="bg-gradient-to-r from-warp via-[#a78bfa] to-weft bg-clip-text text-transparent">
              And a router that makes them usable.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-mist">
            Loomstack compiles a spec grammar into {stats.entities.toLocaleString('en-US')} addressable entities
            across {stats.shards} shards. Nobody pastes the corpus into a model, because no model could hold it.
            The router resolves one task at a time into a pack that fits a real context window.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#router"
              className="rounded-lg bg-white px-5 py-3 text-[14px] font-medium text-ink transition-transform hover:-translate-y-0.5"
            >
              Run the router
            </a>
            <a
              href={REPO}
              className="rounded-lg border border-line px-5 py-3 text-[14px] transition-colors hover:border-mist/50 hover:bg-white/5"
            >
              Verify the count yourself
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Proof() {
  const margin = stats.totalLines - PRIOR;
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-widest text-mist">The number</p>
              <p className="mt-4 text-[clamp(2.8rem,8vw,5rem)] font-semibold leading-none tracking-tighter">
                <Counter to={stats.totalLines} />
              </p>
              <p className="mt-3 text-sm text-mist">
                lines, clearing the prior figure by {margin.toLocaleString('en-US')}
              </p>
            </Reveal>
          </div>

          <div>
            <Reveal delay={0.1}>
              <div className="space-y-5">
                <Bar label="Prior record" value={PRIOR} max={stats.totalLines} tone="mist" />
                <Bar label="Loomstack" value={stats.totalLines} max={stats.totalLines} tone="warp" />
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4">
                <Fig k="Entities" v={stats.entities.toLocaleString('en-US')} />
                <Fig k="Avg line" v={`${stats.avgLineChars} ch`} />
                <Fig k="Corpus" v={`${(stats.totalBytes / 1e6).toFixed(0)} MB`} />
                <Fig k="Digests" v="All match" />
              </dl>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 rounded-lg border border-line bg-ink-2/70 p-4 font-mono text-[12px] leading-relaxed">
                <p className="text-mist">$ git clone {REPO.replace('https://', '')}</p>
                <p className="text-mist">$ npm run verify</p>
                <p className="mt-2 text-weft">lines       {stats.totalLines.toLocaleString('en-US')}</p>
                <p className="text-weft">digests     all match</p>
                <p className="text-weft">threshold   clears prior 927,551 by {margin.toLocaleString('en-US')}</p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-mist">
                The verifier rereads every shard from disk, recounts newlines, recomputes SHA-256, and exits
                non-zero on any divergence. It trusts nothing this repository asserts about itself.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'mist' | 'warp' }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className={tone === 'warp' ? 'text-white' : 'text-mist'}>{label}</span>
        <span className="font-mono tabular-nums text-mist">{value.toLocaleString('en-US')}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${
            tone === 'warp' ? 'bg-gradient-to-r from-warp to-weft' : 'bg-mist/50'
          }`}
          style={{ width: `${Math.max(pct, 0.6)}%`, transition: 'width 1.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </div>
    </div>
  );
}

function Fig({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-mist">{k}</dt>
      <dd className="mt-1.5 font-mono text-[15px]">{v}</dd>
    </div>
  );
}

function Problem() {
  return (
    <section className="border-b border-line bg-ink-2/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="max-w-3xl text-[clamp(1.7rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
            The part most long-prompt projects quietly get wrong
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              h: 'Five million lines is 75 million tokens',
              p: 'The largest context window on the market holds about one million. A corpus this size cannot be fed to any model, on any provider, at any price.',
            },
            {
              h: 'So "paste this and an app appears" is not a claim that runs',
              p: 'It describes something that has never executed once. Loomstack does not make that claim. The corpus is not the interface.',
            },
            {
              h: 'The router is the interface',
              p: 'It narrows a task to the entity slices that task needs, attaches the contract that governs them, and prints a pack an agent can act on. One task, one pack.',
            },
          ].map((c, i) => (
            <Reveal key={c.h} delay={i * 0.08}>
              <div className="h-full rounded-xl border border-line bg-ink-2/60 p-6">
                <p className="font-mono text-[11px] text-weft">0{i + 1}</p>
                <h3 className="mt-3 text-[17px] font-medium leading-snug tracking-tight">{c.h}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-mist">{c.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Router() {
  return (
    <section id="router" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-[clamp(1.7rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
            Type a task. Watch the corpus narrow.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist">
            This runs the same two-stage narrowing the CLI does: rank shards by term overlap, pull the matching
            entity slices, cut them to a line budget. Drag the budget and the pack recomposes.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10">
            <RouterDemo />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Shards() {
  return (
    <section id="shards" className="border-b border-line bg-ink-2/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-[clamp(1.7rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
            Twenty four shards, each hashed
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist">
            GitHub hard-blocks any single file above 100 MB, so the corpus ships as shards that stay diffable and
            well under the ceiling. Select one to read its digest.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10">
            <ShardGrid />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const SECTIONS = [
  ['fields', 'Column, type, nullability, redaction class'],
  ['indexes', 'Btree, BRIN, GIN, partial predicates, foreign keys, row level security'],
  ['states', 'Transitions, guards, permitted actor, terminal flags'],
  ['rbac', 'The full role by action matrix, allow or deny, no gaps'],
  ['api', 'Verb, path, scope, idempotency, status codes, timeout, retry policy'],
  ['errors', 'Stable codes with retryability'],
  ['events', 'Topic, version, partition key, ordering guarantee'],
  ['telemetry', 'Metric name, instrument type, label cardinality'],
  ['i18n', 'Message keys across eight locales, plural and RTL flags'],
  ['tests', '120 named cases per entity across six test kinds'],
  ['slo', 'Availability, latency percentiles, error budget, degradation mode'],
  ['security', 'Thirty named controls per entity'],
  ['migration', 'Ordered, reversible steps'],
  ['sdk', 'TypeScript, Swift, Kotlin and CLI signatures'],
  ['runbook', 'Named operator procedures with an owning team'],
  ['invariants', 'Cross-cutting role, state, action and field consistency rules'],
];

function Anatomy() {
  return (
    <section id="anatomy" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-[clamp(1.7rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
            Not prose. Assertions with addresses.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist">
            Every one of the {stats.linesPerEntity} lines per entity is a single machine-checkable statement.
            <span className="font-mono text-[13px] text-weft"> payments.ledger.ledger_transfer </span>
            is a handle the router resolves, not a heading.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {SECTIONS.map(([k, v], i) => (
            <Reveal key={k} delay={(i % 8) * 0.04}>
              <div className="flex gap-5 border-b border-line py-4">
                <span className="w-24 shrink-0 font-mono text-[12px] text-weft">{k}</span>
                <span className="text-[14px] leading-relaxed text-mist">{v}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Licence() {
  return (
    <section id="licence" className="border-b border-line bg-ink-2/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-[clamp(1.7rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
              Public, because a count nobody can check is not a count
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-mist">
              Keeping the corpus private would make the figure unfalsifiable, which makes it worthless. Publishing
              it is what makes it real. Publishing it is not the same as making it free to monetise, and the licence
              split is where that line sits.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-ink-2/60 p-5">
                <p className="font-mono text-[11px] text-weft">Apache-2.0</p>
                <p className="mt-2 text-[14px] font-medium">Tooling</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
                  The compiler, router, verifier and this site. Fork it, ship it commercially. The patent grant
                  carries over.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-ink-2/60 p-5">
                <p className="font-mono text-[11px] text-warp">CC BY-NC-ND 4.0</p>
                <p className="mt-2 text-[14px] font-medium">Compiled spec content</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
                  Read it, verify it, redistribute it verbatim with credit. Do not sell it and do not ship
                  derivatives. Feeding it to a model to produce a commercial product is a commercial use.
                </p>
              </div>
              <p className="text-[13px] leading-relaxed text-mist">
                Priority rests on commit timestamps held by GitHub rather than by us, the regenerable SHA256SUMS,
                and the digest attached to each release tag. The restriction is waivable. Open an issue titled{' '}
                <span className="font-mono text-weft">licence request</span>.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Foot() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-center gap-4">
        <Mark size={22} />
        <span className="text-[14px] font-medium">Loomstack</span>
        <span className="font-mono text-[12px] text-mist">
          {stats.totalLines.toLocaleString('en-US')} lines · {stats.shards} shards · built {stats.generatedAt.slice(0, 10)}
        </span>
        <a href={REPO} className="ml-auto text-[13px] text-mist transition-colors hover:text-white">
          github.com/VincentiusBryanKwandou/loomstack
        </a>
      </div>
    </footer>
  );
}
