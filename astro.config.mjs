// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://classic.ocsw.it',
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
});
