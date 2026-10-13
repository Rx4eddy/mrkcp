import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { CuratedProblem } from '../types/index.js';
import ProblemCard from '../components/ProblemCard.js';
import ManualLogModal from '../components/ManualLogModal.js';
import {
  Sparkles,
  EyeOff,
  Eye,
  Filter,
  CheckCircle2,
  BookPlus,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';

export const RecommendationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [topics, setTopics] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('Dynamic Programming');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [hideSolved, setHideSolved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [problems, setProblems] = useState<CuratedProblem[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Quick log modal
  const [logModalData, setLogModalData] = useState<any>(null);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const data = await api.getTopics();
        setTopics(data || []);
      } catch {
        error('Failed to load topic categories');
      }
    };
    loadTopics();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getRecommendations({
        topic: selectedTopic !== 'all' ? selectedTopic : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
        hideSolved,
      });
      setProblems(res.problems || []);
      setSolvedCount(res.solvedCount || 0);
    } catch {
      error('Failed to load recommended problems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [selectedTopic, selectedDifficulty, selectedPlatform, hideSolved]);

  const handleQuickLog = (p: CuratedProblem) => {
    setLogModalData({
      url: p.url,
      title: p.title,
      platform: p.platform,
      difficulty: p.difficultyTier,
      tags: p.tags,
    });
  };

  const filteredProblems = searchQuery.trim()
    ? problems.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : problems;

  const isLeetCodeActive = selectedTopic === 'Curated LeetCode';

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-surface-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            Topic Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Curated problem progressions ordered easy to hard. Focus deeply on one topic across all platforms.
          </p>
        </div>

        {/* Hide Solved Toggle */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => setHideSolved(!hideSolved)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                hideSolved
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-surface-elevated text-slate-300 border-surface-border hover:bg-slate-700'
              }`}
            >
              {hideSolved ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
              <span>{hideSolved ? 'Solved Problems Hidden' : 'Hide Solved Problems'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Topic Selection Carousel / Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Practice Topic
          </span>
          <span className="text-xs font-mono text-slate-500">
            {problems.length} problems in {selectedTopic}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {topics.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTopic(t.name)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                selectedTopic === t.name
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                  : t.name === 'Curated LeetCode'
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20'
                  : 'bg-surface hover:bg-surface-elevated border-surface-border text-slate-300'
              }`}
            >
              {t.name === 'Curated LeetCode' && <Layers className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{t.name}</span>
              <span className="font-mono text-[10px] opacity-75 bg-black/20 px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dedicated LeetCode Callout */}
      {isLeetCodeActive && (
        <div className="p-4 rounded-xl bg-yellow-950/20 border border-yellow-500/30 flex items-start gap-3 text-xs text-yellow-200">
          <Layers className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-yellow-300 font-bold block text-sm">Dedicated LeetCode Collection</strong>
            <p className="text-yellow-200/80 leading-relaxed">
              Curated must-know interview and algorithmic problems. LeetCode problems appear only as curated links without direct scraping or API sync, as per open-source guidelines.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        {/* Difficulty Tier Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Easy', 'Medium', 'Hard', 'Master'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDifficulty === diff
                  ? 'bg-surface-elevated text-blue-400 font-bold border border-blue-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {diff === 'all' ? 'All Difficulties' : diff}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems in topic..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Problem Grid (Ordered Easy to Hard) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-surface animate-pulse border border-surface-border"></div>
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-surface-border text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All caught up!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {hideSolved
              ? 'You have solved all problems matching your active filter. Turn off "Hide Solved" or select another topic.'
              : 'No problems matched your current filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((prob) => (
            <ProblemCard
              key={`${prob.platform}-${prob.externalId}`}
              problem={prob}
              onLogSolved={handleQuickLog}
            />
          ))}
        </div>
      )}

      {/* Quick Log Modal */}
      {logModalData && (
        <ManualLogModal
          initialData={logModalData}
          onClose={() => setLogModalData(null)}
          onSuccess={() => {
            loadRecommendations();
          }}
        />
      )}
    </div>
  );
};

export default RecommendationsPage;
