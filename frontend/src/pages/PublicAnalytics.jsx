import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import { initiateSocket, disconnectSocket } from '../services/socket';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Link2, 
  MousePointerClick, 
  Globe, 
  Monitor, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Globe2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];

const PublicAnalytics = () => {
  const { shortCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPublicStats = async () => {
    try {
      const res = await analyticsService.getPublicDetail(shortCode);
      if (res && res.success) {
        setData(res);
      } else {
        setError('Statistics for this shortcode are private or unavailable');
      }
    } catch (err) {
      console.error(err);
      setError('This link statistics is not open to public view or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStats();
  }, [shortCode]);

  useEffect(() => {
    if (data?.url) {
      const socket = initiateSocket(null, data.url.shortCode);
      if (socket) {
        socket.on('new-click', (eventData) => {
          setData(prev => {
            if (!prev) return prev;

            const updatedUrl = {
              ...prev.url,
              clicksCount: eventData.clicksCount
            };

            const todayStr = new Date().toISOString().split('T')[0];
            let updatedTrends = [...prev.analytics.dailyTrends];
            const idx = updatedTrends.findIndex(t => t.date === todayStr);
            if (idx !== -1) {
              updatedTrends[idx] = {
                ...updatedTrends[idx],
                clicks: updatedTrends[idx].clicks + 1
              };
            }

            return {
              ...prev,
              url: updatedUrl,
              analytics: {
                ...prev.analytics,
                dailyTrends: updatedTrends
              }
            };
          });
        });
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [data?.url?.shortCode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4"
        >
          <Link2 className="w-6 h-6 text-white" />
        </motion.div>
        <span className="text-slate-400 text-xs tracking-wider animate-pulse uppercase font-bold">
          Retrieving public link diagnostics...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-white/5 bg-slate-900/50 p-8 rounded-2xl text-center backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-6">
            <Link2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold font-outfit mb-2">Private Statistics</h1>
          <p className="text-slate-400 text-xs mb-8 leading-relaxed">{error}</p>
          <Link to="/" className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all shadow-lg">
            Create My Own Short URL
          </Link>
        </div>
      </div>
    );
  }

  const { url, analytics } = data || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50"></div>
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl"></div>

      {/* Header bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
            <Link2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-base font-bold dark:text-white font-outfit">SnipURL</span>
        </div>

        <Link
          to="/signup"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          Create Short URLs
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-8">
        
        {/* Info header */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold mb-3">
              <Sparkles className="w-3 h-3" />
              Public Verification Dashboard
            </div>
            <h1 className="text-2xl font-bold font-outfit text-white tracking-tight">{url.title}</h1>
            <p className="text-[10px] text-slate-450 mt-1 select-all font-mono">https://snipurl.com/r/{url.shortCode}</p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <a
              href={url.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 rounded-xl text-xs font-bold transition-all"
            >
              Verify Target Destination
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Aggregate Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Engagement</span>
              <MousePointerClick className="w-4.5 h-4.5 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-extrabold font-outfit text-white mt-3">{url.clicksCount.toLocaleString()}</h3>
            <p className="text-[9px] text-slate-500 mt-1.5 font-medium">Authentic redirection clicks parsed</p>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Top Device Market</span>
              <Monitor className="w-4.5 h-4.5 text-purple-500" />
            </div>
            <h3 className="text-2xl font-extrabold font-outfit text-white mt-3">
              {analytics.deviceBreakdown.length > 0 ? analytics.deviceBreakdown[0].name : 'Desktop'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 font-medium">Driving client device type</p>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Top Location</span>
              <Globe2 className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-extrabold font-outfit text-white mt-3 truncate">
              {analytics.countryBreakdown.length > 0 ? analytics.countryBreakdown[0].name : 'Direct'}
            </h3>
            <p className="text-[9px] text-slate-500 mt-1.5 font-medium">Driving geographical territory</p>
          </div>
        </div>

        {/* Click trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-outfit mb-6">Traffic Click Velocity</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyTrends}>
                  <defs>
                    <linearGradient id="colorPublicClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPublicClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-outfit mb-6">Device breakups</h3>
            {analytics.deviceBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-500">
                No click data.
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center">
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deviceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analytics.deviceBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                  {analytics.deviceBreakdown.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Locations and referers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-outfit mb-4">Location Breakdowns</h3>
            {analytics.countryBreakdown.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-500">No location data.</div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.countryBreakdown} layout="vertical">
                    <XAxis type="number" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} width={60} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '10px'
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-outfit mb-4">Browser distribution</h3>
            {analytics.browserBreakdown.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-500">No browser data.</div>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center">
                <div className="h-[130px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.browserBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analytics.browserBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                  {analytics.browserBreakdown.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-center text-xs text-slate-500 px-6 space-y-3 relative z-10">
        <p>© 2026 SnipURL Inc. All rights reserved. | Aswin bharath S V</p>
        <p className="text-slate-650">Public statistics compiled securely from link redirections.</p>
        <p className="pt-2 text-indigo-400/80 font-semibold tracking-wide uppercase text-[10px]">
          This project is a part of a hackathon run by <a href="https://katomaran.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-300 transition-colors">https://katomaran.com</a>
        </p>
      </footer>
    </div>
  );
};

export default PublicAnalytics;
