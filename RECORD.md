# The record claim, stated so it can be attacked

This document exists so that a sceptic does not have to take our word for
anything. Every figure below is reproducible on a laptop in about two minutes.

## Claim

Loomstack's compiled corpus contains **5,001,816 lines**, exceeding the previous
longest published prompt document of **927,551 lines** by **4,074,265 lines**.

```
lines       5,001,816
bytes       370,340,527   (370.3 MB)
avg line    74.04 chars
entities    6,048
shards      24
```

## The harder question, answered

Line count alone proves nothing. A file of five million newlines would also
count. So `npm run audit` measures the things that would expose padding, and
prints a pass or fail against fixed thresholds rather than leaving you to judge:

```
Line length distribution
  min 7   p01 10   p10 52   p25 62   median 73   p75 84   p90 98   p99 121   max 146

Filler test
  lines under 10 chars   42,459    0.85%
  lines under 20 chars  139,142    2.78%
  lines under 40 chars  175,007    3.50%
  lines 40 chars and up 4,826,809  96.50%
  blank lines                  24  0.00%

Duplication test
  distinct lines      4,820,811   96.38%
  repeated lines        181,005    3.62%
  vocabulary            14,108 distinct tokens (sampled)

Verdict
  PASS  under 5% of lines are shorter than 20 chars
  PASS  over 90% of lines are distinct
  PASS  mean line length exceeds 40 chars
```

The residual 3.62% is almost entirely section headers such as `#### ui`, which
repeat once per entity by design because they are structural markdown.

This audit did not pass on the first attempt. The initial corpus scored 11.73%
duplicate lines and failed its own threshold, because error codes and terminal
state transitions were scoped per module rather than per entity, so fourteen
entities shared them. That is a genuine defect in a specification: two entities
must not share an error code. The generator was corrected and the corpus
rebuilt. The failing run is in the git history rather than deleted from it.

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
