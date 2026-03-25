/**
 * TrialSignupModal - School Trial Signup Form
 * 
 * Professional modal for capturing school administrator information
 * when they click "Start Free Trial" on the landing page.
 * 
 * Features:
 * - Form validation
 * - Loading states
 * - Success confirmation
 * - Firebase Functions integration
 * - Responsive design
 */

import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface TrialSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  schoolName: string;
  adminName: string;
  email: string;
  phone: string;
  studentCount: string;
  message: string;
}

interface FormErrors {
  schoolName?: string;
  adminName?: string;
  email?: string;
  phone?: string;
  studentCount?: string;
}

export const TrialSignupModal: React.FC<TrialSignupModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    schoolName: '',
    adminName: '',
    email: '',
    phone: '',
    studentCount: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Your name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.studentCount) {
      newErrors.studentCount = 'Please select student count';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Call Firebase Function to process trial signup
      const response = await fetch(
        'https://us-central1-edusync-sis.cloudfunctions.net/processTrialSignup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit trial request');
      }

      // Success!
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting trial signup:', error);
      alert('Failed to submit request. Please try again or contact edusyncph@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Reset form and close
  const handleClose = () => {
    setFormData({
      schoolName: '',
      adminName: '',
      email: '',
      phone: '',
      studentCount: '',
      message: ''
    });
    setErrors({});
    setSubmitSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Success State */}
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Trial Request Received!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Thank you for your interest in EduSync! We've received your trial request
                and will contact you within 24 hours to set up your demo school account.
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium">
                  📧 Check your email ({formData.email}) for next steps
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Start Your Free 30-Day Trial
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Fill out the form below and we'll set up your demo school account with sample data.
                  No credit card required.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* School Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.schoolName
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="e.g., San Pedro Elementary School"
                  />
                  {errors.schoolName && (
                    <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
                  )}
                </div>

                {/* Admin Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.adminName
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="e.g., Maria Santos"
                  />
                  {errors.adminName && (
                    <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                        errors.email
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="maria@school.edu.ph"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                        errors.phone
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="0917-123-4567"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Student Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Approximate Number of Students <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="studentCount"
                    value={formData.studentCount}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                      errors.studentCount
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <option value="">Select range...</option>
                    <option value="1-200">1-200 students (Micro)</option>
                    <option value="201-500">201-500 students (Small - Starter Plan)</option>
                    <option value="501-1000">501-1,000 students (Medium)</option>
                    <option value="1001-1500">1,001-1,500 students (Large - Professional Plan)</option>
                    <option value="1501+">1,501+ students (Enterprise)</option>
                  </select>
                  {errors.studentCount && (
                    <p className="text-red-500 text-sm mt-1">{errors.studentCount}</p>
                  )}
                </div>

                {/* Message (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Tell us about your school's specific needs or questions..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Start My Free Trial →'
                    )}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
                    By submitting, you agree to our Terms of Service and Privacy Policy.
                    No credit card required.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
