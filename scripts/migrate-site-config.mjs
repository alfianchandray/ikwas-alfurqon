import { execSync } from 'child_process';
import * as fs from 'fs';

const sql = `
-- Migration to add favicon_url and logo_url to site_config
ALTER TABLE site_config ADD COLUMN favicon_url TEXT;
ALTER TABLE site_config ADD COLUMN logo_url TEXT;
`;

const tmpFile = 'migration-site-config-temp.sql';
fs.writeFileSync(tmpFile, sql);

console.log('📦 Altering site_config table in local D1...');
try {
  execSync(`npx wrangler d1 execute ikwas-db --local --file=${tmpFile}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Alteration complete! (If columns already existed, SQLite will throw an error, which is safe to ignore)');
} catch (err) {
  console.log('⚠️ Migration note: Columns might already exist or table is updated.');
} finally {
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
}
