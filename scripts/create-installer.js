const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');

async function createInstallers() {
  const distDir = path.join(__dirname, '../dist');
  const installersDir = path.join(__dirname, '../installers');

  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    console.error('❌ Distribution directory not found at:', distDir);
    console.error('   Run: npm run bundle');
    process.exit(1);
  }

  await fs.ensureDir(installersDir);
  await fs.emptyDir(installersDir);

  let version;
  try {
    const packageJson = require('../package.json');
    version = packageJson.version;
  } catch (err) {
    console.error('❌ Could not read package.json:', err.message);
    process.exit(1);
  }

  console.log(`📦 Creating installers for version ${version}...\n`);

  try {
    // Create tar.gz for macOS/Linux
    console.log('📦 Creating tar.gz for macOS/Linux...');
    const tarPath = path.join(installersDir, `omni-ai-v${version}-macos-linux.tar.gz`);
    await createArchive(distDir, tarPath, 'tar');
    const tarSize = ((await fs.stat(tarPath)).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ ${path.basename(tarPath)} (${tarSize} MB)\n`);

    // Create zip for Windows
    console.log('📦 Creating zip for Windows...');
    const zipPath = path.join(installersDir, `omni-ai-v${version}-windows.zip`);
    await createArchive(distDir, zipPath, 'zip');
    const zipSize = ((await fs.stat(zipPath)).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ ${path.basename(zipPath)} (${zipSize} MB)\n`);

    console.log('✅ Installers created successfully!');
    console.log(`📍 Location: ${installersDir}`);
    console.log('\n🎯 Distribution packages ready for release:');
    console.log(`  - omni-ai-v${version}-macos-linux.tar.gz`);
    console.log(`  - omni-ai-v${version}-windows.zip`);
  } catch (err) {
    console.error('❌ Error creating installers:', err.message);
    process.exit(1);
  }
}

async function createArchive(sourceDir, outputPath, format) {
  const output = fs.createWriteStream(outputPath);
  const archive = archiver(format, {
    gzip: format === 'tar',
    gzipOptions: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') {
        console.warn('Warning:', err.message);
      }
    });

    archive.pipe(output);
    archive.directory(sourceDir, 'omni-ai');
    archive.finalize();
  });
}

createInstallers().catch(console.error);
