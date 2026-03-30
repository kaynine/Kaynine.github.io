import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kaynine.github.io',
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.notion.so' },
    ],
  },
});
