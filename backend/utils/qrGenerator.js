import QRCode from 'qrcode';

/**
 * Generates a base64 PNG Data URL for a given text (shortened URL)
 * @param {string} text The short URL text to encode in the QR code
 * @returns {Promise<string>} Base64 data URL
 */
export const generateQRCode = async (text) => {
  try {
    const options = {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#0f172a',  // Slate 900 (matches Vercel/Linear dark theme)
        light: '#ffffff', // White
      },
    };
    return await QRCode.toDataURL(text, options);
  } catch (err) {
    console.error('Failed to generate QR Code:', err.message);
    throw new Error('QR Code generation failed');
  }
};
