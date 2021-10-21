import esbuild from 'esbuild';
//import fs from 'fs/promises'

const mode = process.env.NODE_ENV || 'production';
const buildOptions={
  splitting: mode === "production",

  entryPoints: ['api/index.ts','api/Badger.ts','api/modules/computeAssetRequest.ts','api/modules/GithubRequest.ts'],
  outdir:'dist',
  bundle: true,
  format:'esm',
  write: true,
  metafile: true,
  sourcemap: 'inline',
  outExtension: { '.js': '.mjs' },
  minify: mode === 'production',
}
esbuild
  .build(buildOptions)
 
  .then(result => {
      console.log({ ...buildOptions, mode, resultkeys: Object.keys(result) })
      //if (result.metafile) return fs.writeFile('meta.json', JSON.stringify(result.metafile,null,2))
      return
  })
  .catch((err) => {
      console.error(err)
      return process.exit(1)
  })
