import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { X, Mail, Trash2, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DevEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  type: string;
  contestName?: string;
}

export const DevMailboxModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { success, error } = useToast();
  const [emails, setEmails] = useState<DevEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<DevEmail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.getDevEmails();
      setEmails(res.emails || []);
      if (res.emails?.length > 0 && !selectedEmail) {
        setSelectedEmail(res.emails[0]);
      }
    } catch {
      error('Failed to load dev mailbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleClear = async () => {
    try {
      await api.clearDevEmails();
      setEmails([]);
      setSelectedEmail(null);
      success('Dev mailbox cleared');
    } catch {
      error('Failed to clear dev mailbox');
    }
  };

  const handleTriggerReminders = async () => {
    try {
      const res = await api.triggerRemindersCheck();
      success(`Checked reminders: ${res.result.twoHourCount} 2h alerts, ${res.result.morningCount} morning alerts sent.`);
      await fetchEmails();
    } catch {
      error('Failed to trigger reminder check');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-4xl w-full h-[650px] shadow-2xl relative flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">mrkcp Dev Mailbox</h3>
              <p className="text-[11px] text-slate-400">
                Inspect simulated emails and triggers without requiring real SMTP credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerReminders}
              title="Force trigger 2-hour and morning reminder check"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Reminder Check</span>
            </button>
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-surface"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split: List & Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* List */}
          <div className="w-1/3 border-r border-surface-border overflow-y-auto p-2 space-y-1.5">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                No simulated emails sent yet.
              </div>
            ) : (
              emails.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedEmail(m)}
                  className={`p-3 rounded-xl cursor-pointer text-xs transition-colors border ${
                    selectedEmail?.id === m.id
                      ? 'bg-blue-600/15 border-blue-500/40 text-white'
                      : 'bg-surface hover:bg-surface-elevated border-surface-border text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono text-amber-400 font-semibold">{m.type}</span>
                    <span>{format(parseISO(m.sentAt), 'HH:mm:ss')}</span>
                  </div>
                  <div className="font-semibold truncate">{m.subject}</div>
                  <div className="text-slate-400 text-[11px] truncate">To: {m.to}</div>
                </div>
              ))
            )}
          </div>

          {/* Preview Pane */}
          <div className="flex-1 overflow-y-auto p-4 bg-background">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-surface border border-surface-border text-xs space-y-1">
                  <div>
                    <strong className="text-slate-400">Subject:</strong>{' '}
                    <span className="text-slate-100 font-semibold">{selectedEmail.subject}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">To:</strong>{' '}
                    <span className="font-mono text-blue-400">{selectedEmail.to}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400">Sent:</strong>{' '}
                    <span className="font-mono text-slate-400">
                      {format(parseISO(selectedEmail.sentAt), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-surface-border bg-black/40">
                  <div
                    className="prose prose-invert max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Select an email from the left to view rendered preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevMailboxModal;
