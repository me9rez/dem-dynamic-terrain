import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      output: {
        target: 'node',
      },
      format: 'esm',
      dts: {
        bundle: true,
      },
    },
    {
      source: {
        entry: {
          'create-tile': './src/create-tile.ts',
          'cli': './src/cli.ts',
        },
      },
      output: {
        target: 'node',
      },
      format: 'esm',
      dts: false,
    },
  ],
})
