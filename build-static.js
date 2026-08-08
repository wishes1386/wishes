'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const template = read('static-src/index.html');
const appCss = read('public/css/app.css');
const adminCss = read('public/css/admin.css');
const qrcodeJs = read('public/vendor/qrcode.js');
const staticJs = read('static-src/app.js');
const logoDataUri = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'public/assets/cht-logo-combined.png')).toString('base64')}`;

let output = template
  .replace('/*__CSS_APP__*/', () => appCss)
  .replace('/*__CSS_ADMIN__*/', () => adminCss)
  .replace('/*__QRCODE_JS__*/', () => qrcodeJs)
  .replace('/*__STATIC_JS__*/', () => staticJs)
  .replace('__LOGO_DATA_URI__', () => logoDataUri);

fs.writeFileSync(path.join(ROOT, 'public/static.html'), output);
console.log(`built ${output.length} bytes`);
