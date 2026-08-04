/** @type {import('next').NextConfig} */
// Every route here is static, so the site exports to plain files. That matters
// beyond convenience: GitHub Pages serves those files publicly with no access
// gate in front of them, at a URL that carries the repository name verbatim.
// The basePath is required because the site lives under /loomstack rather than
// at the domain root.
const repo = 'loomstack';

export default {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.PAGES === '1' ? `/${repo}` : undefined,
  assetPrefix: process.env.PAGES === '1' ? `/${repo}/` : undefined,
  trailingSlash: true,
};
