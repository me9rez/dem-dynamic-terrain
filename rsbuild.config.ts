import { defineConfig } from '@rsbuild/core'

export default defineConfig({
  source: {
    entry: { index: './test/viewer.ts' },
  },
  html: {
    template: './test/viewer.html',
  },
  server: {
    publicDir: [
      {
        name: 'test',
        copyOnBuild: false,
        watch: false,
      },
    ],
  },
})
