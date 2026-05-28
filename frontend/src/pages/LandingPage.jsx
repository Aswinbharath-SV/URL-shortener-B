import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Link2, 
  ArrowRight, 
  BarChart3, 
  QrCode, 
  Smartphone, 
  Globe, 
  Shield, 
  Upload, 
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      {/* Background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70"></div>
      
      {/* Glow balls */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Header bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
            <Link2 className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-outfit">
            SnipURL.
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Log In
          </Link>
          <Link to="/signup" className="flex items-center gap-1 text-sm font-semibold bg-white text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all duration-200 shadow-lg">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight font-outfit mb-6 leading-[1.08] max-w-4xl mx-auto">
            URLs that do more than just{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              redirect.
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            Supercharge your links with real-time browser breakdowns, physical physical country mapping, custom aliases, QR codes, and bulk CSV uploads.
          </p>
        </motion.div>

        {/* Marketing Call to Action Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto p-8 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden mt-6"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-xl"></div>
          
          <div className="relative z-10 space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Unlock Advanced URL Analytics</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-extrabold font-outfit tracking-tight text-white max-w-xl mx-auto leading-tight">
              Shorten, brand, and track your links with ease.
            </h3>
            
            <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
              Create a free account to start generating short URLs instantly. Our platform provides fully branded QR codes, real-time geolocation tracking, browser diagnostics, and collaborative workspaces.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 text-sm"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition-all duration-200 border border-white/5 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 text-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Micro-features strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/5 text-slate-400 text-xs font-semibold">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No Card Required</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited Redirects</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Team Workspaces</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Real-Time Analytics</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature cards Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-4">Enterprise Features Included</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">Everything you need to publish, redirect, audit, and aggregate short links in style.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BarChart3,
              title: 'Detailed Trends',
              desc: 'Monitor exact click charts mapping daily and weekly breakdowns instantly.',
              color: 'text-indigo-500 bg-indigo-500/10'
            },
            {
              icon: QrCode,
              title: 'Auto QR Codes',
              desc: 'High-quality base64 QR codes generated instantly for offline scanning campaigns.',
              color: 'text-purple-500 bg-purple-500/10'
            },
            {
              icon: Smartphone,
              title: 'Device Parse',
              desc: 'Analyze user agent signatures logging exact Device, OS, and Browser counts.',
              color: 'text-pink-500 bg-pink-500/10'
            },
            {
              icon: Globe,
              title: 'Geo Lookup',
              desc: 'Track physical physical locations including Country, Region, and City details.',
              color: 'text-emerald-500 bg-emerald-500/10'
            },
            {
              icon: Shield,
              title: 'Rate Limited',
              desc: 'Secure Express configuration protecting resources against spam redirects.',
              color: 'text-blue-500 bg-blue-500/10'
            },
            {
              icon: Upload,
              title: 'CSV Bulk Upload',
              desc: 'Upload a CSV of long URLs to instantly shorten hundreds of links at once.',
              color: 'text-yellow-500 bg-yellow-500/10'
            }
          ].map((feat, i) => (
            <div key={i} className="p-6 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color} mb-5`}>
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-outfit mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Scales seamlessly from personal testing to massive marketing platforms.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl border border-white/5 bg-slate-900/30 relative flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Basic</p>
              <h3 className="text-2xl font-bold font-outfit mb-4">Standard Free</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-slate-500 text-xs ml-1">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Unlimited short link generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Generate QR Codes instantly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Basic click counters
                </li>
              </ul>
            </div>
            <Link to="/signup" className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-center rounded-xl text-xs font-bold transition-all">
              Sign Up Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="p-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 relative flex flex-col justify-between overflow-hidden">
            <div className="absolute right-0 top-0 bg-indigo-600 text-white px-4 py-1 text-[10px] font-bold uppercase rounded-bl-xl tracking-wider">
              Popular
            </div>
            <div>
              <p className="text-xs text-indigo-400 uppercase tracking-widest font-bold mb-2">Grow</p>
              <h3 className="text-2xl font-bold font-outfit mb-4">Pro Plan</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-slate-500 text-xs ml-1">/ month</span>
              </div>
              <ul className="space-y-3.5 text-xs text-indigo-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Detailed Device, Browser & OS graphs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Country & City Geolocation maps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Bulk CSV uploads (100+ links at once)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-500" />
                  Custom aliases & Public stats links
                </li>
              </ul>
            </div>
            <Link to="/signup" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-center rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25">
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5 bg-slate-950/80 text-center text-xs text-slate-500 px-6 space-y-3">
        <p>© 2026 SnipURL Inc. All rights reserved. | Aswin bharath S V</p>

        <p className="pt-2 text-indigo-400/80 font-semibold tracking-wide uppercase text-[10px]">
          This project is a part of a hackathon run by <a href="https://katomaran.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-300 transition-colors">https://katomaran.com</a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
