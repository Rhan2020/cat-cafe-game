const fs = require('fs');
const path = require('path');

const loadedLocales = {};

function loadLocale(lang) {
  if (loadedLocales[lang]) return loadedLocales[lang];
  const file = path.join(__dirname, '..', 'locales', `${lang}.json`);
  if (fs.existsSync(file)) {
    loadedLocales[lang] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } else {
    loadedLocales[lang] = {};
  }
  return loadedLocales[lang];
}

function t(lang, key, defaultText = '') {
  const locale = loadLocale(lang);
  const keys = key.split('.');
  let cur = locale;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in cur) {
      cur = cur[k];
    } else {
      return defaultText || key; // fallback
    }
  }
  return cur || defaultText || key;
}

// Express middleware: attaches res.t
function i18nMiddleware(req, res, next) {
  const acceptLang = req.headers['accept-language'] || 'zh-CN';
  const lang = acceptLang.startsWith('en') ? 'en' : 'zh';
  res.locals.lang = lang;
  res.t = (key, def) => t(lang, key, def);
  next();
}

module.exports = { t, i18nMiddleware };