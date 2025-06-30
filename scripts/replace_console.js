#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const projectRoot = path.join(__dirname, '..');
const files = glob.sync('**/*.js', { cwd: projectRoot, ignore: ['node_modules/**', 'logs/**'] });

files.forEach(file => {
  const full = path.join(projectRoot, file);
  let content = fs.readFileSync(full, 'utf-8');
  let replaced = false;
  content = content.replace(/console\.log/g, 'logger.info');
  content = content.replace(/console\.error/g, 'logger.error');
  content = content.replace(/console\.warn/g, 'logger.warn');
  if (content !== fs.readFileSync(full, 'utf-8')) {
    replaced = true;
    fs.writeFileSync(full, content, 'utf-8');
  }
  if (replaced) console.log('Updated', file);
});