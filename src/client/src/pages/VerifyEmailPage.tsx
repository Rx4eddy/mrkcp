import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No verification token found in URL.');
      setLoading(false);
      return;
    }

    const doVerify = async () => {
      try {
        const res = await api.verifyEmail(token);
        setSuccessMsg(res.message || 'Email successfully verified!');
        await refreshUser();
      } catch (err: any) {
        setErrorMsg(err.message || 'Verification token is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token, refreshUser]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-2xl border border-surface-border text-center space-y-4 shadow-2xl">
        {loading ? (
          <div className="space-y-3 py-6">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Verifying email address...</h2>
          </div>
        ) : successMsg ? (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Email Verified!</h2>
            <p className="text-xs text-slate-300">{successMsg}</p>
            <div className="pt-2">
              <Link
                to="/profile"
                className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-xs text-rose-300">{errorMsg}</p>
            <div className="pt-2">
              <Link
                to="/calendar"
                className="inline-block px-5 py-2.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-white font-semibold text-xs border border-surface-border"
              >
                Back to Home Base
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
