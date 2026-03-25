/**
 * Register Carlito font (open-source Calibri metric-compatible) with jsPDF.
 * Call `registerCalibriFont(doc)` once before using `doc.setFont('Calibri', ...)`.
 *
 * Carlito is licensed under the SIL Open Font License.
 */

import type jsPDF from 'jspdf';

// Vite will encode these as data URLs; we strip the prefix to get raw base64.
import carlitoRegularUrl from '../../assets/fonts/Carlito-Regular.ttf';
import carlitoBoldUrl from '../../assets/fonts/Carlito-Bold.ttf';

/** Fetch a URL (or data-url) and return its base64 string. */
async function urlToBase64(url: string): Promise<string> {
  // If Vite already inlined as data URL
  if (url.startsWith('data:')) {
    return url.split(',')[1];
  }
  // Otherwise fetch the asset
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let _cachedRegular: string | null = null;
let _cachedBold: string | null = null;

/**
 * Register "Calibri" (Carlito) normal + bold with a jsPDF document.
 * Safe to call multiple times; caches the base64 data.
 */
export async function registerCalibriFont(doc: jsPDF): Promise<void> {
  if (!_cachedRegular) _cachedRegular = await urlToBase64(carlitoRegularUrl);
  if (!_cachedBold) _cachedBold = await urlToBase64(carlitoBoldUrl);

  const vfs = (doc as any).internal?.events?.subscribe
    ? doc
    : doc;

  // Add to virtual file system
  (vfs as any).addFileToVFS('Carlito-Regular.ttf', _cachedRegular);
  (vfs as any).addFileToVFS('Carlito-Bold.ttf', _cachedBold);

  // Register as "Calibri"
  doc.addFont('Carlito-Regular.ttf', 'Calibri', 'normal');
  doc.addFont('Carlito-Bold.ttf', 'Calibri', 'bold');
}
