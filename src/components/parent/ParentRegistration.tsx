/**
 * ParentRegistration - Public-facing parent registration form
 * 
 * Allows parents to self-register by verifying their child's LRN and birthdate.
 * Sends email verification after successful registration.
 * No login required to access this page.
 * 
 * MULTI-TENANT NOTE:
 * This is a PUBLIC page. Parents don't know their schoolId when registering.
 * Solution: After verifying student by LRN, use the student's schoolId for the parent.
 * The student document already has schoolId, so we inherit it.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestoreInstance } from '../../services/firestoreService';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import { createParentWithRole } from '../../services/userManagement';
import type { Student } from '../../types';

interface RegistrationForm {
  // Parent Information
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  password: string;
  confirmPassword: string;
  
  // Student Verification
  studentLRN: string;
  studentBirthdate: string;
  
  // Terms
  acceptTerms: boolean;
}

const ParentRegistration: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegistrationForm>({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    password: '',
    confirmPassword: '',
    studentLRN: '',
    studentBirthdate: '',
    acceptTerms: false,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name as keyof RegistrationForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegistrationForm, string>> = {};
    
    // Parent name
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent name is required';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.parentEmail.trim()) {
      newErrors.parentEmail = 'Email is required';
    } else if (!emailRegex.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Invalid email format';
    }
    
    // Phone validation (Philippine format)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.parentPhone.replace(/[-\s]/g, ''))) {
      newErrors.parentPhone = 'Invalid phone number (use 09XXXXXXXXX or +639XXXXXXXXX)';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Student verification
    if (!verifiedStudent) {
      newErrors.studentLRN = 'Please verify student information first';
    }
    
    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Verify student by LRN and birthdate
  const handleVerifyStudent = async () => {
    if (!formData.studentLRN || !formData.studentBirthdate) {
      setErrors(prev => ({
        ...prev,
        studentLRN: !formData.studentLRN ? 'LRN is required' : undefined,
        studentBirthdate: !formData.studentBirthdate ? 'Birthdate is required' : undefined,
      }));
      return;
    }
    
    setIsVerifying(true);
    setErrors(prev => ({ ...prev, studentLRN: undefined, studentBirthdate: undefined }));
    
    try {
      // Query student by LRN
      const db = getFirestoreInstance();
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('lrn', '==', formData.studentLRN));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setErrors(prev => ({ ...prev, studentLRN: 'Student not found. Please check LRN.' }));
        setVerifiedStudent(null);
        return;
      }
      
      const studentDoc = snapshot.docs[0];
      const student = { id: studentDoc.id, ...studentDoc.data() } as Student;
      
      // Verify birthdate matches
      if (student.dateOfBirth !== formData.studentBirthdate) {
        setErrors(prev => ({ ...prev, studentBirthdate: 'Birthdate does not match our records' }));
        setVerifiedStudent(null);
        return;
      }
      
      // Check if student already has a parent linked
      if (student.parentIds && student.parentIds.length > 0) {
        // Allow multiple parents (mother, father, guardian)
        console.log('[ParentRegistration] Student already has parent(s), allowing additional parent');
      }
      
      // Verification successful
      setVerifiedStudent(student);
      alert(`✅ Student verified: ${student.name}\nYou can now complete your registration.`);
      
    } catch (error) {
      console.error('[ParentRegistration] Error verifying student:', error);
      setErrors(prev => ({ ...prev, studentLRN: 'Verification failed. Please try again.' }));
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if parent email already exists
      const db = getFirestoreInstance();
      const parentsRef = collection(db, 'parents');
      const emailQuery = query(parentsRef, where('email', '==', formData.parentEmail));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setErrors(prev => ({ ...prev, parentEmail: 'Email already registered' }));
        setIsSubmitting(false);
        return;
      }
      
      // Create parent user with proper role assignment
      const [firstName, ...lastNameParts] = formData.parentName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      const userResult = await createParentWithRole({
        email: formData.parentEmail,
        password: formData.password,
        role: 'parent',
        schoolId: verifiedStudent!.schoolId || 'default', // Inherit from student
        displayName: formData.parentName,
        studentIds: [verifiedStudent!.id],
        contactNumber: formData.parentPhone,
        additionalData: {
          firstName,
          lastName,
          emailVerified: false,
          registrationDate: new Date().toISOString()
        }
      });

      if (!userResult.success || !userResult.userCredential) {
        throw new Error(userResult.error || 'Failed to create parent account');
      }
      
      console.log('[ParentRegistration] Parent account created:', userResult.userId);
      
      // Send custom branded welcome email via SendGrid (instead of Firebase default)
      try {
        const welcomeEmailRef = collection(db, 'mail');
        
        // Queue welcome email through our SendGrid extension
        await addDoc(welcomeEmailRef, {
          to: formData.parentEmail,
          from: 'EduSync <official@edusync.ph>',
          replyTo: 'official@edusync.ph',
          message: {
            subject: '🎉 Welcome to EduSync Parent Portal!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to EduSync!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 18px; color: #1f2937;">Hello ${formData.parentName},</p>
                  
                  <p style="color: #4b5563; line-height: 1.6;">
                    Thank you for registering with EduSync Parent Portal! Your account has been successfully created.
                  </p>
                  
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1f2937;">📧 Your Account Details:</h3>
                    <p style="color: #4b5563; margin: 5px 0;"><strong>Email:</strong> ${formData.parentEmail}</p>
                    <p style="color: #4b5563; margin: 5px 0;"><strong>Linked Student:</strong> ${verifiedStudent!.name}</p>
                    <p style="color: #4b5563; margin: 5px 0;"><strong>LRN:</strong> ${verifiedStudent!.lrn}</p>
                  </div>
                  
                  <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;">
                      <strong>📱 Next Steps:</strong><br>
                      You can now log in to the parent portal to view your child's grades, attendance, and announcements.
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://edusync-sis.web.app/login?type=parent" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      🚀 Login to Parent Portal
                    </a>
                  </div>
                  
                  <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <strong>Need help?</strong><br>
                      Contact us at <a href="mailto:official@edusync.ph" style="color: #667eea;">official@edusync.ph</a>
                    </p>
                    
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                      <strong>EduSync School Information System</strong><br>
                      Built for Philippine Schools • 100% DepEd Compliant<br>
                      © ${new Date().getFullYear()} EduSync. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            `,
            text: `
Welcome to EduSync Parent Portal!

Hello ${formData.parentName},

Thank you for registering with EduSync! Your account has been successfully created.

Your Account Details:
- Email: ${formData.parentEmail}
- Linked Student: ${verifiedStudent!.name}
- LRN: ${verifiedStudent!.lrn}

Next Steps:
You can now log in to the parent portal to view your child's grades, attendance, and announcements.

Login here: https://edusync-sis.web.app/login?type=parent

Need help? Contact us at official@edusync.ph

---
EduSync School Information System
Built for Philippine Schools • 100% DepEd Compliant
© ${new Date().getFullYear()} EduSync. All rights reserved.
            `.trim()
          }
        });
        
        console.log('[ParentRegistration] Welcome email sent via SendGrid to', formData.parentEmail);
      } catch (emailError) {
        console.warn('[ParentRegistration] Welcome email failed (non-critical):', emailError);
        // Continue even if email fails
      }
      
      // Update student with parent link
      const studentRef = doc(db, 'students', verifiedStudent!.id);
      await updateDoc(studentRef, {
        parentIds: arrayUnion(userResult.userId)
      });
      
      console.log('[ParentRegistration] Student linked to parent');
      
      // Success
      setRegistrationSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?type=parent&email=' + encodeURIComponent(formData.parentEmail));
      }, 3000);
      
    } catch (error) {
      console.error('[ParentRegistration] Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            Registration Successful!
          </h2>
          
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Welcome to EduSync Parent Portal! Your account has been created successfully.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              📧 A verification email has been sent to <strong>{formData.parentEmail}</strong>. 
              Please verify your email before logging in.
            </p>
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Parent Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Create your parent portal account to view your child's academic progress
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Student Verification */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
              Verify Your Child
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Student LRN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentLRN"
                  value={formData.studentLRN}
                  onChange={handleChange}
                  placeholder="Enter 12-digit LRN"
                  maxLength={12}
                  className={`w-full px-4 py-2 rounded-lg border ${errors.studentLRN ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  disabled={!!verifiedStudent}
                />
                {errors.studentLRN && <p className="text-red-500 text-sm mt-1">{errors.studentLRN}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Student Birthdate <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="studentBirthdate"
                  value={formData.studentBirthdate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${errors.studentBirthdate ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  disabled={!!verifiedStudent}
                />
                {errors.studentBirthdate && <p className="text-red-500 text-sm mt-1">{errors.studentBirthdate}</p>}
              </div>
            </div>
            
            {!verifiedStudent ? (
              <button
                type="button"
                onClick={handleVerifyStudent}
                disabled={isVerifying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : '🔍 Verify Student'}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300">
                      ✅ Student Verified: {verifiedStudent.name}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      LRN: {verifiedStudent.lrn}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Step 2: Parent Information */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
              <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
              Your Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  placeholder="Juan Dela Cruz"
                  className={`w-full px-4 py-2 rounded-lg border ${errors.parentName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
                {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.parentEmail ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  {errors.parentEmail && <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.parentPhone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  {errors.parentPhone && <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Must include uppercase, lowercase, and number
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Terms and Conditions */}
          <div className="flex items-start">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-1 mr-3"
            />
            <label className="text-sm text-slate-600 dark:text-slate-300">
              I accept the <a href="/terms" className="text-blue-600 hover:underline" target="_blank">Terms and Conditions</a> and <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a> <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.acceptTerms && <p className="text-red-500 text-sm -mt-4">{errors.acceptTerms}</p>}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !verifiedStudent}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            {isSubmitting ? 'Creating Account...' : '✨ Create Parent Account'}
          </button>
          
          {/* Login Link */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account? <a href="/login?type=parent" className="text-blue-600 hover:underline font-semibold">Login here</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ParentRegistration;
