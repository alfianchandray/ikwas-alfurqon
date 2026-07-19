/**
 * Script: Generate password hashes dan eksekusi langsung ke remote D1
 */
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

const ITERATIONS = 10_000;
const HASH_ALG = "SHA-256";
const KEY_LENGTH = 256;

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALG },
    keyMaterial, KEY_LENGTH
  );
  return `${bufferToHex(salt.buffer)}:${bufferToHex(hashBits)}`;
}

async function main() {
  console.log('🔐 Generating PBKDF2 hashes untuk remote D1...\n');

  const accounts = [
    { id: 1, pengurus_id: 1, username: 'superadmin', password: 'ikwas2026', must_change_pw: 0 },
    { id: 2, pengurus_id: 2, username: 'bendahara1', password: 'ikwas2026', must_change_pw: 1 },
    { id: 3, pengurus_id: 3, username: 'bendahara2', password: 'ikwas2026', must_change_pw: 1 },
  ];

  const sqlStatements = [];
  for (const acc of accounts) {
    process.stdout.write(`  Hashing ${acc.username}...`);
    const hash = await hashPassword(acc.password);
    console.log(' ✓');
    sqlStatements.push(
      `INSERT OR REPLACE INTO users (id, pengurus_id, username, password_hash, must_change_pw) VALUES (${acc.id}, ${acc.pengurus_id}, '${acc.username}', '${hash}', ${acc.must_change_pw});`
    );
  }

  const tmpFile = 'migration-auth-remote-temp.sql';
  writeFileSync(tmpFile, sqlStatements.join('\n'));

  console.log('\n📦 Mengirim ke remote D1 Cloudflare...');
  try {
    execSync(`npx wrangler d1 execute ikwas-db --remote --file=${tmpFile}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: true
    });
    console.log('\n✅ Selesai! Kredensial default:');
    console.log('   superadmin  / ikwas2026');
    console.log('   bendahara1  / ikwas2026');
    console.log('   bendahara2  / ikwas2026\n');
  } catch (err) {
    console.error('\n❌ Gagal:', err.message);
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

main();
