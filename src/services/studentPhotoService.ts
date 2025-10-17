import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firestoreService';
import imageCompression from 'browser-image-compression';

/**
 * Validates image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPG or PNG image.' };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB.' };
  }

  return { valid: true };
}

/**
 * Compresses image for optimized storage and faster loading
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Maximum size 1MB after compression
    maxWidthOrHeight: 800, // Max dimension
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    // If compression fails, return original file
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}

/**
 * Uploads student photo to Firebase Storage
 * @param studentId - The student's ID
 * @param file - The image file to upload
 * @returns Object with download URL and storage path
 */
export async function uploadStudentPhoto(
  studentId: string,
  file: File
): Promise<{ url: string; path: string }> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Compress image
  const compressedFile = await compressImage(file);

  // Create storage reference
  const storagePath = `students/${studentId}/profile.jpg`;
  const storageRef = ref(storage, storagePath);

  // Upload file
  await uploadBytes(storageRef, compressedFile, {
    contentType: compressedFile.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
      studentId: studentId,
    },
  });

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);

  return {
    url: downloadURL,
    path: storagePath,
  };
}

/**
 * Deletes student photo from Firebase Storage
 * @param photoPath - The storage path of the photo to delete
 */
export async function deleteStudentPhoto(photoPath: string): Promise<void> {
  if (!photoPath) {
    throw new Error('No photo path provided');
  }

  try {
    const storageRef = ref(storage, photoPath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If file doesn't exist, consider it already deleted
    if (error?.code === 'storage/object-not-found') {
      console.warn('Photo already deleted or does not exist:', photoPath);
      return;
    }
    throw error;
  }
}

/**
 * Generates a placeholder avatar URL based on student name
 * Uses UI Avatars service for consistent placeholder images
 */
export function getPlaceholderAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6366f1&color=fff&bold=true`;
}
