/**
 * JoinSchoolModal — Modal for accepting a school invitation.
 *
 * Teachers enter an invite code, see the school info,
 * choose what to do with their personal data, and accept.
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  validateInviteCode,
  acceptInvitation,
  type DataAction,
  type AcceptResult,
} from '../../services/schoolInvitationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  email: string;
  onJoined?: (result: AcceptResult) => void;
}

type Step = 'code' | 'confirm' | 'success';

const JoinSchoolModal: React.FC<Props> = ({ isOpen, onClose, userId, userName, email, onJoined }) => {
  const [step, setStep] = useState<Step>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [role, setRole] = useState('teacher');
  const [dataAction, setDataAction] = useState<DataAction>('archive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AcceptResult | null>(null);

  const handleReset = () => {
    setStep('code');
    setInviteCode('');
    setSchoolName('');
    setError('');
    setResult(null);
    setDataAction('archive');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const info = await validateInviteCode(inviteCode.trim());
      if (!info.valid) {
        setError(info.error || 'Invalid code');
        return;
      }
      if (info.restricted_email && info.restricted_email.toLowerCase() !== email.toLowerCase()) {
        setError('This invitation was sent to a different email address.');
        return;
      }
      setSchoolName(info.school_name || '');
      setRole(info.role || 'teacher');
      setStep('confirm');
    } catch {
      setError('Failed to validate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await acceptInvitation(inviteCode.trim(), userId, userName, email, dataAction);
      if (!res.success) {
        setError(res.error || 'Failed to join school');
        return;
      }
      setResult(res);
      setStep('success');
      onJoined?.(res);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const DATA_OPTIONS: { value: DataAction; label: string; desc: string }[] = [
    {
      value: 'import',
      label: 'Import into school',
      desc: 'Move your students and grades into the school system. Recommended if your data is current.',
    },
    {
      value: 'archive',
      label: 'Keep as archive',
      desc: 'Your personal workspace becomes read-only. Access it anytime from Settings.',
    },
    {
      value: 'delete',
      label: 'Delete personal data',
      desc: 'Permanently remove your personal workspace data. This cannot be undone.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* ─── Step 1: Enter Code ─── */}
        {step === 'code' && (
          <>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                <BuildingLibraryIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Join a School</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter the invitation code from your school administrator
              </p>
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Invitation Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A3F7K9M2"
                  maxLength={12}
                  className="w-full px-3 py-2.5 text-center font-mono text-lg tracking-wider border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Validating...' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {/* ─── Step 2: Confirm & Choose Data Action ─── */}
        {step === 'confirm' && (
          <>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                <BuildingLibraryIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Join {schoolName}?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You'll be added as a <span className="font-medium text-slate-700 dark:text-slate-200">{role}</span>
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                What should happen to your personal workspace data?
              </p>
              {DATA_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    dataAction === opt.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dataAction"
                    value={opt.value}
                    checked={dataAction === opt.value}
                    onChange={() => setDataAction(opt.value)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {opt.label}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}

              {dataAction === 'delete' && (
                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    This will permanently delete all students, grades, and forms in your personal workspace.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('code'); setError(''); }}
                className="flex-1 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Back
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Joining...' : 'Join School'}
              </button>
            </div>
          </>
        )}

        {/* ─── Step 3: Success ─── */}
        {step === 'success' && result && (
          <>
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Welcome to {result.school_name}!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You've been added as a {result.role}. Sign out and sign back in to access the school workspace.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinSchoolModal;
