#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const projectRoot = path.join(__dirname, '..');
const files = glob.sync('**/*.js', { cwd: projectRoot, ignore: ['node_modules/**', 'logs/**'] });

files.forEach(file => {
  const full = path.join(projectRoot, file);
  if (!fs.statSync(full).isFile()) return;
  let content = fs.readFileSync(full, 'utf-8');
  const newContent = content
    .replace(/console\.log/g, 'logger.info')
    .replace(/console\.error/g, 'logger.error')
    .replace(/console\.warn/g, 'logger.warn');
  if (newContent !== content) {
    fs.writeFileSync(full, newContent, 'utf-8');
    logger.info('Updated', file);
  }
});