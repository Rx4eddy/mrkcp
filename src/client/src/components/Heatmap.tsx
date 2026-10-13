import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

interface HeatmapProps {
  data: Array<{ date: string; count: number }>;
  onSelectDate?: (date: string) => void;
  selectedDate?: string | null;
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, onSelectDate, selectedDate }) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  // Group days into columns of 7 (weeks)
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  let currentWeek: Array<{ date: string; count: number }> = [];

  for (const day of data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (count: number, isSelected: boolean) => {
    if (isSelected) return 'bg-cyan-400 ring-2 ring-cyan-300 ring-offset-1 ring-offset-[#090d16]';
    if (count === 0) return 'bg-[#151c2c] hover:bg-slate-700/60';
    if (count <= 2) return 'bg-emerald-900 hover:bg-emerald-800';
    if (count <= 4) return 'bg-emerald-600 hover:bg-emerald-500';
    return 'bg-emerald-400 hover:bg-emerald-300 shadow-sm shadow-emerald-500/30';
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[700px] flex flex-col gap-2">
        {/* Hover Info Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 h-5">
          <div>
            {hoveredDay ? (
              <span className="font-mono text-slate-200">
                <strong className="text-emerald-400">{hoveredDay.count}</strong> problem
                {hoveredDay.count === 1 ? '' : 's'} solved on{' '}
                {format(parseISO(hoveredDay.date), 'EEEE, MMM d, yyyy')}
              </span>
            ) : selectedDate ? (
              <span className="font-mono text-cyan-400">
                Filtered: {format(parseISO(selectedDate), 'MMM d, yyyy')}{' '}
                <button
                  onClick={() => onSelectDate?.('')}
                  className="underline ml-2 text-slate-400 hover:text-white"
                >
                  Clear filter
                </button>
              </span>
            ) : (
              <span>Hover over a block to view activity</span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#151c2c]"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></div>
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></div>
            <span>More</span>
          </div>
        </div>

        {/* The Grid */}
        <div className="flex gap-[3px] p-3 rounded-xl bg-surface border border-surface-border/50">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between text-[9px] font-mono text-slate-500 pr-1 select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          {/* Weeks */}
          <div className="flex gap-[3px] flex-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px] flex-1">
                {week.map((day) => {
                  const isSelected = selectedDate === day.date;
                  return (
                    <button
                      key={day.date}
                      onClick={() => onSelectDate?.(isSelected ? '' : day.date)}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={`${day.date}: ${day.count} solved`}
                      className={`w-full aspect-square rounded-[2.5px] transition-all duration-150 ${getColor(
                        day.count,
                        isSelected
                      )}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
