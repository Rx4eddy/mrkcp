import React from 'react';
import { Terminal, Github, Heart, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-surface-border/50 bg-[#090d16] text-slate-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-extrabold text-lg text-white">mrkcp</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The competitive programmer's home base. Centralizing upcoming contests, reliable dual-trigger reminders, problem journal, and curated recommendations.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All platform adapters operational
            </div>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Supported Platforms
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white transition-colors">Codeforces</li>
              <li className="hover:text-white transition-colors">AtCoder</li>
              <li className="hover:text-white transition-colors">CodeChef</li>
              <li className="hover:text-white transition-colors">CSES Problem Set</li>
              <li className="hover:text-white transition-colors">LeetCode (Curated)</li>
            </ul>
          </div>

          {/* Open Source */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Open Source
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/mrkcp/mrkcp"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub Repository
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                MIT License
              </li>
              <li>
                <a href="#contributing" className="hover:text-white transition-colors">
                  Contributing Guide
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} mrkcp. Built for the competitive programming community.</p>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for speed and focus.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
