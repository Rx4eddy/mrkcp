import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';
import { SupportedPlatform, LinkedAccount, ReminderPreference } from '../types/index.js';
import LinkAccountModal from '../components/LinkAccountModal.js';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Link as LinkIcon,
  Bell,
  RefreshCw,
  Clock,
  CheckCircle2,
  Globe,
  Save,
  Check,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [supportedPlatforms, setSupportedPlatforms] = useState<SupportedPlatform[]>([]);
  const [preferences, setPreferences] = useState<ReminderPreference[]>([]);
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [savingProfile, setSavingProfile] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  // Link Modal State
  const [modalPlatform, setModalPlatform] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimezone(user.timezone);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [platformsData, prefsData] = await Promise.all([
        api.getSupportedPlatforms(),
        api.getReminderPreferences(),
      ]);
      setSupportedPlatforms(platformsData || []);
      setPreferences(prefsData || []);
    } catch {
      error('Failed to load profile settings');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({ name, timezone });
      await refreshUser();
      success('Profile preferences updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateReminder = async (platform: string, updates: Partial<ReminderPreference>) => {
    try {
      const updated = await api.updateReminderPreference({
        platform,
        ...updates,
      });
      setPreferences((prev) =>
        prev.map((p) => (p.platform === platform ? { ...p, ...updated } : p))
      );
      success(`Updated reminder settings for ${platform.toUpperCase()}`);
    } catch {
      error('Failed to update reminder preference');
    }
  };

  const handleSyncAccount = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      await api.syncAccount(platform);
      await refreshUser();
      success(`Successfully synced solved problems from ${platform.toUpperCase()}`);
    } catch (err: any) {
      error(err.message || `Sync failed for ${platform}`);
    } finally {
      setSyncingPlatform(null);
    }
  };

  const linkedMap = new Map<string, LinkedAccount>();
  if (user?.linkedAccounts) {
    for (const acc of user.linkedAccounts) {
      linkedMap.set(acc.platform.toLowerCase(), acc);
    }
  }

  const prefMap = new Map<string, ReminderPreference>();
  for (const p of preferences) {
    prefMap.set(p.platform.toLowerCase(), p);
  }

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

  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {user?.name}
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Verified Email
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <ShieldAlert className="w-3 h-3" /> Email Unverified
                </span>
              )}
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Edit profile form */}
        <form onSubmit={handleSaveProfile} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-elevated px-2.5 py-1.5 rounded-lg border border-surface-border text-xs">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz} className="bg-surface text-white">
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingProfile ? 'Saving...' : 'Save Timezone'}</span>
          </button>
        </form>
      </div>

      {/* Multi-Platform Account Linking Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <LinkIcon className="w-5 h-5 text-emerald-400" />
            Multi-Platform Account Linking
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Link your public handles via our zero-trust token verification protocol. We never ask for or store third-party passwords.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportedPlatforms.map((p) => {
            const linked = linkedMap.get(p.id.toLowerCase());
            const isVerified = linked?.isVerified;
            const isSyncing = syncingPlatform === p.id;

            return (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-surface border border-surface-border flex flex-col justify-between space-y-4 hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-100 text-base">{p.name}</span>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : linked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Pending Verification
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500">Not Linked</span>
                    )}
                  </div>

                  {linked ? (
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div>
                        Handle:{' '}
                        <strong className="text-blue-400 font-mono">{linked.handle}</strong>
                      </div>
                      {linked.lastSyncedAt && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Last Synced: {format(parseISO(linked.lastSyncedAt), 'MMM d, HH:mm')}
                        </div>
                      )}
                      {linked.syncError && (
                        <div className="text-[11px] text-rose-400 font-mono">
                          Sync Note: {linked.syncError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Link your {p.name} handle to auto-import solved problems into your Problem Journal.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-surface-border/50">
                  {isVerified ? (
                    <button
                      onClick={() => handleSyncAccount(p.id)}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-surface-border transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Solves Now'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setModalPlatform({ id: p.id, name: p.name })}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{linked ? 'Complete Verification' : 'Link Handle'}</span>
                    </button>
                  )}

                  {linked && (
                    <button
                      onClick={() => setModalPlatform({ id: p.id, name: p.name })}
                      className="text-[11px] text-slate-400 hover:text-white underline"
                    >
                      Change handle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Email Contest Reminder Preferences */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-blue-400" />
            Contest Email Reminders
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Never miss a round. Configure dual reminders per platform: morning of contest day and 2 hours before start.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['codeforces', 'atcoder', 'codechef'].map((plat) => {
              const pref = prefMap.get(plat) || {
                platform: plat,
                enabled: true,
                morningOf: true,
                hoursBefore2: true,
              };

              return (
                <div
                  key={plat}
                  className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm capitalize">{plat}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={(e) =>
                          handleUpdateReminder(plat, { enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!pref.enabled}
                        checked={pref.morningOf}
                        onChange={(e) =>
                          handleUpdateReminder(plat, { morningOf: e.target.checked })
                        }
                        className="rounded bg-surface border-surface-border text-blue-600 focus:ring-0 disabled:opacity-40"
                      />
                      <span>Morning of Contest Day</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!pref.enabled}
                        checked={pref.hoursBefore2}
                        onChange={(e) =>
                          handleUpdateReminder(plat, { hoursBefore2: e.target.checked })
                        }
                        className="rounded bg-surface border-surface-border text-blue-600 focus:ring-0 disabled:opacity-40"
                      />
                      <span>2 Hours Before Contest Starts</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            * Reminders are reliably scheduled with automatic deduplication. Every email includes a 1-click unsubscribe option.
          </div>
        </div>
      </section>

      {/* Link Account Modal */}
      {modalPlatform && (
        <LinkAccountModal
          platformId={modalPlatform.id}
          platformName={modalPlatform.name}
          onClose={() => setModalPlatform(null)}
          onSuccess={() => {
            loadData();
            refreshUser();
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
