/**
 * IKWAS Al-Furqon — Password Crypto Utilities
 * 
 * Uses Web Crypto API (crypto.subtle) — built-in Cloudflare Workers runtime.
 * Algorithm: PBKDF2 + SHA-256, 310,000 iterations (OWASP 2024 minimum).
 * Storage format: "<salt_hex>:<hash_hex>" as a single TEXT column.
 */

const ITERATIONS = 310_000;
const HASH_ALG = "SHA-256";
const KEY_LENGTH = 256; // bits

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Hash a plaintext password using PBKDF2.
 * Returns a string in the format "<salt_hex>:<hash_hex>".
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALG,
    },
    keyMaterial,
    KEY_LENGTH
  );

  const saltHex = bufferToHex(salt.buffer);
  const hashHex = bufferToHex(hashBits);
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a plaintext password against a stored "<salt_hex>:<hash_hex>" string.
 * Uses timing-safe comparison via crypto.subtle.
 */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  try {
    const [saltHex, storedHashHex] = stored.split(":");
    if (!saltHex || !storedHashHex) return false;

    const salt = hexToBuffer(saltHex);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const hashBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new Uint8Array(salt),
        iterations: ITERATIONS,
        hash: HASH_ALG,
      },
      keyMaterial,
      KEY_LENGTH
    );

    const candidateHex = bufferToHex(hashBits);
    
    // Timing-safe string comparison
    if (candidateHex.length !== storedHashHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < candidateHex.length; i++) {
      mismatch |= candidateHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

/**
 * Generate a random session token (UUID v4).
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Compute expiry datetime string for a session.
 * @param rememberMe - if true, 30 days; else 8 hours
 */
export function computeExpiry(rememberMe: boolean): string {
  const ms = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}
