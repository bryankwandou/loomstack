# Licence for the spec content

Two licences apply to this repository and they cover different things.

**Tooling** — everything under `packages/`, `scripts/`, `web/`, and `specs/grammar/`
is licensed under Apache License 2.0. See [LICENSE](LICENSE). Use it, fork it,
ship it commercially. Attribution and the patent grant carry over.

**Compiled spec content** — everything under `dist/`, `release/`, and any file
named `MEGAPROMPT*.md`, is licensed under
**Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International
(CC BY-NC-ND 4.0)**.

Full text: https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode

In plain terms, for the compiled spec content:

- You may read it, copy it, and redistribute it verbatim.
- You must credit Loomstack and link back to this repository.
- You may not use it for commercial purposes.
- You may not distribute modified or derived versions of it.

Feeding the compiled spec content to a model in order to generate a commercial
product is a commercial use and is not covered by this licence. Ask first.

## Why the split

The record claim only means something if anyone can clone the repository, run
`npm run verify`, and recount the lines themselves. That requires the content to
be public. Making it public is not the same as making it free to monetise, and
CC BY-NC-ND is the line between the two.

## Provenance

Priority is established by, in order of strength:

1. Git commit timestamps in this repository, held on GitHub's servers rather
   than ours.
2. `dist/SHA256SUMS`, regenerable byte-for-byte by anyone via `npm run build`.
3. The release tag and the digest of its attached bundle.

## Commercial licensing

The non-commercial restriction is waivable. Open an issue titled
`licence request` describing the intended use.
