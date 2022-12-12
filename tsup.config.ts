import type { Options } from 'tsup'

export const tsup: Options = {
  entry: [
    'src/plugin.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  shims: false,
}
