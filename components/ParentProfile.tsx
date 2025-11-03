/**
 * ParentProfile - Profile management for parent users
 * 
 * Allows parents to view and update their profile information:
 * - Name, email, phone
 * - Password change
 * - View linked children
 * - Notification preferences
 */

import React, { useState, useMemo } from 'react';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import type { ParentUser } from '../types';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { UserCircleIcon, BellIcon, AcademicCapIcon } from './icons';

interface ParentProfileProps {
  schoolData: SchoolDataHook;
  session: { user: ParentUser, type: 'parent' };
  onSessionUpdate?: (updatedUser: ParentUser) => void;
}

const ParentProfile: React.FC<ParentProfileProps> = ({ schoolData, session, onSessionUpdate }) => {
  const { students, updateParent } = schoolData;
  const parent = session.user;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: parent.name,
    email: parent.email,
    phone: parent.phone || '',
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState(parent.notificationPreferences || {
    emailEnabled: true,
    smsEnabled: true,
    absenceAlerts: true,
    gradeAlerts: true,
    announcementAlerts: true,
  });
  
  // Get linked children
  const linkedChildren = useMemo(() => {
    return students.filter(s => parent.studentIds.includes(s.id));
  }, [students, parent.studentIds]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle notification preference changes
  const handleNotificationChange = (key: string) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Validate phone number (Philippine format)
      if (formData.phone) {
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(formData.phone.replace(/[-\s]/g, ''))) {
          setErrorMessage('Invalid phone number format (use 09XXXXXXXXX)');
          setIsSaving(false);
          return;
        }
      }
      
      // Update parent via hook (handles Firestore update)
      const updatedParent = {
        ...parent,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      
      await updateParent(updatedParent);
      
      // Update session with new data
      if (onSessionUpdate) {
        onSessionUpdate(updatedParent);
      }
      
      setSuccessMessage('✅ Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('[ParentProfile] Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate passwords
    if (passwordData.newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters');
      return;
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      setErrorMessage('Password must contain uppercase, lowercase, and number');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    try {
      const db = getFirestoreInstance();
      const parentRef = doc(db, 'parents', parent.id);
      
      // In production, verify current password first
      // For now, just update
      await updateDoc(parentRef, {
        password: passwordData.newPassword
      });
      
      setSuccessMessage('✅ Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('[ParentProfile] Error changing password:', error);
      setErrorMessage('Failed to change password. Please try again.');
    }
  };
  
  // Save notification preferences
  const handleSaveNotifications = async () => {
    try {
      const db = getFirestoreInstance();
      const parentRef = doc(db, 'parents', parent.id);
      
      await updateDoc(parentRef, {
        notificationPreferences: notificationPrefs
      });
      
      // Update session with new notification preferences
      if (onSessionUpdate) {
        onSessionUpdate({
          ...parent,
          notificationPreferences: notificationPrefs
        });
      }
      
      setSuccessMessage('✅ Notification preferences updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('[ParentProfile] Error updating notifications:', error);
      setErrorMessage('Failed to update preferences. Please try again.');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">My Profile</h1>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-300">{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{errorMessage}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                <div className="w-6 h-6 mr-2">
                  <UserCircleIcon />
                </div>
                Personal Information
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                >
                  ✏️ Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: parent.name,
                        email: parent.email,
                        phone: parent.phone || '',
                      });
                    }}
                    className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : '💾 Save'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="parent-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    id="parent-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{parent.name}</p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="parent-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  <span className="mr-2">📧</span>
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    id="parent-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{parent.email}</p>
                )}
                {parent.emailVerified ? (
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Verified</span>
                ) : (
                  <span className="text-xs text-amber-600 dark:text-amber-400">⚠️ Not verified</span>
                )}
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="parent-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                  <span className="mr-2">📱</span>
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    id="parent-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="09XXXXXXXXX"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {parent.phone || 'Not set'}
                  </p>
                )}
              </div>
              
              {/* Registration Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Member Since
                </label>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {parent.registrationDate 
                    ? new Date(parent.registrationDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Password Change Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                🔒 Change Password
              </h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                >
                  Change
                </button>
              )}
            </div>
            
            {isChangingPassword ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Min. 8 characters, include uppercase, lowercase, and number
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Your password is secure. Click "Change" to update it.
              </p>
            )}
          </div>
          
          {/* Notification Preferences Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
              <BellIcon className="w-6 h-6 mr-2" />
              Notification Preferences
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Email Notifications</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailEnabled}
                    onChange={() => handleNotificationChange('emailEnabled')}
                    className="sr-only peer"
                    aria-label="Enable email notifications"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">SMS Notifications</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Receive updates via text message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.smsEnabled}
                    onChange={() => handleNotificationChange('smsEnabled')}
                    className="sr-only peer"
                    aria-label="Enable SMS notifications"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <hr className="border-slate-200 dark:border-slate-700" />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Absence Alerts</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Notify when child is absent</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.absenceAlerts}
                    onChange={() => handleNotificationChange('absenceAlerts')}
                    className="sr-only peer"
                    aria-label="Enable absence alerts"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Grade Alerts</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Notify when grades are posted</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.gradeAlerts}
                    onChange={() => handleNotificationChange('gradeAlerts')}
                    className="sr-only peer"
                    aria-label="Enable grade alerts"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Announcement Alerts</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Notify about school announcements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.announcementAlerts}
                    onChange={() => handleNotificationChange('announcementAlerts')}
                    className="sr-only peer"
                    aria-label="Enable announcement alerts"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <button
                onClick={handleSaveNotifications}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold mt-4"
              >
                💾 Save Preferences
              </button>
            </div>
          </div>
        </div>
        
        {/* Sidebar - Linked Children */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
              <div className="w-6 h-6 mr-2">
                <AcademicCapIcon />
              </div>
              My Children
            </h2>
            
            {linkedChildren.length > 0 ? (
              <div className="space-y-3">
                {linkedChildren.map(child => (
                  <div
                    key={child.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  >
                    <p className="font-semibold text-slate-800 dark:text-white">{child.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      LRN: {child.lrn || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Status: <span className="text-green-600 dark:text-green-400">{child.status || 'Active'}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                No children linked to your account yet.
              </p>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 To link additional children, please contact the school registrar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentProfile;
