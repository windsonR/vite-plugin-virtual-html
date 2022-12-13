import { defineConfig } from 'tsup'

export const tsup =  defineConfig({
  entry: [
    'src/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  clean: true,
  shims: false,
  minify: false,
  sourcemap: true,
})
