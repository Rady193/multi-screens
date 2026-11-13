// electron-builder hook. The Windows executable is stamped with the app icon and
// version details here (instead of by electron-builder's own step, which needs
// administrator rights to unpack its signing tools on Windows).
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const rcedit = require('rcedit');
  const info = context.packager.appInfo;
  const exe = path.join(context.appOutDir, `${info.productFilename}.exe`);
  await rcedit(exe, {
    icon: path.join(__dirname, 'icon.ico'),
    'file-version': info.version,
    'product-version': info.version,
    'version-string': {
      ProductName: info.productName,
      FileDescription: info.productName,
      CompanyName: info.companyName || 'SCAFFApps',
      LegalCopyright: info.copyright,
      OriginalFilename: `${info.productFilename}.exe`,
    },
  });
};
