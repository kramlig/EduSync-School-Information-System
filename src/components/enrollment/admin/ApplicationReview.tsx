import React, { useState, useEffect } from 'react';
import { DocumentViewer } from './DocumentViewer';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '../../../services/firestoreService';
import { auth } from '../../../services/firestoreService';
import { useSchoolContext } from '../../../contexts/SchoolContext';
import type { EnrollmentApplication, Student } from '../../../../types';

/**
 * ApplicationReview - Detailed view for reviewing a single enrollment application
 * 
 * Features:
 * - View all application details
 * - Approve or reject application
 * - Add review notes
 * - Auto-create student record on approval
 */
const ApplicationReview: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext(); // Get current school
  const [application, setApplication] = useState<EnrollmentApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!applicationId) {
      navigate('/admin/enrollment');
      return;
    }

    const loadApplication = async () => {
      try {
        const db = getFirestoreInstance();
        const appDoc = await getDoc(doc(db, 'enrollmentApplications', applicationId));
        
        if (appDoc.exists()) {
          setApplication({ id: appDoc.id, ...appDoc.data() } as EnrollmentApplication);
        } else {
          alert('Application not found');
          navigate('/admin/enrollment');
        }
      } catch (error) {
        console.error('[ApplicationReview] Error loading application:', error);
        alert('Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId, navigate]);

  const handleApprove = async () => {
    if (!application || !applicationId) return;

    if (!confirm('Are you sure you want to APPROVE this application? This will create a student record.')) {
      return;
    }

    setIsProcessing(true);

    try {
      const db = getFirestoreInstance();
      const currentUser = auth.currentUser;

      // Create student record from application data
      const { studentInfo, guardian1, guardian2, currentAddress, academicInfo, healthInfo } = application;
      
      // Construct full name from parts
      const fullName = [studentInfo.firstName, studentInfo.middleName, studentInfo.lastName]
        .filter(Boolean)
        .join(' ');

      // Transfer enrollment photo to student profile photo
      const photoDocument = application.documents?.photoId;
      if (photoDocument?.fileURL) {
        console.log('[ApplicationReview] 📸 Transferring photo from enrollment to student profile:', photoDocument.fileURL);
      } else {
        console.log('[ApplicationReview] ⚠️ No photo uploaded in enrollment application');
      }
      
      // Build student object with only defined values (Firestore doesn't accept undefined)
      const newStudent: Partial<Student> = {
        schoolId: application.schoolId || schoolId || 'default', // Inherit from application or use current school
        name: fullName,
        firstName: studentInfo.firstName,
        middleName: studentInfo.middleName || '',
        lastName: studentInfo.lastName,
        sex: studentInfo.sex,
        dateOfBirth: studentInfo.dateOfBirth,
        lrn: studentInfo.lrn || '',
        ...(studentInfo.nationality && { nationality: studentInfo.nationality }),
        ...(studentInfo.religion && { religion: studentInfo.religion }),
        ...(studentInfo.motherTongue && { motherTongue: studentInfo.motherTongue }),
        ...(studentInfo.placeOfBirth && { placeOfBirth: studentInfo.placeOfBirth }),
        // Transfer photo from enrollment application if available
        ...(photoDocument?.fileURL && { photoURL: photoDocument.fileURL }),
        ...(photoDocument?.uploadedAt && { photoUploadedAt: photoDocument.uploadedAt }),
        // Section will be assigned by admin after approval
        sectionId: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        email: `${studentInfo.firstName.toLowerCase()}.${studentInfo.lastName.toLowerCase()}@student.local`,
        // Primary guardian information
        guardianName: guardian1.fullName,
        guardianRelationship: guardian1.relationship,
        guardianContactNumber: guardian1.contactNumber,
        ...(guardian1.email && { guardianEmail: guardian1.email }),
        ...(guardian1.occupation && { guardianOccupation: guardian1.occupation }),
        // Secondary guardian (only if provided)
        ...(guardian2?.fullName && { guardian2Name: guardian2.fullName }),
        ...(guardian2?.relationship && { guardian2Relationship: guardian2.relationship }),
        ...(guardian2?.contactNumber && { guardian2ContactNumber: guardian2.contactNumber }),
        ...(guardian2?.email && { guardian2Email: guardian2.email }),
        // Address information
        address: `${currentAddress.barangay}, ${currentAddress.city}, ${currentAddress.province}`,
        barangay: currentAddress.barangay,
        city: currentAddress.city,
        province: currentAddress.province,
        ...(currentAddress.zipCode && { zipCode: currentAddress.zipCode }),
        // Previous school information (optional)
        ...(academicInfo.previousSchool && { previousSchool: academicInfo.previousSchool }),
        ...(academicInfo.yearLastAttended && { yearLastAttended: academicInfo.yearLastAttended }),
        // Health information (if provided)
        ...(healthInfo?.bloodType && { bloodType: healthInfo.bloodType }),
        // Status
        status: 'active',
        // Store the desired grade level in remarks for now until section is assigned
        remarks: `Applied for Grade ${academicInfo.gradeLevel}. Application #${application.applicationNumber}`
      };

      // Build health notes if any health info exists
      const healthNotesParts = [
        healthInfo?.allergies && `Allergies: ${healthInfo.allergies}`,
        healthInfo?.medicalConditions && `Medical Conditions: ${healthInfo.medicalConditions}`,
        healthInfo?.medications && `Medications: ${healthInfo.medications}`
      ].filter(Boolean);
      
      if (healthNotesParts.length > 0) {
        newStudent.healthNotes = healthNotesParts.join('; ');
      }

      const studentRef = await addDoc(collection(db, 'students'), newStudent);
      console.log('[ApplicationReview] ✅ Student created:', studentRef.id);

      // Update application status
      await updateDoc(doc(db, 'enrollmentApplications', applicationId), {
        status: 'approved',
        reviewedBy: currentUser?.email || 'admin',
        reviewedAt: new Date().toISOString(),
        reviewNotes,
        enrolledStudentId: studentRef.id,
        updatedAt: serverTimestamp()
      });

      alert('✅ Application approved! Student record created successfully.');
      navigate('/admin/enrollment');
    } catch (error) {
      console.error('[ApplicationReview] ❌ Error approving application:', error);
      alert('Failed to approve application. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application || !applicationId) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm('Are you sure you want to REJECT this application?')) {
      return;
    }

    setIsProcessing(true);

    try {
      const db = getFirestoreInstance();
      const currentUser = auth.currentUser;

      await updateDoc(doc(db, 'enrollmentApplications', applicationId), {
        status: 'rejected',
        reviewedBy: currentUser?.email || 'admin',
        reviewedAt: new Date().toISOString(),
        rejectionReason,
        reviewNotes,
        updatedAt: serverTimestamp()
      });

      alert('❌ Application rejected.');
      navigate('/admin/enrollment');
    } catch (error) {
      console.error('[ApplicationReview] ❌ Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!applicationId) return;

    try {
      const db = getFirestoreInstance();
      await updateDoc(doc(db, 'enrollmentApplications', applicationId), {
        status: 'under_review',
        updatedAt: serverTimestamp()
      });
      
      setApplication(prev => prev ? { ...prev, status: 'under_review' } : null);
      alert('✓ Application marked as under review');
    } catch (error) {
      console.error('[ApplicationReview] Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      submitted: 'text-blue-600',
      under_review: 'text-yellow-600',
      approved: 'text-green-600',
      rejected: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/enrollment')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Applications
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application Review
              </h1>
              <p className="text-gray-600">
                Application #{application.applicationNumber || application.id.slice(0, 8)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getStatusColor(application.status)}`}>
                {application.status.replace('_', ' ').toUpperCase()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Submitted: {new Date(application.submittedAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Student Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Full Name</p>
              <p className="text-lg">{application.studentInfo.firstName} {application.studentInfo.middleName} {application.studentInfo.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Date of Birth</p>
              <p className="text-lg">{application.studentInfo.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Sex</p>
              <p className="text-lg">{application.studentInfo.sex}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Nationality</p>
              <p className="text-lg">{application.studentInfo.nationality}</p>
            </div>
            {application.studentInfo.lrn && (
              <div>
                <p className="text-sm font-semibold text-gray-600">LRN</p>
                <p className="text-lg">{application.studentInfo.lrn}</p>
              </div>
            )}
            {application.studentInfo.placeOfBirth && (
              <div>
                <p className="text-sm font-semibold text-gray-600">Place of Birth</p>
                <p className="text-lg">{application.studentInfo.placeOfBirth}</p>
              </div>
            )}
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍👩‍👧 Guardian Information</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900">Primary Guardian</p>
              <p className="text-gray-700">{application.guardian1.fullName} ({application.guardian1.relationship})</p>
              <p className="text-gray-600">📞 {application.guardian1.contactNumber}</p>
              {application.guardian1.email && <p className="text-gray-600">📧 {application.guardian1.email}</p>}
              {application.guardian1.occupation && <p className="text-gray-600">💼 {application.guardian1.occupation}</p>}
            </div>
            {application.guardian2 && application.guardian2.fullName && (
              <div className="border-t pt-4">
                <p className="font-semibold text-gray-900">Secondary Guardian</p>
                <p className="text-gray-700">{application.guardian2.fullName} ({application.guardian2.relationship})</p>
                <p className="text-gray-600">📞 {application.guardian2.contactNumber}</p>
                {application.guardian2.email && <p className="text-gray-600">📧 {application.guardian2.email}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Address</h2>
          <p className="text-gray-700">
            {application.currentAddress.street && `${application.currentAddress.street}, `}
            {application.currentAddress.barangay}, {application.currentAddress.city}, {application.currentAddress.province}
            {application.currentAddress.zipCode && ` ${application.currentAddress.zipCode}`}
          </p>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📚 Academic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Grade Level to Enroll</p>
              <p className="text-lg">Grade {application.academicInfo.gradeLevel}</p>
            </div>
            {application.academicInfo.previousSchool && (
              <div>
                <p className="text-sm font-semibold text-gray-600">Previous School</p>
                <p className="text-lg">{application.academicInfo.previousSchool}</p>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Uploaded Documents</h2>
          <DocumentViewer documents={application.documents} />
        </div>

        {/* Review Actions */}
        {application.status !== 'approved' && application.status !== 'rejected' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✍️ Review Actions</h2>
            
            {application.status === 'submitted' && (
              <button
                onClick={handleMarkUnderReview}
                className="mb-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Mark as Under Review
              </button>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any notes about this application..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rejection Reason (Required if rejecting)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Provide a reason if rejecting this application..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className={`flex-1 py-3 rounded-lg font-semibold text-white ${
                  isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isProcessing ? 'Processing...' : '✓ Approve & Create Student'}
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className={`flex-1 py-3 rounded-lg font-semibold text-white ${
                  isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? 'Processing...' : '✗ Reject Application'}
              </button>
            </div>
          </div>
        )}

        {/* Review History */}
        {(application.reviewedAt || application.reviewedBy) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Review History</h2>
            <div className="space-y-2 text-sm">
              {application.reviewedBy && <p><strong>Reviewed by:</strong> {application.reviewedBy}</p>}
              {application.reviewedAt && <p><strong>Reviewed at:</strong> {new Date(application.reviewedAt).toLocaleString()}</p>}
              {application.reviewNotes && <p><strong>Notes:</strong> {application.reviewNotes}</p>}
              {application.rejectionReason && <p className="text-red-600"><strong>Rejection Reason:</strong> {application.rejectionReason}</p>}
              {application.enrolledStudentId && <p className="text-green-600"><strong>Student ID:</strong> {application.enrolledStudentId}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationReview;
