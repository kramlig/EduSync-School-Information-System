/**
 * PersonalSignupScreen — Registration flow for Personal Mode.
 *
 * Two-step wizard:
 *  Step 1: Account info (name, email, password) — or Google sign-in
 *  Step 2: School & Class info (school name, school ID, division, region, grade, section)
 *
 * On success, saves an edusync_session matching the existing pattern and navigates to /personal.
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applyReferralCode } from '../../services/referralService';
import EdusyncLogo from '../../../components/EdusyncLogo';
import {
  signupPersonal,
  signupWithGoogle,
  type PersonalSignupData,
} from '../../services/personalWorkspaceService';

// DepEd Philippine regions
const REGIONS = [
  'Region I - Ilocos Region',
  'Region II - Cagayan Valley',
  'Region III - Central Luzon',
  'Region IV-A - CALABARZON',
  'Region IV-B - MIMAROPA',
  'Region V - Bicol Region',
  'Region VI - Western Visayas',
  'Region VII - Central Visayas',
  'Region VIII - Eastern Visayas',
  'Region IX - Zamboanga Peninsula',
  'Region X - Northern Mindanao',
  'Region XI - Davao Region',
  'Region XII - SOCCSKSARGEN',
  'Region XIII - Caraga',
  'NCR - National Capital Region',
  'CAR - Cordillera Administrative Region',
  'BARMM - Bangsamoro',
];

const GRADE_LEVELS = [
  { value: 1, label: 'Grade 1' },
  { value: 2, label: 'Grade 2' },
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'Grade 7' },
  { value: 8, label: 'Grade 8' },
  { value: 9, label: 'Grade 9' },
  { value: 10, label: 'Grade 10' },
  { value: 11, label: 'Grade 11' },
  { value: 12, label: 'Grade 12' },
];

interface Props {
  onLogin: (user: any, type: 'staff') => void;
}

type Step = 'account' | 'school' | 'success';

/** Brief success celebration shown after signup, auto-redirects after 2.5s */
const SuccessScreen: React.FC<{ firstName: string; onComplete: () => void }> = ({ firstName, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md p-10 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-lg space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Welcome to EduSync, {firstName}! 🎉
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your personal workspace has been created. Redirecting you now...
        </p>
        <div className="flex justify-center">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
};

const PersonalSignupScreen: React.FC<Props> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  const [step, setStep] = useState<Step>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingLogin, setPendingLogin] = useState<{ user: any } | null>(null);

  // Account fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // School & class fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolIdNumber, setSchoolIdNumber] = useState('');
  const [division, setDivision] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [gradeLevel, setGradeLevel] = useState<number>(1);
  const [sectionName, setSectionName] = useState('');

  // Google auth flag — skip email/pass validation
  const [isGoogleFlow, setIsGoogleFlow] = useState(false);

  const inputClass =
    'mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

  // ─── Step 1 validation ─────────────────────────────────

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStep('school');
  };

  // ─── Google sign-in (step 1 alternative) ───────────────

  const handleGoogleStart = async () => {
    setError('');
    setIsLoading(true);
    try {
      // We import GoogleAuthProvider + signInWithPopup to get user info first
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../../services/firestoreService');
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      // Pre-fill fields from Google profile
      setFullName(cred.user.displayName || '');
      setEmail(cred.user.email || '');
      setIsGoogleFlow(true);
      setStep('school');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not available yet. Please use email/password to create your account.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2 submission ─────────────────────────────────

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!schoolName.trim()) {
      setError('School name is required.');
      return;
    }
    if (schoolName.trim().length < 5) {
      setError('School name is too short. Please enter the full school name.');
      return;
    }
    if (schoolIdNumber.trim() && !/^\d{6}$/.test(schoolIdNumber.trim())) {
      setError('School ID must be a 6-digit DepEd school ID (e.g. 301234).');
      return;
    }
    if (!division.trim()) {
      setError('Division is required.');
      return;
    }
    if (!/^division\s+of\s+/i.test(division.trim()) && division.trim().length < 8) {
      setError('Please enter a valid DepEd division (e.g. "Division of Zamboanga City").');
      return;
    }
    if (!region) {
      setError('Region is required.');
      return;
    }
    if (!sectionName.trim()) {
      setError('Section name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const signupData: PersonalSignupData = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        schoolName: schoolName.trim(),
        schoolIdNumber: schoolIdNumber.trim(),
        division: division.trim(),
        region,
        district: district.trim() || undefined,
        gradeLevel,
        sectionName: sectionName.trim(),
      };

      let firebaseUid: string;
      let workspace: any;

      if (isGoogleFlow) {
        // Google users — workspace creation only (Firebase user already exists)
        const result = await signupWithGoogle({
          schoolName: signupData.schoolName,
          schoolIdNumber: signupData.schoolIdNumber,
          division: signupData.division,
          region: signupData.region,
          district: signupData.district,
          gradeLevel: signupData.gradeLevel,
          sectionName: signupData.sectionName,
        });
        firebaseUid = result.firebaseUid;
        workspace = result.workspace;
      } else {
        // Email/password users — full signup
        const result = await signupPersonal(signupData);
        firebaseUid = result.firebaseUid;
        workspace = result.workspace;
      }

      // Build session matching existing handleLogin pattern
      const schoolId = workspace.school_id || workspace.schoolId;
      const teacherId = workspace.teacher_id || workspace.teacherId;

      const user = {
        id: teacherId,
        email: email.trim(),
        name: fullName.trim(),
        role: 'teacher' as const,
        schoolId,
        schoolIds: [schoolId],
        firebaseUid,
        workspaceType: 'personal' as const,
        schoolName: schoolName.trim(),
      };

      // Save to localStorage + trigger session update
      const sessionData = { user, type: 'staff' as const };
      localStorage.setItem('edusync_session', JSON.stringify(sessionData));
      window.dispatchEvent(new Event('edusync-session-updated'));

      // Apply referral code if present (fire-and-forget, don't block signup)
      if (referralCode) {
        applyReferralCode(referralCode, firebaseUid, email.trim()).catch(() => {});
      }

      // Show success screen before redirecting
      setPendingLogin({ user });
      setStep('success');
    } catch (err: any) {
      const msg = err.message || 'Signup failed. Please try again.';
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────

  // Success screen — brief celebration before redirect
  if (step === 'success') {
    return <SuccessScreen firstName={fullName.split(' ')[0] || 'Teacher'} onComplete={() => {
      if (pendingLogin) {
        window.history.pushState({}, '', '/personal');
        onLogin(pendingLogin.user, 'staff');
      }
    }} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
        {/* Branding */}
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-2">
            <EdusyncLogo size="xl" showText={true} className="mb-2" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Create your free personal workspace
          </p>
          {referralCode && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
              🎉 Referral code <span className="font-mono">{referralCode.toUpperCase()}</span> applied — get your first month of Pro at ₱29!
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'account' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${step === 'account' ? 'bg-indigo-600' : 'bg-green-500'}`}>
              {step === 'account' ? '1' : '✓'}
            </span>
            Account
          </div>
          <div className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'school' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'school' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
              2
            </span>
            School & Class
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ─── Step 1: Account ─────────────────────────── */}
        {step === 'account' && (
          <form className="space-y-4" onSubmit={handleAccountNext}>
            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name</label>
              <input
                id="fullName" type="text" required
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="signupEmail" className={labelClass}>Email address</label>
              <input
                id="signupEmail" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="signupPassword" className={labelClass}>Password</label>
              <input
                id="signupPassword" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
              <input
                id="confirmPassword" type="password" autoComplete="new-password" required
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            {/* Google sign up */}
            <button
              type="button"
              onClick={handleGoogleStart}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </form>
        )}

        {/* ─── Step 2: School & Class ─────────────────── */}
        {step === 'school' && (
          <form className="space-y-4" onSubmit={handleFinalSubmit}>
            {isGoogleFlow && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-3 text-sm text-green-800 dark:text-green-200">
                Signed in as <strong>{email}</strong>. Now set up your school info.
              </div>
            )}

            <div>
              <label htmlFor="schoolName" className={labelClass}>School Name</label>
              <input
                id="schoolName" type="text" required
                value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Zamboanga City National High School"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="schoolId" className={labelClass}>
                School ID Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="schoolId" type="text"
                value={schoolIdNumber} onChange={(e) => setSchoolIdNumber(e.target.value)}
                placeholder="e.g. 301234"
                maxLength={6}
                pattern="\d{6}"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="region" className={labelClass}>Region</label>
                <select
                  id="region" required
                  value={region} onChange={(e) => setRegion(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="division" className={labelClass}>Division</label>
                <input
                  id="division" type="text" required
                  value={division} onChange={(e) => setDivision(e.target.value)}
                  placeholder="e.g. Division of Zamboanga City"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="district" className={labelClass}>
                District <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="district" type="text"
                value={district} onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Zamboanga City West District"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gradeLevel" className={labelClass}>Grade Level</label>
                <select
                  id="gradeLevel" required
                  value={gradeLevel} onChange={(e) => setGradeLevel(Number(e.target.value))}
                  className={inputClass}
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sectionName" className={labelClass}>Section Name</label>
                <input
                  id="sectionName" type="text" required
                  value={sectionName} onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g. Rose"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('account'); setError(''); }}
                className="flex-1 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating workspace...' : 'Create My Workspace'}
              </button>
            </div>
          </form>
        )}

        {/* Footer links */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>
            Already have an account?{' '}
            <Link to="/admin" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </Link>
          </p>
          <p>
            Just need a form?{' '}
            <Link to="/tools/form-generator" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Use the free generator
            </Link>
          </p>
        </div>

        {/* Tier info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">Free tier includes:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Up to 50 students</li>
            <li>1 advisory section</li>
            <li>Generate SF2, SF5, SF9 forms</li>
            <li>10 downloads per day</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PersonalSignupScreen;
