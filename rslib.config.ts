import { build, defineConfig } from '@rslib/core'

await build({
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    target: 'node',
  },
  lib: [
    {
      format: 'esm',
      dts: {
        bundle: true,
      },

    },
  ],
})

await build({
  source: {
    entry: {
      'create-tile': './src/create-tile.ts',
      'cli': './src/cli.ts',
    },
  },
  output: {
    target: 'node',
    cleanDistPath: false,
  },
  lib: [
    {
      format: 'esm',
      dts: false,

    },
  ],
})
