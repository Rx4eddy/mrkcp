import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Calendar, BookOpen, Sparkles, User as UserIcon, LogOut, Terminal, Mail, Menu, X } from 'lucide-react';
import DevMailboxModal from './DevMailboxModal.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [devMailboxOpen, setDevMailboxOpen] = useState(false);

  const navLinks = [
    { name: 'Contest Calendar', path: '/calendar', icon: Calendar },
    { name: 'Problem Journal', path: '/journal', icon: BookOpen },
    { name: 'Recommendations', path: '/recommendations', icon: Sparkles },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-surface-border/50 bg-[#090d16]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-primary-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
                  <div className="w-full h-full bg-surface rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                    <Terminal className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    mrkcp
                  </span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 -mt-1 font-semibold">
                    Home Base
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-1 ml-8">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-surface-elevated/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {/* Dev Mailbox Preview Button */}
              <button
                onClick={() => setDevMailboxOpen(true)}
                title="View Simulated Emails & Notifications"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-mono transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Dev Mailbox</span>
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      isActive('/profile')
                        ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                        : 'border-surface-border bg-surface hover:bg-surface-elevated text-slate-200'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 font-semibold flex items-center justify-center text-xs">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span>{user?.name}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="p-2 rounded-lg border border-surface-border text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setDevMailboxOpen(true)}
                className="p-2 text-amber-400"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-border bg-surface px-4 pt-3 pb-5 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'text-slate-300 hover:text-white hover:bg-surface-elevated'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-surface-border">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-200 hover:bg-surface-elevated"
                  >
                    <UserIcon className="w-5 h-5 text-blue-400" />
                    Profile & Settings ({user?.name})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-400 hover:bg-rose-950/20"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg border border-surface-border text-slate-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-blue-600 text-white font-semibold"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Dev Mailbox Modal */}
      {devMailboxOpen && <DevMailboxModal onClose={() => setDevMailboxOpen(false)} />}
    </>
  );
};

export default Navbar;
