#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('⚡ Building Mpanel...');

const dirs = [
  path.join(__dirname, '../data'),
  path.join(__dirname, '../mpanel/servers'),
  path.join(__dirname, '../mpanel/backups'),
  path.join(__dirname, '../public/uploads/branding'),
  path.join(__dirname, '../public/assets')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${path.relative(process.cwd(), dir)}`);
  }
}

console.log('✅ Mpanel build and directory check complete! Ready for PM2 / production.');

