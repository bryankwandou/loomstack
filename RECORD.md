# The record claim, stated so it can be attacked

This document exists so that a sceptic does not have to take our word for
anything. Every figure below is reproducible on a laptop in about two minutes.

## Claim

Loomstack's compiled corpus contains **5,001,816 lines**, exceeding the previous
longest published prompt document of **927,551 lines** by **4,074,265 lines**.

```
lines       5,001,816
bytes       356,085,247   (356.1 MB)
avg line    71.19 chars
entities    6,048
shards      24
```

## How to falsify it

```bash
git clone https://github.com/VincentiusBryanKwandou/loomstack
cd loomstack
npm run verify
```

`verify` does not read `stats.json` and report it back to you. It opens every
shard, counts newline bytes, recomputes SHA-256 over the raw stream, and
compares those independently derived numbers against `manifest.json`. Any
mismatch prints the offending shard and exits non-zero.

Then regenerate the corpus from the grammar and confirm the digests still match:

```bash
npm run build
npm run verify
```

If `build` produced anything other than the committed bytes, the digests break.
That is the point. The generator is deterministic, so the corpus is a function
of the grammar, not a file we could have hand-tuned to hit a number.

## Counting method

- A line is a run of bytes terminated by `0x0A`. A final unterminated run counts
  as one line.
- Bytes are raw file bytes. There is no BOM and no CRLF anywhere in `dist/`;
  `.gitattributes` sets `* -text` specifically so a Windows checkout cannot add
  a byte per line and shift every digest.
- The count covers `dist/shards/*.md` only. Source code, README, and licence
  files are excluded.
- Blank lines: the corpus contains one blank line per shard header, 24 in total.
  Removing them changes the figure to 5,001,792, still clear of the threshold by
  over four million.

## Anticipated objections

**"It is generated, so it does not count."**
Correct that it is generated, and the generator is in the repository so you can
read exactly what it does. The prior 927,551 line document was also assembled
programmatically. What would make a corpus meaningless is duplication, so
address that directly rather than through the word "generated".

**"Then it must be duplicated filler."**
Every line carries an entity address, and the 6,048 entity addresses are unique.
Within an entity the sections cover distinct concerns and the lines within a
section vary by role, action, state, field or index. Average line length is
71.19 characters, not the 15 to 20 you would see from padding. Run
`sort -u dist/shards/*.md | wc -l` and compare against the total if you want the
duplication rate rather than an assertion about it.

**"Nobody can use a five million line prompt."**
Agreed, and that is stated on the front page of the README rather than buried.
No model can ingest 75 million tokens. This is why the router exists and why the
corpus is not presented as something to paste.

**"The prior record was one file, yours is 24."**
The corpus is a single logical document split for a mechanical reason: GitHub
hard-blocks any tracked file above 100 MB. `npm run bundle` concatenates the
shards into one `MEGAPROMPT.md`, which is published as a Release asset where the
ceiling is 2 GB. Both forms hash to a value you can check.

## Provenance

1. Signed commit timestamps in this repository.
2. `dist/SHA256SUMS`, regenerable byte for byte from source.
3. The release tag and its attached bundle digest.

Priority disputes should be settled against the earliest commit that contains
the corpus, not against the date of any announcement.
