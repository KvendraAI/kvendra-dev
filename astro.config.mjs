// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// kvendra.dev — static open-core developer portal.
// output:'static' is mandatory (no SSR, no backend — pure S3 + CloudFront target).
export default defineConfig({
  site: 'https://kvendra.dev',
  output: 'static',
  integrations: [mdx()],
  build: {
    format: 'directory',
  },
});
