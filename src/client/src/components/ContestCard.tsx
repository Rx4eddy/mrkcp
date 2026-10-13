import React from 'react';
import { Contest } from '../types/index.js';
import { ExternalLink, Clock, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ContestCardProps {
  contest: Contest;
  userTimezone?: string;
  isReminded?: boolean;
  onToggleReminder?: () => void;
}

export const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  userTimezone = 'Local',
  isReminded = false,
  onToggleReminder,
}) => {
  const startDate = parseISO(contest.startTime);
  const endDate = parseISO(contest.endTime);
  const now = new Date();

  // Time remaining
  const msUntilStart = startDate.getTime() - now.getTime();
  const msUntilEnd = endDate.getTime() - now.getTime();

  let statusBadge = {
    text: 'Upcoming',
    color: 'bg-blue-950/60 text-blue-400 border-blue-800/50',
    urgent: false,
  };

  if (msUntilStart <= 0 && msUntilEnd > 0) {
    statusBadge = {
      text: 'ONGOING NOW',
      color: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 animate-pulse',
      urgent: true,
    };
  } else if (msUntilStart > 0 && msUntilStart <= 2 * 60 * 60 * 1000) {
    const mins = Math.round(msUntilStart / (60 * 1000));
    statusBadge = {
      text: `Starts in ${mins}m`,
      color: 'bg-rose-950/80 text-rose-400 border-rose-500/50 animate-bounce',
      urgent: true,
    };
  } else if (msUntilStart > 0 && msUntilStart <= 24 * 60 * 60 * 1000) {
    const hours = Math.round(msUntilStart / (60 * 60 * 1000));
    statusBadge = {
      text: `Starts in ${hours}h`,
      color: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
      urgent: false,
    };
  } else if (msUntilStart > 0) {
    const days = Math.round(msUntilStart / (24 * 60 * 60 * 1000));
    statusBadge = {
      text: `In ${days} day${days === 1 ? '' : 's'}`,
      color: 'bg-slate-800 text-slate-300 border-slate-700',
      urgent: false,
    };
  }

  // Duration in hours/mins
  const durHours = Math.floor(contest.durationSeconds / 3600);
  const durMins = Math.floor((contest.durationSeconds % 3600) / 60);
  const durationText = durHours > 0 ? `${durHours}h ${durMins > 0 ? `${durMins}m` : ''}` : `${durMins}m`;

  const platformColors: Record<string, { bg: string; text: string; border: string }> = {
    codeforces: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    atcoder: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    codechef: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    cses: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  const pStyle = platformColors[contest.platform.toLowerCase()] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  return (
    <div className="flex flex-col justify-between p-5 rounded-xl bg-surface border border-surface-border/70 hover:border-slate-600 transition-all duration-200 group hover:shadow-xl hover:shadow-blue-900/10">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
          >
            {contest.platform}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${statusBadge.color}`}
            >
              {statusBadge.text}
            </span>
            {onToggleReminder && (
              <button
                onClick={onToggleReminder}
                title={isReminded ? 'Reminder active' : 'Click to enable reminder'}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isReminded
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-surface-border text-slate-500 hover:text-slate-300'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contest Name */}
        <h3 className="font-bold text-lg text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 mb-4">
          {contest.name}
        </h3>

        {/* Date & Duration Info */}
        <div className="space-y-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              {format(startDate, 'EEE, MMM d, yyyy · HH:mm')} ({userTimezone})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Duration: {durationText}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-surface-border/50 flex items-center justify-between">
        <a
          href={contest.url}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-elevated hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-semibold transition-all duration-150 border border-surface-border hover:border-blue-500"
        >
          <span>Open Contest</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default ContestCard;
