import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Contest } from '../types/index.js';
import ContestCard from '../components/ContestCard.js';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  Filter,
  Globe,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import { format, parseISO, isSameWeek, isSameMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'weekly'>('grid');
  const [userTimezone, setUserTimezone] = useState<string>(
    user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  const fetchContests = async () => {
    setLoading(true);
    try {
      const data = await api.getContests({
        platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
        search: searchQuery.trim() || undefined,
      });
      setContests(data || []);
    } catch {
      error('Failed to load contest schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [selectedPlatform, searchQuery]);

  const handleSyncContests = async () => {
    setSyncing(true);
    try {
      const res = await api.syncContests();
      success(res.message || 'Contests refreshed successfully!');
      await fetchContests();
    } catch (err: any) {
      error(err.message || 'Contest sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const platforms = [
    { id: 'all', name: 'All Platforms' },
    { id: 'codeforces', name: 'Codeforces' },
    { id: 'atcoder', name: 'AtCoder' },
    { id: 'codechef', name: 'CodeChef' },
  ];

  const timezones = [
    'UTC',
    'Local',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
  ];

  // Weekly Grouping helper
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-400" />
            Contest Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Weekly and monthly schedule across platforms. Filter, check start times in your local timezone, and set reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timezone Switcher */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300">
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={userTimezone}
              onChange={(e) => setUserTimezone(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz} className="bg-surface text-white">
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Contests Button */}
          <button
            onClick={handleSyncContests}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Contests'}</span>
          </button>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Platform Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedPlatform === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-surface hover:bg-surface-elevated text-slate-400 border border-surface-border'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Search & View Mode */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contest..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center rounded-lg bg-surface border border-surface-border p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-surface-elevated text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded ${
                viewMode === 'list' ? 'bg-surface-elevated text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              title="Weekly Calendar View"
              className={`p-1.5 rounded ${
                viewMode === 'weekly' ? 'bg-surface-elevated text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-surface animate-pulse border border-surface-border"></div>
          ))}
        </div>
      ) : contests.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-4">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No upcoming contests found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search filters or click "Sync Contests" to fetch the latest schedule from Codeforces, AtCoder, and CodeChef.
          </p>
          <button
            onClick={handleSyncContests}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Sync Contests Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((c) => (
            <ContestCard key={c.id} contest={c} userTimezone={userTimezone} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-surface border border-surface-border rounded-xl divide-y divide-surface-border/60 overflow-hidden">
          {contests.map((c) => {
            const startDate = parseISO(c.startTime);
            return (
              <div
                key={c.id}
                className="p-4 hover:bg-surface-elevated/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {c.platform}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {format(startDate, 'EEE, MMM d · HH:mm')} ({userTimezone})
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
                    {c.name}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    {Math.round(c.durationSeconds / 3600)}h duration
                  </span>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-surface-elevated hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-semibold border border-surface-border transition-colors"
                  >
                    Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Weekly View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayContests = contests.filter((c) => format(parseISO(c.startTime), 'yyyy-MM-dd') === dayStr);

              return (
                <div
                  key={idx}
                  className="rounded-xl bg-surface border border-surface-border p-3 flex flex-col min-h-[180px]"
                >
                  <div className="text-xs font-mono pb-2 border-b border-surface-border/50 flex justify-between text-slate-400">
                    <span className="font-bold text-slate-200">{format(day, 'EEE')}</span>
                    <span>{format(day, 'MMM d')}</span>
                  </div>

                  <div className="flex-1 mt-2 space-y-2">
                    {dayContests.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-600 font-mono">
                        No contest
                      </div>
                    ) : (
                      dayContests.map((c) => (
                        <a
                          key={c.id}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block p-2 rounded-lg bg-surface-elevated border border-surface-border hover:border-blue-500 text-[11px] transition-colors group"
                        >
                          <div className="font-semibold text-blue-400 group-hover:underline truncate">
                            {c.name}
                          </div>
                          <div className="text-slate-400 font-mono text-[10px] mt-1">
                            {format(parseISO(c.startTime), 'HH:mm')} ({c.platform})
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
