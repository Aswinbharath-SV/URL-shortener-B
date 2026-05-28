import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link2 } from 'lucide-react';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  // If already authenticated, redirect to the dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#030712] overflow-hidden px-4">
      {/* Dynamic Background Mesh Gradients */}
      <div className="mesh-bg"></div>

      <div className="w-full max-w-[1000px] grid md:grid-cols-2 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Branding & Hackathon Marketing Column */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent border-r border-slate-200/50 dark:border-white/5 relative">
          <div className="absolute -left-16 -top-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-2.5 z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              <Link2 className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent font-outfit">
              SnipURL.
            </span>
          </div>

          <div className="my-auto z-10 py-10">
            <h2 className="text-3xl font-extrabold tracking-tight font-outfit mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Enterprise-Grade URL Shortener & Analytics
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Track your click performance, geolocations, browsers, operating systems, and device breakdowns in real-time with our advanced tracking platform.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fast Async Redirections</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Advanced Geo & Device Charts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Custom Domain Aliases & QR Codes</span>
              </div>
            </div>
          </div>

          <div className="z-10 text-xs text-slate-400">
            Powered by modern React, Tailwind CSS and Express.
          </div>
        </div>

        {/* Auth Forms Mounting Column */}
        <div className="flex flex-col justify-center p-8 sm:p-12 relative">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
