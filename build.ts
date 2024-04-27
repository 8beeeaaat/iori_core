import { BuildOptions, build } from 'esbuild';
const entryFile = './src/index.ts';
const shared: BuildOptions = {
  bundle: true,
  entryPoints: [entryFile],
  logLevel: 'info',
  minify: true,
  sourcemap: true,
};

build({
  ...shared,
  format: 'esm',
  outfile: './dist/index.mjs',
});

build({
  ...shared,
  format: 'cjs',
  outfile: './dist/index.cjs',
});
