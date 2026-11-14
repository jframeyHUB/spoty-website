/** @type {import('next').NextConfig} */
const security = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];

export default {
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] },
  async rewrites() {
    // The marketing homepage and privacy page stay as hand-written static HTML.
    return { beforeFiles: [{ source: '/', destination: '/home.html' }, { source: '/privacy', destination: '/privacy.html' }] };
  },
  async headers() {
    return [
      { source: '/(.*)', headers: security },
      { source: '/brand/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }
    ];
  }
};
