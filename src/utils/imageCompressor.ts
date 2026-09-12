/**
 * Utility to compress and resize images client-side before storing or syncing to Firestore.
 * Firestore has a hard limit of 1,048,576 bytes (1 MiB) per document.
 * These utilities ensure any uploaded photo is resized and compressed to a lightweight,
 * high-quality format (typically 30 KB - 80 KB).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeBytes?: number; // target max bytes, e.g. 200 * 1024
}

/**
 * Resizes and compresses a File object to an optimized JPEG or WEBP data URL.
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeBytes = 250 * 1024, // 250 KB safe limit
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      compressBase64Image(dataUrl, { maxWidth, maxHeight, quality, maxSizeBytes })
        .then(resolve)
        .catch(reject);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes and compresses an existing base64 / data URL string.
 */
export async function compressBase64Image(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  // If not a data URL or already very small, return as is
  if (!dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeBytes = 250 * 1024,
  } = options;

  // If already under 100 KB, no need to compress
  if (dataUrl.length < 130 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate proportional dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw and compress
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let compressed = canvas.toDataURL('image/jpeg', currentQuality);

        // If still exceeds maxSizeBytes, step down quality
        let attempts = 0;
        while (compressed.length > maxSizeBytes * 1.37 && currentQuality > 0.4 && attempts < 4) {
          currentQuality -= 0.15;
          compressed = canvas.toDataURL('image/jpeg', currentQuality);
          attempts++;
        }

        resolve(compressed);
      } catch (err) {
        console.warn('Falha ao comprimir imagem via canvas:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
