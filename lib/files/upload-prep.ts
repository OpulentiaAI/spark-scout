export interface ImageUploadLimits {
  maxBytes: number;
  maxDimension: number;
}

export interface ProcessedFileResult {
  processedImages: File[];
  pdfFiles: File[];
  stillOversized: File[];
  unsupportedFiles: File[];
}

export async function processFilesForUpload(
  files: File[],
  limits: ImageUploadLimits,
): Promise<ProcessedFileResult> {
  const processedImages: File[] = [];
  const pdfFiles: File[] = [];
  const stillOversized: File[] = [];
  const unsupportedFiles: File[] = [];

  for (const file of files) {
    // Check file type
    if (file.type.startsWith('image/')) {
      // Process image
      try {
        const processedImage = await processImageFile(file, limits);
        if (processedImage) {
          processedImages.push(processedImage);
        } else {
          stillOversized.push(file);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        unsupportedFiles.push(file);
      }
    } else if (file.type === 'application/pdf') {
      // PDF files are accepted as-is
      pdfFiles.push(file);
    } else {
      // Unsupported file type
      unsupportedFiles.push(file);
    }
  }

  return {
    processedImages,
    pdfFiles,
    stillOversized,
    unsupportedFiles,
  };
}

async function processImageFile(
  file: File,
  limits: ImageUploadLimits,
): Promise<File | null> {
  // Check if file is already within limits
  if (file.size <= limits.maxBytes) {
    return file;
  }

  // For now, if file is too large, return null (will be added to stillOversized)
  // In a real implementation, you would compress/resize the image here
  return null;
}
