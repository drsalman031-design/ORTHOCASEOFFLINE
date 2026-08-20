import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { jsPDF } from 'jspdf';

/**
 * Sanitizes a filename to ensure compatibility across Android, iOS, and Web.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Converts a Blob to a base64 string (without the data URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Failed to convert Blob to base64'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a raw string to a base64 string.
 */
export function stringToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Saves or shares a jsPDF document on mobile devices (Android/iOS) or downloads it in web browsers.
 */
export async function savePdfDoc(doc: jsPDF, rawFilename: string): Promise<void> {
  const fileName = sanitizeFilename(
    rawFilename.toLowerCase().endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`
  );

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Extract Base64 string from jsPDF
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1] || '';

      // 2. Write file to device storage (Documents directory, fallback to Cache)
      let writeResult;
      try {
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        console.warn('Could not write to Documents directory, falling back to Cache:', docErr);
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });
      }

      const fileUri = writeResult.uri;

      // 3. Trigger native Android/iOS Share / Open dialog
      if (await Share.canShare()) {
        await Share.share({
          title: fileName,
          text: `Orthodontic Clinical Presentation: ${fileName}`,
          url: fileUri,
          dialogTitle: 'Download / View / Share PDF',
        });
      }
      return;
    } catch (nativeErr) {
      console.error('Native PDF save/share failed, attempting web fallback:', nativeErr);
    }
  }

  // Web Browser fallback
  doc.save(fileName);
}

/**
 * Saves a Blob (e.g. SVG, Zip archive, Encrypted vault) to phone storage or triggers browser download.
 */
export async function saveBlobFile(
  blob: Blob,
  rawFilename: string,
  _mimeType: string = 'application/octet-stream'
): Promise<boolean> {
  const fileName = sanitizeFilename(rawFilename);

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);

      let writeResult;
      try {
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        console.warn('Could not write blob to Documents directory, falling back to Cache:', docErr);
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });
      }

      const fileUri = writeResult.uri;

      if (await Share.canShare()) {
        await Share.share({
          title: fileName,
          url: fileUri,
          dialogTitle: 'Save / Share File',
        });
      }
      return true;
    } catch (nativeErr) {
      console.error('Native blob save/share failed, falling back to browser download:', nativeErr);
    }
  }

  // Web / Browser mode
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return false;
      }
      console.warn('showSaveFilePicker failed, falling back to anchor download:', err);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);

  return true;
}

/**
 * Saves a text/string payload (e.g. SVG or JSON) to device or browser.
 */
export async function saveTextFile(
  content: string,
  rawFilename: string,
  mimeType: string = 'text/plain'
): Promise<boolean> {
  const fileName = sanitizeFilename(rawFilename);

  if (Capacitor.isNativePlatform()) {
    try {
      let writeResult;
      try {
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: content,
          encoding: Encoding.UTF8,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        console.warn('Could not write text to Documents directory, falling back to Cache:', docErr);
        writeResult = await Filesystem.writeFile({
          path: fileName,
          data: content,
          encoding: Encoding.UTF8,
          directory: Directory.Cache,
          recursive: true,
        });
      }

      const fileUri = writeResult.uri;

      if (await Share.canShare()) {
        await Share.share({
          title: fileName,
          url: fileUri,
          dialogTitle: 'Save / Share File',
        });
      }
      return true;
    } catch (nativeErr) {
      console.error('Native text file save failed, falling back to Blob:', nativeErr);
    }
  }

  const blob = new Blob([content], { type: mimeType });
  return saveBlobFile(blob, fileName, mimeType);
}
