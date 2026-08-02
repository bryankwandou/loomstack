'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import manifest from '@/data/manifest.json';
import domains from '@/data/domains.json';

type Shard = { file: string; domain: string; lines: number; bytes: number; sha256: string };

const tone = (id: string) => domains.find((d) => d.id === id)?.tone ?? '';
const label = (id: string) => domains.find((d) => d.id === id)?.label ?? id;

export default function ShardGrid() {
  const shards = manifest.shards as Shard[];
  const [open, setOpen] = useState<Shard | null>(shards[1] ?? null);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {shards.map((s, i) => {
          const active = open?.file === s.file;
          return (
            <motion.button
              key={s.file}
              onClick={() => setOpen(s)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ delay: (i % 12) * 0.028, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative overflow-hidden rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-warp/60 bg-warp/10'
                  : 'border-line bg-ink-2/60 hover:border-mist/40'
              }`}
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-weft/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="block font-mono text-[10px] text-mist">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mt-1 block text-[13px] font-medium tracking-tight">{label(s.domain)}</span>
              <span className="mt-1 block font-mono text-[10px] text-mist">
                {(s.lines / 1000).toFixed(1)}k
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="rounded-xl border border-line bg-ink-2/70 p-6">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key={open.file}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-xs text-weft">{open.file}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{label(open.domain)}</h3>
              <p className="mt-1 text-sm text-mist">{tone(open.domain)}</p>

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-5">
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-mist">Lines</dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">{open.lines.toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-mist">Size</dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">{(open.bytes / 1e6).toFixed(1)} MB</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-mist">Entities</dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">252</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-mist">Avg line</dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">{(open.bytes / open.lines).toFixed(1)} ch</dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[11px] uppercase tracking-widest text-mist">SHA-256</p>
                <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-mist/90">{open.sha256}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
