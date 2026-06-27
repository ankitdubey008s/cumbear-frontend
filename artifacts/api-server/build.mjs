import esbuild from 'esbuild';

async function runBuild() {
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: 'dist/index.js',
      external: ['express', 'pino', 'pino-http', 'cors', 'axios', 'lowdb'],
      logLevel: 'info',
    });
    console.log('✨ Build compiled successfully via esbuild script!');
  } catch (error) {
    console.error('💥 Build failed:', error);
    process.exit(1);
  }
}

runBuild();
