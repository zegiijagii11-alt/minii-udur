// Copies the PWA files from the repo root into native/www for Capacitor.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
for (const f of files) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ['css', 'js']) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });
console.log('Copied', files.length, 'files + css/ js/ to www/');
