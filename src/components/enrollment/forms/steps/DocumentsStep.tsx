import React, { useState } from 'react';
import type { EnrollmentApplication, DocumentUpload } from '../../../../../types';
import { 
  uploadEnrollmentDocument, 
  validateDocumentFile, 
  getDocumentDisplayName,
  formatFileSize 
} from '../../../../services/enrollmentDocumentService';

interface DocumentsStepProps {
  data: Partial<EnrollmentApplication>;
  updateData: (updates: Partial<EnrollmentApplication>) => void;
  errors: Record<string, string>;
}

type DocumentType = 'birthCertificate' | 'form137' | 'goodMoral' | 'reportCard' | 'photoId';

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

export const DocumentsStep = React.memo<DocumentsStepProps>(({ data, updateData }) => {
  const [uploadStates, setUploadStates] = useState<Record<DocumentType, UploadState>>({
    birthCertificate: { uploading: false, progress: 0, error: null },
    form137: { uploading: false, progress: 0, error: null },
    goodMoral: { uploading: false, progress: 0, error: null },
    reportCard: { uploading: false, progress: 0, error: null },
    photoId: { uploading: false, progress: 0, error: null }
  });

  // Generate temp application ID for draft uploads (will use real ID after submission)
  const applicationId = data.id || `draft-${Date.now()}`;

  const handleFileSelect = async (documentType: DocumentType, file: File | null) => {
    if (!file) return;

    // Validate file
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setUploadStates(prev => ({
        ...prev,
        [documentType]: { uploading: false, progress: 0, error: validationError }
      }));
      return;
    }

    // Start upload
    setUploadStates(prev => ({
      ...prev,
      [documentType]: { uploading: true, progress: 50, error: null }
    }));

    try {
      const documentUpload: DocumentUpload = await uploadEnrollmentDocument(
        applicationId,
        documentType,
        file
      );

      // Update application data
      updateData({
        documents: {
          ...data.documents,
          [documentType]: documentUpload
        }
      });

      setUploadStates(prev => ({
        ...prev,
        [documentType]: { uploading: false, progress: 100, error: null }
      }));

      console.log(`[DocumentsStep] ✅ Uploaded ${documentType}`);
    } catch (error) {
      console.error(`[DocumentsStep] ❌ Upload failed:`, error);
      setUploadStates(prev => ({
        ...prev,
        [documentType]: { 
          uploading: false, 
          progress: 0, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        }
      }));
    }
  };

  const handleRemoveDocument = (documentType: DocumentType) => {
    updateData({
      documents: {
        ...data.documents,
        [documentType]: undefined
      }
    });
    
    setUploadStates(prev => ({
      ...prev,
      [documentType]: { uploading: false, progress: 0, error: null }
    }));
  };

  const renderDocumentUpload = (documentType: DocumentType, required: boolean = false) => {
    const document = data.documents?.[documentType];
    const state = uploadStates[documentType];
    const displayName = getDocumentDisplayName(documentType);

    return (
      <div key={documentType} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {displayName}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
          </div>
        </div>

        {document ? (
          // Uploaded document
          <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-medium text-green-800">{document.fileName}</p>
                  <p className="text-xs text-green-600">{formatFileSize(document.fileSize)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={document.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(documentType)}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : state.uploading ? (
          // Uploading state
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 mt-2">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-blue-600">Uploading... {state.progress}%</p>
            </div>
          </div>
        ) : (
          // Upload button
          <div className="mt-2">
            <label
              htmlFor={`upload-${documentType}`}
              className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2 block">📄</span>
              <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
              <input
                id={`upload-${documentType}`}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleFileSelect(documentType, e.target.files?.[0] || null)}
              />
            </label>
            {state.error && (
              <p className="text-xs text-red-600 mt-2">❌ {state.error}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          📄 <strong>Upload Required Documents:</strong> Please upload clear, readable copies of the following documents. 
          All files must be under 10MB and in PDF, JPG, or PNG format.
        </p>
      </div>

      <div className="space-y-4">
        {renderDocumentUpload('birthCertificate', true)}
        {renderDocumentUpload('form137', true)}
        {renderDocumentUpload('goodMoral', false)}
        {renderDocumentUpload('reportCard', false)}
        {renderDocumentUpload('photoId', false)}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Documents marked with <span className="text-red-500">*</span> are required. 
          You can upload documents now or submit them later. However, your application will not be processed 
          until all required documents are received.
        </p>
      </div>
    </div>
  );
});
