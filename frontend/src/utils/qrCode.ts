// KAARIGAR — Scannable Provenance QR Code Utility
// Generates offline high-contrast SVG / DataURL QR codes for physical artisan tags

import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate a PNG Data URL for a given string/URL
 */
export async function generateQRDataUrl(text: string, options?: QRCodeOptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 280,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#1A1A1A',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    return '';
  }
}

/**
 * Generate raw SVG string for crisp vector printing on physical tags
 */
export async function generateQRSvg(text: string, options?: QRCodeOptions): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 280,
      margin: options?.margin ?? 2,
      color: {
        dark: options?.color?.dark || '#1A1A1A',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
    return '';
  }
}

/**
 * Returns the canonical provenance story URL for a craft accession number
 */
export function getProvenanceUrl(accessionNo: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kaarigar.in';
  return `${origin}/gallery?accession=${encodeURIComponent(accessionNo)}#provenance`;
}
