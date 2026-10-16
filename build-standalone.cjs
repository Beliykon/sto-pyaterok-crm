const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Packaging standalone single-file CRM...');

const distDir = path.resolve(__dirname, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('Error: dist/index.html not found! Run vite build first.');
  process.exit(1);
}

let html = fs.readFileSync(indexHtmlPath, 'utf8');
const assetsDir = path.join(distDir, 'assets');

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find(f => f.endsWith('.css'));
  const jsFile = files.find(f => f.endsWith('.js'));

  if (cssFile) {
    const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
    html = html.replace(/<link[^>]+stylesheet[^>]+href="[^"]+"[^>]*>/i, `<style>\n${cssContent}\n</style>`);
  }

  if (jsFile) {
    const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
    html = html.replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/i, `<script type="module">\n${jsContent}\n</script>`);
  }
}

// Write the standalone bundle
const standalonePath = path.resolve(__dirname, 'СТО_ПЯТЁРОК_CRM.html');
fs.writeFileSync(standalonePath, html, 'utf8');
console.log('✓ Successfully updated СТО_ПЯТЁРОК_CRM.html (' + (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + ' MB)');

// Also update the archive for distribution
try {
  execSync('tar -czf standalone-crm-100-pyaterok.tar.gz СТО_ПЯТЁРОК_CRM.html setup_and_run.bat package.json README.md', { stdio: 'ignore' });
  console.log('✓ Successfully created standalone-crm-100-pyaterok.tar.gz archive');
} catch (err) {
  // Ignore tar error if not in Linux/Unix
}
