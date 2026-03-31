import { defineConfig, passthroughImageService } from 'astro/config';

export default defineConfig({
  site: 'https://kaynine.github.io',
  image: {
    service: passthroughImageService(),
  },
});
