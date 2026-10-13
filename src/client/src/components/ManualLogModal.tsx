import React, { useState } from 'react';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { X, BookPlus, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ManualLogModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    url?: string;
    title?: string;
    platform?: string;
    difficulty?: string;
    tags?: string[];
  };
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  onClose,
  onSuccess,
  initialData,
}) => {
  const { success, error } = useToast();
  const [url, setUrl] = useState(initialData?.url || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [platform, setPlatform] = useState(initialData?.platform || 'other');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Medium');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [solvedAt, setSolvedAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-detect platform and title when URL is entered
  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (!initialData?.platform) {
      if (val.includes('codeforces.com')) setPlatform('codeforces');
      else if (val.includes('atcoder.jp')) setPlatform('atcoder');
      else if (val.includes('codechef.com')) setPlatform('codechef');
      else if (val.includes('cses.fi')) setPlatform('cses');
      else if (val.includes('leetcode.com')) setPlatform('leetcode');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await api.createManualEntry({
        url: url.trim(),
        title: title.trim() || undefined,
        platform,
        difficulty,
        tags,
        solvedAt: new Date(solvedAt).toISOString(),
        notes: notes.trim() || undefined,
      });

      success('Problem logged successfully to your journal!');
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to log problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <BookPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Log Solved Problem</h3>
            <p className="text-xs text-slate-400">
              Track your solutions, notes, and milestones in your Problem Journal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Problem URL *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://codeforces.com/problemset/problem/158/A"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Problem Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next Round"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="codeforces">Codeforces</option>
                <option value="atcoder">AtCoder</option>
                <option value="codechef">CodeChef</option>
                <option value="cses">CSES</option>
                <option value="leetcode">LeetCode</option>
                <option value="other">Other / Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Master">Master</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Solved Date
              </label>
              <input
                type="date"
                value={solvedAt}
                onChange={(e) => setSolvedAt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Topic Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="dp, binary-search, graphs, greedy"
              className="w-full px-3.5 py-2 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Personal Notes / Solution Approach
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key observations, tricky edge cases, time complexity (e.g. O(N log N)), or template used..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save to Journal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualLogModal;
