import esbuild from 'esbuild';
const mode = process.env.NODE_ENV || 'production';
console.log({ mode });
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format:'esm',
    outfile: 'dist/index.mjs',
    sourcemap: 'inline',
    outExtension: { '.js': '.mjs' },
    minify: mode === 'production',
  })
  .catch(() => process.exit(1));
