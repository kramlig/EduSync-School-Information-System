import React from 'react';
import type { DocumentUpload } from '../../../../types';
import { getDocumentDisplayName, formatFileSize } from '../../../services/enrollmentDocumentService';

interface DocumentViewerProps {
  documents?: {
    birthCertificate?: DocumentUpload;
    form137?: DocumentUpload;
    goodMoral?: DocumentUpload;
    reportCard?: DocumentUpload;
    photoId?: DocumentUpload;
    other?: DocumentUpload[];
  };
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents }) => {
  if (!documents) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  const documentTypes: Array<keyof typeof documents> = [
    'birthCertificate',
    'form137',
    'goodMoral',
    'reportCard',
    'photoId'
  ];

  const uploadedDocs = documentTypes.filter(type => documents[type]);
  const hasDocuments = uploadedDocs.length > 0 || (documents.other && documents.other.length > 0);

  if (!hasDocuments) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">⚠️ No documents have been uploaded for this application</p>
      </div>
    );
  }

  const renderDocument = (doc: DocumentUpload, displayName: string) => {
    const isPDF = doc.mimeType === 'application/pdf';
    const isImage = doc.mimeType.startsWith('image/');

    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">{displayName}</h4>
            <p className="text-xs text-gray-500 mt-1">{doc.fileName}</p>
            <p className="text-xs text-gray-400 mt-1">
              {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={doc.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            >
              View
            </a>
            <a
              href={doc.fileURL}
              download={doc.fileName}
              className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
            >
              Download
            </a>
          </div>
        </div>

        {/* Preview for images */}
        {isImage && (
          <div className="mt-3">
            <img
              src={doc.fileURL}
              alt={displayName}
              className="w-full h-48 object-cover rounded border border-gray-200"
            />
          </div>
        )}

        {/* PDF indicator */}
        {isPDF && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 flex items-center justify-center">
            <span className="text-4xl">📄</span>
            <span className="ml-2 text-sm text-red-800">PDF Document</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-green-800">
          ✅ <strong>{uploadedDocs.length} document(s)</strong> uploaded
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map(type => {
          const doc = documents[type];
          if (!doc || Array.isArray(doc)) return null;
          return (
            <div key={type}>
              {renderDocument(doc, getDocumentDisplayName(type as string))}
            </div>
          );
        })}

        {documents.other?.map((doc, index) => (
          <div key={`other-${index}`}>
            {renderDocument(doc, `Other Document ${index + 1}`)}
          </div>
        ))}
      </div>
    </div>
  );
};
