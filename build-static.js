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

let output = template
  .replace('/*__CSS_APP__*/', () => appCss)
  .replace('/*__CSS_ADMIN__*/', () => adminCss)
  .replace('/*__QRCODE_JS__*/', () => qrcodeJs)
  .replace('/*__STATIC_JS__*/', () => staticJs);

fs.writeFileSync(path.join(ROOT, 'public/static.html'), output);
fs.writeFileSync(path.join(ROOT, 'public/報名表單-靜態版.html'), output);
console.log(`built ${output.length} bytes`);
