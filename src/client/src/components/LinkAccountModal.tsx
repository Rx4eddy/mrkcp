import React, { useState } from 'react';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { X, Copy, Check, ExternalLink, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LinkAccountModalProps {
  platformId: string;
  platformName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const LinkAccountModal: React.FC<LinkAccountModalProps> = ({
  platformId,
  platformName,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [handle, setHandle] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [verificationCode, setVerificationCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStartLinking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    try {
      const res = await api.startLinking(platformId, handle.trim());
      setVerificationCode(res.verificationCode);
      setInstructions(res.instructions);
      setProfileUrl(res.profileUrl);
      setStep('verify');
    } catch (err: any) {
      error(err.message || 'Failed to initiate linking');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNow = async () => {
    setLoading(true);
    try {
      const res = await api.verifyHandle(platformId);
      if (res.verified) {
        success(`${platformName} account successfully verified and linked!`);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onSuccess();
        onClose();
      } else {
        error(res.message || 'Verification token was not found on your profile yet.');
      }
    } catch (err: any) {
      error(err.message || 'Verification check failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Link {platformName} Account</h3>
            <p className="text-xs text-slate-400">
              Verify ownership via your public profile. We never ask for passwords.
            </p>
          </div>
        </div>

        {step === 'input' ? (
          <form onSubmit={handleStartLinking} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Your {platformName} Username / Handle
              </label>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. tourist, chokudai, etc."
                className="w-full px-4 py-2.5 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 flex items-start gap-2.5 text-xs text-blue-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                mrkcp uses a zero-trust public token verification protocol. In the next step, you will be given a small unique token to place temporarily in your public bio or name.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !handle.trim()}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue to Verification
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-3">
              <div className="text-xs text-slate-300 font-medium">
                1. Copy this unique verification code:
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-background border border-surface-border text-cyan-400 font-mono text-sm font-bold select-all">
                  {verificationCode}
                </code>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3 py-2 rounded-lg bg-surface hover:bg-slate-700 border border-surface-border text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-300 font-medium pt-1">
                2. Instructions for {platformName}:
              </div>
              <p className="text-xs text-slate-400 leading-relaxed bg-background/50 p-2.5 rounded-lg border border-surface-border/50">
                {instructions}
              </p>

              {profileUrl && (
                <div className="pt-1">
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline"
                  >
                    Open your {platformName} profile <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Change handle
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleVerifyNow}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify Ownership Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkAccountModal;
