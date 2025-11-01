import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firestoreService';
import type { DocumentUpload } from '../../types';

/**
 * Enrollment Document Upload Service
 * 
 * Handles uploading and managing enrollment application documents to Firebase Storage.
 * Documents are organized by application ID: /enrollment-documents/{applicationId}/{documentType}.{ext}
 */

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

/**
 * Validates file before upload
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateDocumentFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: PDF, JPG, PNG. Got: ${file.type}`;
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }

  return null;
}

/**
 * Uploads enrollment document to Firebase Storage
 * @param applicationId - The enrollment application ID
 * @param documentType - Type of document (e.g., 'birthCertificate', 'form137')
 * @param file - The file to upload
 * @returns DocumentUpload object with download URL and metadata
 */
export async function uploadEnrollmentDocument(
  applicationId: string,
  documentType: string,
  file: File
): Promise<DocumentUpload> {
  // Validate file
  const validationError = validateDocumentFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    
    // Create storage path: enrollment-documents/{applicationId}/{documentType}.{ext}
    const storagePath = `enrollment-documents/${applicationId}/${documentType}.${extension}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        applicationId,
        documentType,
        originalFileName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log(`[EnrollmentDocumentService] ✅ Uploaded ${documentType} for application ${applicationId}`);

    return {
      fileName: file.name,
      fileURL: downloadURL,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      mimeType: file.type
    };
  } catch (error) {
    console.error('[EnrollmentDocumentService] ❌ Upload error:', error);
    throw new Error(`Failed to upload ${documentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes enrollment document from Firebase Storage
 * @param applicationId - The enrollment application ID
 * @param documentType - Type of document to delete
 * @param extension - File extension (default: 'pdf')
 */
export async function deleteEnrollmentDocument(
  applicationId: string,
  documentType: string,
  extension: string = 'pdf'
): Promise<void> {
  try {
    const storagePath = `enrollment-documents/${applicationId}/${documentType}.${extension}`;
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log(`[EnrollmentDocumentService] ✅ Deleted ${documentType} for application ${applicationId}`);
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      console.warn(`[EnrollmentDocumentService] ⚠️ Document not found, skipping deletion: ${documentType}`);
      return;
    }
    console.error('[EnrollmentDocumentService] ❌ Delete error:', error);
    throw error;
  }
}

/**
 * Deletes all documents for an application
 * @param applicationId - The enrollment application ID
 */
export async function deleteAllApplicationDocuments(applicationId: string): Promise<void> {
  const documentTypes = ['birthCertificate', 'form137', 'goodMoral', 'reportCard', 'photoId'];
  const extensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

  const deletePromises: Promise<void>[] = [];

  for (const docType of documentTypes) {
    for (const ext of extensions) {
      deletePromises.push(
        deleteEnrollmentDocument(applicationId, docType, ext).catch(() => {
          // Silently ignore errors (file might not exist)
        })
      );
    }
  }

  await Promise.all(deletePromises);
  console.log(`[EnrollmentDocumentService] ✅ Cleaned up all documents for application ${applicationId}`);
}

/**
 * Gets human-readable document type name
 * @param documentType - Internal document type key
 * @returns Display name
 */
export function getDocumentDisplayName(documentType: string): string {
  const names: Record<string, string> = {
    birthCertificate: 'Birth Certificate (PSA)',
    form137: 'Form 137 / Report Card',
    goodMoral: 'Certificate of Good Moral',
    reportCard: 'Latest Report Card',
    photoId: 'Student Photo / ID'
  };
  return names[documentType] || documentType;
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
