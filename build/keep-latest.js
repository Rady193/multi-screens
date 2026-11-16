// electron-builder hook, run once every installer is built: release/ keeps only
// the newest version. Installers, their blockmaps and portable files of earlier
// versions are removed (they stay on their GitHub releases); a newer one is never
// touched. Handbooks are left to handbook/build_handbook.py, which does the same.
const fs = require('fs');
const path = require('path');

const VERSIONED = /-(\d+(?:\.\d+)*)(?:-portable)?\.exe(?:\.blockmap)?$/i;
const parts = (v) => v.split('.').map(Number);
function older(a, b) {
  const x = parts(a);
  const y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0);
  }
  return false;
}

exports.default = async function keepLatest(result) {
  const version = require(path.join(__dirname, '..', 'package.json')).version;
  for (const name of fs.readdirSync(result.outDir)) {
    const m = VERSIONED.exec(name);
    if (!m || !older(m[1], version)) continue;
    fs.rmSync(path.join(result.outDir, name), { force: true });
    console.log(`  • removed the older ${name}`);
  }
  return [];
};
