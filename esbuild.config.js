// import { build } from 'esbuild';
// import { nodeExternalsPlugin } from 'esbuild-node-externals';
const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { SourceMap } = require('module');

const shared = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  minify: false, // 代码压缩
  sourcemap: true, // 生成map文件
}

build({
  ...shared,
  outfile: 'dist/index.js',
})

build({
  ...shared,
  outfile: 'dist/index.esm.js',
  format: 'esm',
});