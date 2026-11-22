// Шинэ хувилбар бэлтгэх: node tools/release.js 1.8.1 [--shell N]
// - index.html: VERSION + ?v= параметрүүд
// - sw.js: кэшийн нэр + файлын жагсаалт
// - version.json: хувилбар, файлын жагсаалт (утсан дээрх автомат шинэчлэл эдгээрийг татна), minShell
// - js/*.js бүрийн синтаксыг шалгана — алдаатай бол юу ч өөрчлөхгүй
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const ver = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(ver || '')) { console.error('usage: node tools/release.js X.Y.Z [--shell N]'); process.exit(1); }
const si = process.argv.indexOf('--shell');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8'), wr = (f, s) => fs.writeFileSync(path.join(root, f), s);

const js = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f);
const css = fs.readdirSync(path.join(root, 'css')).filter(f => f.endsWith('.css')).map(f => 'css/' + f);
for (const f of js) execFileSync(process.execPath, ['--check', path.join(root, f)], { stdio: 'inherit' });

let html = rd('index.html');
if (!/const VERSION='[^']+'/.test(html)) throw new Error('index.html-д VERSION мөр алга (утасны шинэчлэл үүнийг шалгадаг)');
html = html.replace(/const VERSION='[^']+'/, `const VERSION='${ver}'`).replace(/(\.(?:js|css))\?v=[\d.]+/g, `$1?v=${ver}`);
// index.html-д холбогдоогүй js файл байвал анхааруулна
for (const f of js) if (!html.includes(`src="${f}?v=`)) console.warn('⚠️ index.html-д холбогдоогүй:', f);
wr('index.html', html);

const files = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', ...css, ...js];
const vj = JSON.parse(rd('version.json'));
vj.version = ver; vj.files = files; if (si > 0) vj.minShell = +process.argv[si + 1];
wr('version.json', JSON.stringify(vj) + '\n');

let sw = rd('sw.js');
sw = sw.replace(/const CACHE = '[^']+'/, `const CACHE = 'minii-udur-v${ver}'`)
       .replace(/const ASSETS = \[[^\]]*\]/, `const ASSETS = ${JSON.stringify(['./', ...files])}`);
wr('sw.js', sw);
console.log(`✓ v${ver} · ${files.length} файл · minShell ${vj.minShell}`);
