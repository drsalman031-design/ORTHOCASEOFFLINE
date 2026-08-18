/**
 * OrthoCase Cryptographic Vault Engine
 * 100% Client-Side Web Cryptography API (AES-GCM-256 + PBKDF2)
 * Zero external network dependencies.
 */

export interface EncryptedVaultPayload {
  format: 'ORTHOCASE_ENCRYPTED_VAULT';
  version: '1.0';
  createdAt: string;
  algorithm: 'AES-256-GCM';
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string; // Base64
  };
  iv: string; // Base64
  ciphertext: string; // Base64
  checksum: string; // SHA-256 of plaintext Base64 for integrity confirmation
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM-256 CryptoKey from a passphrase using PBKDF2-SHA256
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Computes a SHA-256 checksum of plaintext
 */
async function computeSha256Checksum(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufferToBase64(hashBuffer);
}

/**
 * Encrypts arbitrary JS object or string into an authenticated .orthocase vault payload
 */
export async function encryptDataToVault(
  data: unknown,
  passphrase: string
): Promise<EncryptedVaultPayload> {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const enc = new TextEncoder();
  const plaintextBuffer = enc.encode(jsonStr);

  // Generate cryptographically strong random salt (16 bytes) and IV (12 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer
  );

  const checksum = await computeSha256Checksum(jsonStr);

  return {
    format: 'ORTHOCASE_ENCRYPTED_VAULT',
    version: '1.0',
    createdAt: new Date().toISOString(),
    algorithm: 'AES-256-GCM',
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 100000,
      salt: bufferToBase64(salt),
    },
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
    checksum,
  };
}

/**
 * Decrypts an authenticated .orthocase vault payload back to typed JS data
 */
export async function decryptDataFromVault<T = unknown>(
  vault: EncryptedVaultPayload,
  passphrase: string
): Promise<T> {
  if (vault.format !== 'ORTHOCASE_ENCRYPTED_VAULT' || vault.version !== '1.0') {
    throw new Error('Unsupported or invalid .orthocase vault format.');
  }

  const salt = base64ToBuffer(vault.kdf.salt);
  const iv = base64ToBuffer(vault.iv);
  const ciphertext = base64ToBuffer(vault.ciphertext);

  const key = await deriveKeyFromPassphrase(passphrase, salt, vault.kdf.iterations);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
  } catch {
    throw new Error('Decryption failed. Incorrect password or corrupted vault file.');
  }

  const dec = new TextDecoder();
  const plaintext = dec.decode(decryptedBuffer);

  const verifyChecksum = await computeSha256Checksum(plaintext);
  if (verifyChecksum !== vault.checksum) {
    throw new Error('Vault integrity check failed. Data may have been tampered with.');
  }

  try {
    return JSON.parse(plaintext) as T;
  } catch {
    return plaintext as unknown as T;
  }
}
