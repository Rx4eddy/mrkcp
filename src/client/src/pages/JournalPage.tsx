import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { JournalEntry, JournalAnalytics } from '../types/index.js';
import Heatmap from '../components/Heatmap.js';
import ManualLogModal from '../components/ManualLogModal.js';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Flame,
  Award,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  Tag,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const JournalPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [analytics, setAnalytics] = useState<JournalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

  // Modals
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editNotesText, setEditNotesText] = useState('');

  const loadJournalData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [entriesRes, analyticsRes] = await Promise.all([
        api.getJournalEntries({
          platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
          topic: selectedTopic !== 'all' ? selectedTopic : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
          search: searchQuery.trim() || undefined,
          limit: 100,
        }),
        api.getJournalAnalytics(),
      ]);

      setEntries(entriesRes.entries || []);
      setAnalytics(analyticsRes);
    } catch {
      error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournalData();
  }, [isAuthenticated, selectedPlatform, selectedTopic, selectedDifficulty, searchQuery]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await api.syncAllAccounts();
      success('Accounts synchronized with latest solves!');
      await loadJournalData();
    } catch (err: any) {
      error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      await api.deleteEntry(id);
      success('Journal entry removed');
      await loadJournalData();
    } catch {
      error('Failed to delete entry');
    }
  };

  const handleSaveNotes = async () => {
    if (!editingEntry) return;
    try {
      await api.updateEntry(editingEntry.id, { notes: editNotesText });
      success('Notes updated successfully');
      setEditingEntry(null);
      await loadJournalData();
    } catch {
      error('Failed to update notes');
    }
  };

  // Filter entries if a heatmap date is selected
  const displayedEntries = selectedHeatmapDate
    ? entries.filter(
        (e) => format(parseISO(e.solvedAt), 'yyyy-MM-dd') === selectedHeatmapDate
      )
    : entries;

  if (!isAuthenticated) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Your Problem Journal</h2>
        <p className="text-sm text-slate-400">
          Sign in to track your solved problems, view your 365-day activity heatmap, track your current streak, and save solution notes.
        </p>
        <div className="pt-2">
          <a
            href="/login"
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-md"
          >
            Sign In to Continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-400" />
            Problem Journal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Your competitive programming journey across Codeforces, AtCoder, CodeChef, and CSES.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-200 border border-surface-border text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Solves'}</span>
          </button>
          <button
            onClick={() => setLogModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Problem</span>
          </button>
        </div>
      </div>

      {/* Analytics & Streak Bar */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {analytics.totalSolved}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Total Solved</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {analytics.currentStreak} <span className="text-xs text-slate-400 font-sans">days</span>
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Current Streak</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {analytics.longestStreak} <span className="text-xs text-slate-400 font-sans">days</span>
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Longest Streak</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {analytics.totalActiveDays}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Active Days</div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Section */}
      {analytics && (
        <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Activity Heatmap (Past 365 Days)
            </h3>
            {selectedHeatmapDate && (
              <button
                onClick={() => setSelectedHeatmapDate(null)}
                className="text-xs text-cyan-400 hover:underline"
              >
                Clear date filter
              </button>
            )}
          </div>
          <Heatmap
            data={analytics.heatmap}
            selectedDate={selectedHeatmapDate}
            onSelectDate={(d) => setSelectedHeatmapDate(d)}
          />
        </div>
      )}

      {/* Topic & Platform Distribution Breakdown */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Platform */}
          <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Solved by Platform
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(analytics.byPlatform).map(([plat, count]) => (
                <div key={plat} className="p-2.5 rounded-lg bg-surface-elevated text-center">
                  <div className="text-lg font-bold text-white font-mono">{count}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400 truncate">
                    {plat}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Topic */}
          <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Solved by Core Topic
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analytics.byTopic).map(([topic, count]) => (
                <div
                  key={topic}
                  onClick={() => setSelectedTopic(selectedTopic === topic ? 'all' : topic)}
                  className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center gap-2 ${
                    selectedTopic === topic
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-surface-elevated border-surface-border text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span>{topic}</span>
                  <span className="font-mono text-[10px] bg-background px-1.5 py-0.5 rounded text-slate-400">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entries Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'codeforces', 'atcoder', 'codechef', 'cses', 'manual'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedPlatform === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface hover:bg-surface-elevated text-slate-400 border border-surface-border'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems, notes..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Journal Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-surface animate-pulse border border-surface-border"></div>
          ))}
        </div>
      ) : displayedEntries.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No journal entries found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Log a problem manually or link your handles in your profile to automatically import past solved problems.
          </p>
          <button
            onClick={() => setLogModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            Log First Problem
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl divide-y divide-surface-border/60 overflow-hidden">
          {displayedEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 hover:bg-surface-elevated/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {entry.platform}
                  </span>
                  {entry.difficulty && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-elevated text-slate-300 border border-surface-border">
                      {entry.difficulty}
                    </span>
                  )}
                  {entry.rating && (
                    <span className="text-[10px] font-mono text-slate-400">★ {entry.rating}</span>
                  )}
                  <span className="text-[11px] font-mono text-slate-500">
                    Solved {format(parseISO(entry.solvedAt), 'MMM d, yyyy')}
                  </span>
                </div>

                <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    {entry.title}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </h4>

                {entry.notes && (
                  <p className="text-xs text-slate-400 bg-surface-elevated/70 p-2.5 rounded-lg border border-surface-border/50 font-mono leading-relaxed whitespace-pre-wrap">
                    {entry.notes}
                  </p>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono text-slate-400 bg-surface-elevated px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingEntry(entry);
                    setEditNotesText(entry.notes || '');
                  }}
                  title="Edit solution notes"
                  className="px-2.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-surface-border"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Notes</span>
                </button>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  title="Delete entry"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Log Modal */}
      {logModalOpen && (
        <ManualLogModal
          onClose={() => setLogModalOpen(false)}
          onSuccess={loadJournalData}
        />
      )}

      {/* Edit Notes Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" />
              Notes for {editingEntry.title}
            </h3>
            <textarea
              rows={6}
              value={editNotesText}
              onChange={(e) => setEditNotesText(e.target.value)}
              placeholder="Record your solution approach, time/space complexity, or what tripped you up..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface-elevated border border-surface-border text-white text-sm focus:outline-none focus:border-blue-500 resize-none font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPage;
