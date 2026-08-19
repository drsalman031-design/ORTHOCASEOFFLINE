/**
 * OrthoCase Local File Backup & Storage Helper
 * 100% Offline client-side file saver and reader optimized for mobile & desktop.
 */

export function getFormattedBackupFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `OrthoCase_Backup_${year}-${month}-${day}.orthocase`;
}

/**
 * Saves a backup file directly to phone/device storage.
 * Leverages native File System Access API where supported, with seamless
 * fallback to Blob-trigger download for mobile browsers and Android WebViews.
 */
export async function saveBackupFileToDevice(
  payloadString: string,
  filename: string = getFormattedBackupFilename()
): Promise<boolean> {
  const blob = new Blob([payloadString], {
    type: 'application/octet-stream',
  });

  // 1. Try modern File System Access API if supported (Chrome Android / Desktop)
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'OrthoCase Encrypted Clinical Vault (.orthocase)',
            accept: {
              'application/octet-stream': ['.orthocase'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      // User cancelled picker -> don't fallback to anchor download
      if (err?.name === 'AbortError') {
        return false;
      }
      console.warn('showSaveFilePicker failed, falling back to Blob download:', err);
    }
  }

  // 2. Universal Mobile & Web fallback via Blob anchor
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Clean up URL object after a short delay
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);

  return true;
}

/**
 * Reads an uploaded file as UTF-8 string text
 */
export function readUploadedFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected'));
      return;
    }

    if (file.text) {
      file.text().then(resolve).catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read backup file'));
    };
    reader.readAsText(file);
  });
}
