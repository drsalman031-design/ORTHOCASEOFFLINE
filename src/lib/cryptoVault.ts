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
  meta?: {
    appName?: string;
    appVersion?: string;
    deviceKeyId?: string;
    recordCount?: number;
  };
}

const DEVICE_KEY_STORAGE_KEY = 'orthocase_device_vault_key';
const DEFAULT_FALLBACK_SEED = 'orthocase-offline-device-vault-v1';

/**
 * Retrieves or lazily creates a device-bound cryptographic master key in localStorage.
 * This guarantees seamless one-click local backup & restore on the student's phone.
 */
export function getOrCreateDeviceKey(): string {
  try {
    let key = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (!key) {
      const randomBytes = crypto.getRandomValues(new Uint8Array(24));
      key = `orthocase_dev_${Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
      localStorage.setItem(DEVICE_KEY_STORAGE_KEY, key);
    }
    return key;
  } catch {
    return DEFAULT_FALLBACK_SEED;
  }
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
 * Derives an AES-GCM-256 CryptoKey from a passphrase or device key using PBKDF2-SHA256
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
export async function computeSha256Checksum(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufferToBase64(hashBuffer);
}

/**
 * Encrypts arbitrary JS object or string into an authenticated .orthocase vault payload
 */
export async function encryptDataToVault(
  data: unknown,
  passphrase?: string,
  meta?: EncryptedVaultPayload['meta']
): Promise<EncryptedVaultPayload> {
  const effectiveKey = passphrase && passphrase.trim().length > 0 ? passphrase.trim() : getOrCreateDeviceKey();
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const enc = new TextEncoder();
  const plaintextBuffer = enc.encode(jsonStr);

  // Generate cryptographically strong random salt (16 bytes) and IV (12 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKeyFromPassphrase(effectiveKey, salt);
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
    meta: {
      appName: 'OrthoCase Clinical Logbook',
      appVersion: '3.4.0',
      ...meta,
    },
  };
}

/**
 * Decrypts an authenticated .orthocase vault payload back to typed JS data.
 * If no passphrase is provided, first tries the local device key, then fallback keys.
 */
export async function decryptDataFromVault<T = unknown>(
  vault: EncryptedVaultPayload,
  passphrase?: string
): Promise<T> {
  if (vault.format !== 'ORTHOCASE_ENCRYPTED_VAULT' || vault.version !== '1.0') {
    throw new Error('Unsupported or invalid .orthocase vault format.');
  }

  const salt = base64ToBuffer(vault.kdf.salt);
  const iv = base64ToBuffer(vault.iv);
  const ciphertext = base64ToBuffer(vault.ciphertext);

  const keysToTry: string[] = [];
  if (passphrase && passphrase.trim().length > 0) {
    keysToTry.push(passphrase.trim());
  } else {
    keysToTry.push(getOrCreateDeviceKey());
    keysToTry.push(DEFAULT_FALLBACK_SEED);
  }

  let decryptedBuffer: ArrayBuffer | null = null;
  let lastError: any = null;

  for (const keyCandidate of keysToTry) {
    try {
      const key = await deriveKeyFromPassphrase(keyCandidate, salt, vault.kdf.iterations);
      decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      if (decryptedBuffer) break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!decryptedBuffer) {
    throw new Error('Decryption failed. The file may be password-protected or corrupted.');
  }

  const dec = new TextDecoder();
  const plaintext = dec.decode(decryptedBuffer);

  const verifyChecksum = await computeSha256Checksum(plaintext);
  if (verifyChecksum !== vault.checksum) {
    throw new Error('Vault integrity check failed. Cryptographic checksum does not match.');
  }

  try {
    return JSON.parse(plaintext) as T;
  } catch {
    return plaintext as unknown as T;
  }
}
