// build.js
const fs = require('fs');
const header = `
// ==UserScript==
// @name         OPUx
// @namespace    http://tampermonkey.net/
// @version      1.32-dev
// @description  Modular OPU enhancer
// @author       Grok (xAI) & Blasnik
// @match        https://opu.peklo.biz/?page=userpanel*
// @match        https://opu.peklo.biz/?page=settings*
// @grant        GM_addStyle
// ==/UserScript==

`;
const files = [
  'src/opux-style.js',
  'src/opux-utils.js',
  'src/opux-settings.js',
  'src/opux-userpanel.js',
  'src/opux-core.js'
];
const output = header + files.map(f => fs.readFileSync(f, 'utf8')).join('\n\n');
fs.writeFileSync('opux.user.js', output);
console.log('Built opux.user.js');
