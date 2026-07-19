/**
 * Migration Script: Generate PBKDF2 password hashes & seed users table.
 * 
 * Run: node scripts/migrate-auth.mjs
 * 
 * This script:
 *   1. Generates PBKDF2-SHA256 hashes for default passwords
 *   2. Creates SQL statements to update the users table
 *   3. Runs the SQL against the local D1 database via wrangler
 */

import { execSync } from 'child_process';

const ITERATIONS = 100_000;
const HASH_ALG = "SHA-256";
const KEY_LENGTH = 256;

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  // Use globalThis.crypto for Node.js 18+
  globalThis.crypto.getRandomValues(salt);

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALG },
    keyMaterial,
    KEY_LENGTH
  );

  const saltHex = bufferToHex(salt.buffer);
  const hashHex = bufferToHex(hashBits);
  return `${saltHex}:${hashHex}`;
}

async function main() {
  console.log('🔐 Generating PBKDF2 password hashes...\n');

  const accounts = [
    { id: 1, username: 'superadmin', password: 'ikwas2026', must_change_pw: 0 },
    { id: 2, username: 'bendahara1', password: 'ikwas2026', must_change_pw: 1 },
    { id: 3, username: 'bendahara2', password: 'ikwas2026', must_change_pw: 1 },
  ];

  const sqlStatements = [];

  for (const acc of accounts) {
    process.stdout.write(`  Hashing ${acc.username}...`);
    const hash = await hashPassword(acc.password);
    console.log(' ✓');
    
    sqlStatements.push(
      `INSERT OR REPLACE INTO users (id, pengurus_id, username, password_hash, must_change_pw) VALUES (${acc.id}, ${acc.id}, '${acc.username}', '${hash}', ${acc.must_change_pw});`
    );
  }

  // Also run the new table creation (idempotent)
  const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    pengurus_id    INTEGER NOT NULL UNIQUE,
    username       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash  TEXT    NOT NULL,
    is_active      INTEGER NOT NULL DEFAULT 1,
    must_change_pw INTEGER NOT NULL DEFAULT 0,
    last_login     TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pengurus_id) REFERENCES pengurus(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    token       TEXT    NOT NULL UNIQUE,
    ip_address  TEXT,
    user_agent  TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT    NOT NULL,
    is_revoked  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    username    TEXT,
    action      TEXT    NOT NULL,
    target_type TEXT,
    target_id   TEXT,
    detail      TEXT,
    ip_address  TEXT,
    status      TEXT    NOT NULL DEFAULT 'success',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

CREATE TABLE IF NOT EXISTS roles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL UNIQUE,
    default_permissions TEXT    NOT NULL
);

INSERT OR IGNORE INTO roles (id, name, default_permissions) VALUES
(1, 'Super Admin', '{"dashboard":true,"pemasukan":true,"pengeluaran":true,"santri":true,"laporan":true}'),
(2, 'Bendahara Pemasukan', '{"dashboard":true,"pemasukan":true,"pengeluaran":false,"santri":true,"laporan":false}'),
(3, 'Bendahara Pengeluaran', '{"dashboard":true,"pemasukan":false,"pengeluaran":true,"santri":false,"laporan":true}');
`;

  const allSql = schemaSql.trim() + '\n\n' + sqlStatements.join('\n');
  
  // Write to temp file
  const tmpFile = 'migration-auth-temp.sql';
  const fs = await import('fs');
  fs.writeFileSync(tmpFile, allSql);

  console.log('\n📦 Running migration against local D1...');
  try {
    execSync(`npx wrangler d1 execute ikwas-db --local --file=${tmpFile}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ Migration complete!');
    console.log('\n📋 Default credentials:');
    console.log('   superadmin  / ikwas2026  (Super Admin)');
    console.log('   bendahara1  / ikwas2026  (Bendahara Pemasukan — must change password)');
    console.log('   bendahara2  / ikwas2026  (Bendahara Pengeluaran — must change password)\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

main();
