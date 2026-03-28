import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://kaynine.github.io',
  integrations: [tailwind({ configFile: './tailwind.config.cjs' })],
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.notion.so' },
    ],
  },
});
