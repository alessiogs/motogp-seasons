// Static export for GitHub Pages. The workflow sets NEXT_PUBLIC_BASE_PATH=/motogp-seasons;
// leave it unset locally (or when using a custom domain).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // Native module: read at build time only, never bundled for the browser.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
