import React from 'react';
import { ExternalLink, Check, BookPlus, Edit3, Tag } from 'lucide-react';
import { CuratedProblem } from '../types/index.js';

interface ProblemCardProps {
  problem: CuratedProblem;
  onLogSolved?: (problem: CuratedProblem) => void;
  onEditNotes?: (problem: CuratedProblem) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  onLogSolved,
  onEditNotes,
}) => {
  const diffColors: Record<string, { bg: string; text: string; border: string }> = {
    Easy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    Hard: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    Master: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  };

  const platformColors: Record<string, { bg: string; text: string; border: string }> = {
    codeforces: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    atcoder: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    codechef: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    cses: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    leetcode: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  };

  const diffStyle = diffColors[problem.difficultyTier] || diffColors.Medium;
  const pStyle = platformColors[problem.platform.toLowerCase()] || platformColors.cses;

  return (
    <div
      className={`p-4 rounded-xl bg-surface border transition-all duration-200 flex flex-col justify-between group ${
        problem.isSolved
          ? 'border-emerald-500/30 bg-emerald-950/10'
          : 'border-surface-border/70 hover:border-slate-500 hover:shadow-lg'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
            >
              {problem.platform}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}
            >
              {problem.difficultyTier}
            </span>
            {problem.rating && (
              <span className="text-[11px] font-mono text-slate-400 bg-surface-elevated px-1.5 py-0.5 rounded">
                ★ {problem.rating}
              </span>
            )}
          </div>

          {problem.isSolved && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Check className="w-3 h-3" /> Solved
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors text-base mb-1.5">
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            {problem.title}
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
          </a>
        </h4>

        {/* Tip / Description */}
        {problem.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {problem.description}
          </p>
        )}

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {problem.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-surface-elevated px-2 py-0.5 rounded"
              >
                <Tag className="w-2.5 h-2.5 opacity-50" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="pt-3 border-t border-surface-border/40 flex items-center justify-between text-xs">
        <a
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
        >
          Solve Problem <ExternalLink className="w-3 h-3" />
        </a>

        <div className="flex items-center gap-2">
          {onEditNotes && (
            <button
              onClick={() => onEditNotes(problem)}
              title="Add / Edit Notes"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-surface-elevated"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {!problem.isSolved && onLogSolved && (
            <button
              onClick={() => onLogSolved(problem)}
              title="Mark as Solved in Journal"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-elevated hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors"
            >
              <BookPlus className="w-3 h-3" />
              <span>Log Solved</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;
