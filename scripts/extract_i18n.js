#!/usr/bin/env node
/*
 * Scan codebase for hard-coded Chinese characters and output a report.
 * Optional flag --write : perform in-place replacement of server side strings to res.t('auto_key')
 *                         and push new keys into locales/zh.json (english left empty).
 * NOTE: for safety only replaces .js on server_global; front-end handled later manually.
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const argv = process.argv.slice(2);
const WRITE_MODE = argv.includes('--write');

const root = path.join(__dirname, '..');
const serverDir = path.join(root, 'server_global');
const zhLocalePath = path.join(serverDir, 'locales', 'zh.json');
const enLocalePath = path.join(serverDir, 'locales', 'en.json');

const zhLocale = fs.existsSync(zhLocalePath) ? JSON.parse(fs.readFileSync(zhLocalePath, 'utf-8')) : {};
const enLocale = fs.existsSync(enLocalePath) ? JSON.parse(fs.readFileSync(enLocalePath, 'utf-8')) : {};

function setDeep(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] || {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function processFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  const chineseRegex = /([\u4e00-\u9fa5]{2,})/g;
  let match;
  let modified = false;
  while ((match = chineseRegex.exec(code)) !== null) {
    const text = match[1];
    const key = `auto.${Buffer.from(text).toString('hex').slice(0,8)}`; // derive simple key
    if (!zhLocale.auto) zhLocale.auto = {};
    if (!zhLocale.auto[key.split('.')[1]]) {
      setDeep(zhLocale, key, text);
      setDeep(enLocale, key, text);
    }
    if (WRITE_MODE) {
      const replacement = "res.t('" + key + "')";
      code = code.replace(text, replacement);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(file, code, 'utf-8');
    console.log('Replaced in', path.relative(root, file));
  }
}

const files = glob.sync('server_global/**/*.js', { cwd: root, ignore: ['node_modules/**', 'logs/**', 'locales/**'] });
files.forEach(f => processFile(path.join(root, f)));

if (WRITE_MODE) {
  fs.writeFileSync(zhLocalePath, JSON.stringify(zhLocale, null, 2), 'utf-8');
  fs.writeFileSync(enLocalePath, JSON.stringify(enLocale, null, 2), 'utf-8');
  console.log('Locales updated.');
} else {
  console.log('[Dry-run] Finished scanning. Run with --write to replace.');
}