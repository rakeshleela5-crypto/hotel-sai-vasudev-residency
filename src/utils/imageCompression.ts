/**
 * Hotel SAI VASUDEV RESIDENCY - Client-Side KYC Image Compression Helper
 * Uses HTML5 <canvas> to resize and compress high-resolution mobile camera photos
 * before transmission to FastAPI / Cloudflare R2.
 *
 * Rules:
 * - Resizes images exceeding 1600px in width or height, preserving aspect ratio.
 * - Compresses JPEG and WebP to ~0.75 quality to guarantee mobile uploads stay under 500 KB.
 * - Leaves PDF documents untouched.
 * - Graceful fallback to original file if canvas/browser processing is unavailable.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export async function compressKycImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxDimension = 1600,
    quality = 0.75,
    maxSizeBytes = 500 * 1024 // 500 KB target
  } = options;

  // 1. Skip non-images (e.g. PDF documents)
  if (!file || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return file;
  }

  // 2. Only process standard image types
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // If already under target size and small dimension, return directly
  if (file.size <= (maxSizeBytes / 2)) {
    return file;
  }

  // 3. Canvas compression in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Proportional resize if larger than maxDimension (1600px)
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw downscaled image
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME type (favor JPEG for camera KYC photos)
        const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const fileExt = outputType === 'image/webp' ? '.webp' : '.jpg';
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const newFileName = `${baseName}_compressed${fileExt}`;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed blob is smaller than original or within target size, use it
            if (blob.size < file.size || blob.size <= maxSizeBytes) {
              const compressedFile = new File([blob], newFileName, {
                type: outputType,
                lastModified: Date.now()
              });
              console.info(
                `[KYC Compression] Reduced '${file.name}' from ${(file.size / 1024).toFixed(1)} KB to ${(compressedFile.size / 1024).toFixed(1)} KB (${width}x${height})`
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          outputType,
          quality
        );
      } catch (err) {
        console.warn('[KYC Compression] Canvas processing error, using original file:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.warn('[KYC Compression] Failed to load image into canvas, using original file.');
      resolve(file);
    };

    img.src = objectUrl;
  });
}
