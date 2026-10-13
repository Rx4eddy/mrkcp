import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { Contest } from '../types/index.js';
import ContestCard from '../components/ContestCard.js';
import {
  Calendar,
  BookOpen,
  Sparkles,
  Bell,
  Link as LinkIcon,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Clock,
  Layers,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviewContests = async () => {
      try {
        const data = await api.getContests();
        setUpcomingContests((data || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load upcoming contests preview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreviewContests();
  }, []);

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 text-center">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Competitive Programmer's Home Base
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Never miss a contest.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Track your journey.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Consolidating Codeforces, AtCoder, CodeChef, and CSES into one home base. Automated contest calendars, dual-trigger email reminders, problem journaling with activity heatmaps, and curated practice recommendations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/calendar"
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View Contest Calendar</span>
                </Link>
                <Link
                  to="/journal"
                  className="px-6 py-3.5 rounded-xl bg-surface-elevated hover:bg-slate-700 border border-surface-border text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>My Problem Journal</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/calendar"
                  className="px-6 py-3.5 rounded-xl bg-surface-elevated hover:bg-slate-700 border border-surface-border text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all"
                >
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Browse Upcoming Contests</span>
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Unified Calendar & Timezones
            </span>
            <span className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-blue-400" />
              Morning & 2h Email Alerts
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              GitHub-Style Activity Heatmap
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Zero-Trust Handle Linking
            </span>
          </div>
        </div>
      </section>

      {/* Live Upcoming Contests Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-blue-400" />
              Upcoming Contests
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Synchronized automatically across Codeforces, AtCoder, and CodeChef.
            </p>
          </div>
          <Link
            to="/calendar"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View All Contests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-surface animate-pulse border border-surface-border"></div>
            ))}
          </div>
        ) : upcomingContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingContests.map((c) => (
              <ContestCard key={c.id} contest={c} userTimezone={user?.timezone || 'Local'} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-surface border border-surface-border text-center text-slate-400 text-sm">
            No upcoming contests found. Click below to trigger a background sync.
            <div className="mt-4">
              <Link
                to="/calendar"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                Go to Calendar & Sync
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5 Core Pillars Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Built for Competitive Programmers</h2>
          <p className="text-sm text-slate-400">
            Everything you need to compete, practice systematically, and track milestones in one unified workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Calendar & Reminders */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border/80 hover:border-blue-500/50 transition-all duration-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Platform Calendar</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Consolidated upcoming contest schedules. Filter by Codeforces, AtCoder, CodeChef, convert to your local timezone, and get countdown alerts.
            </p>
            <div className="pt-2 text-xs font-mono text-blue-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Morning & 2-Hour Alerts</span>
            </div>
          </div>

          {/* Card 2: Account Linking & Adapter Pattern */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border/80 hover:border-emerald-500/50 transition-all duration-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LinkIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Account Linking & Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Link your public handles via temporary profile token checks. Zero passwords required. Modular platform adapters ensure resilience even if an external site is down.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Public Token Verification</span>
            </div>
          </div>

          {/* Card 3: Problem Journal & Heatmap */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border/80 hover:border-amber-500/50 transition-all duration-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Problem Journal & Heatmap</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Record your entire problem journey. Track your current and longest streaks, solve counts per topic, write personal notes, and inspect your 365-day activity heatmap.
            </p>
            <div className="pt-2 text-xs font-mono text-amber-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Streaks & Topic Breakdown</span>
            </div>
          </div>

          {/* Card 4: Topic Recommendations */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border/80 hover:border-cyan-500/50 transition-all duration-200 space-y-4 md:col-span-2">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Curated Topic Recommendations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              When mastering a topic (DP, Graphs, Binary Search, Trees, etc.), mrkcp provides must-try problems across Codeforces, AtCoder, CSES, and CodeChef, sorted from easy to hard. Problems you've already solved are automatically hidden so your practice stays high-leverage.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Dynamic Programming', 'Graphs', 'Binary Search', 'Data Structures', 'Greedy', 'Strings'].map(
                (topic) => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded bg-surface-elevated text-xs font-medium text-slate-300 border border-surface-border"
                  >
                    {topic}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Card 5: Dedicated LeetCode Set */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border/80 hover:border-yellow-500/50 transition-all duration-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dedicated LeetCode Set</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curated must-do interview and algorithmic classics with direct links. Zero scraping or direct API dependencies — purely curated for focused mastery.
            </p>
            <div className="pt-2 text-xs font-mono text-yellow-400 flex items-center gap-1.5">
              <span>25+ Top Curated Classics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-blue-900/20 to-surface border border-blue-500/30 space-y-5">
          <h2 className="text-3xl font-extrabold text-white">Ready to elevate your CP practice?</h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Join competitive programmers keeping their contests, notes, and milestones in one unified home base.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30"
            >
              Create Free Account
            </Link>
            <Link
              to="/recommendations"
              className="px-6 py-3 rounded-xl bg-surface-elevated hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-surface-border"
            >
              Explore Problem Bank
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
