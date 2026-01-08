/**
 * Image Compression Utility
 * Automatically resizes images to max 2000px width while maintaining aspect ratio
 * Helps keep website fast while allowing high-quality images
 */

export interface CompressedImageResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * Compress and resize image to max 2000px width
 * Maintains aspect ratio and quality
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 2000,
  quality: number = 0.9
): Promise<CompressedImageResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new File with same name and type
            const compressedFile = new File(
              [blob],
              file.name,
              { type: file.type || 'image/jpeg' }
            );
            
            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              width,
              height,
            });
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image dimensions and size
 */
export const validateImage = async (
  file: File,
  maxWidth: number = 2000,
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB
): Promise<{ valid: boolean; error?: string; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (file.size > maxSizeBytes) {
      resolve({
        valid: false,
        error: `Image too large. Maximum size: ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB`,
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          valid: true,
          dimensions: {
            width: img.width,
            height: img.height,
          },
        });
      };
      img.onerror = () => {
        resolve({
          valid: false,
          error: 'Invalid image file',
        });
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'Failed to read image file',
      });
    };
    reader.readAsDataURL(file);
  });
};
