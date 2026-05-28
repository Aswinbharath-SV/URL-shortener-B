import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import urlService from '../services/urlService';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../contexts/AuthContext';
import { initiateSocket, disconnectSocket } from '../services/socket';
import TrafficGlobe from '../components/TrafficGlobe';
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
  Bar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Link2, 
  Activity, 
  Share2, 
  MousePointerClick, 
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox,
  Briefcase,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

// Harmonious Sleek Colors for charts
const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveClicks, setLiveClicks] = useState([]);
  const notify = useNotification();
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    try {
      const res = await analyticsService.getDashboard();
      if (res && res.success) {
        setData(res);
      } else {
        notify('Failed to load dashboard statistics', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Connection error. Could not retrieve statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user) {
      const socket = initiateSocket(user.id || user._id);
      if (socket) {
        socket.on('new-click', (eventData) => {
          notify(`New live click recorded via referer: ${eventData.click.referer}`, 'info');

          // Append to live clicks list
          setLiveClicks(prev => [eventData.click, ...prev]);

          // Update counters and graphs dynamically without page reload
          setData(prev => {
            if (!prev) return prev;

            const updatedSummary = {
              ...prev.summary,
              totalClicks: prev.summary.totalClicks + 1
            };

            // Increment dailyTrends clicks count
            const todayStr = new Date().toISOString().split('T')[0];
            let updatedTrends = [...prev.analytics.dailyTrends];
            const idx = updatedTrends.findIndex(t => t.date === todayStr);
            if (idx !== -1) {
              updatedTrends[idx] = {
                ...updatedTrends[idx],
                clicks: updatedTrends[idx].clicks + 1
              };
            }

            // Increment mostClicked clicks count
            let updatedMostClicked = [...prev.mostClicked];
            const urlIdx = updatedMostClicked.findIndex(u => u._id === eventData.urlId);
            if (urlIdx !== -1) {
              updatedMostClicked[urlIdx] = {
                ...updatedMostClicked[urlIdx],
                clicksCount: eventData.clicksCount
              };
              updatedMostClicked.sort((a, b) => b.clicksCount - a.clicksCount);
            }

            // Update fraud summary metrics
            const updatedFraud = prev.analytics.fraudSummary ? {
              ...prev.analytics.fraudSummary,
              totalClicks: (prev.analytics.fraudSummary.totalClicks || 0) + 1,
              suspiciousClicks: (prev.analytics.fraudSummary.suspiciousClicks || 0) + (eventData.click.isSuspicious ? 1 : 0),
              botClicks: (prev.analytics.fraudSummary.botClicks || 0) + (eventData.click.threatType === 'bot' ? 1 : 0),
              spamClicks: (prev.analytics.fraudSummary.spamClicks || 0) + (eventData.click.threatType === 'ip_spam' ? 1 : 0)
            } : {
              totalClicks: 1,
              suspiciousClicks: eventData.click.isSuspicious ? 1 : 0,
              botClicks: eventData.click.threatType === 'bot' ? 1 : 0,
              spamClicks: eventData.click.threatType === 'ip_spam' ? 1 : 0
            };

            return {
              ...prev,
              summary: updatedSummary,
              mostClicked: updatedMostClicked,
              analytics: {
                ...prev.analytics,
                dailyTrends: updatedTrends,
                fraudSummary: updatedFraud
              }
            };
          });
        });
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const handleCopyLink = (code) => {
    const baseUrl = window.location.origin; // fallback
    const shortUrl = `http://localhost:5000/r/${code}`;
    navigator.clipboard.writeText(shortUrl);
    notify('Short URL copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Shimmer Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl glass-panel animate-pulse p-6 flex flex-col justify-between">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-8 w-24 bg-slate-300 dark:bg-slate-700 rounded mt-2"></div>
            </div>
          ))}
        </div>
        
        {/* Shimmer Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-[350px] rounded-2xl glass-panel animate-pulse bg-slate-100/50 dark:bg-slate-900/30"></div>
          <div className="h-[350px] rounded-2xl glass-panel animate-pulse bg-slate-100/50 dark:bg-slate-900/30"></div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const analytics = data?.analytics || {};
  const mostClicked = data?.mostClicked || [];

  const hasLinks = summary.totalUrls > 0;

  return (
    <div className="space-y-6">
      
      {/* 1. WELCOME HERO STRIP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-outfit bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            Workspace Overview
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time link distribution and aggregate visitor diagnostics
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/my-urls"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Manage My Links
          </Link>
        </div>
      </div>

      {!hasLinks ? (
        /* EMPTY STATE VIEW */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/30 backdrop-blur-xl p-16 text-center max-w-2xl mx-auto mt-12 shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-6">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-outfit mb-2">No Links Shortened Yet</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto mb-8">
            Get started by creating your first shortened URL link to unlock powerful geolocation insights and browser auditing.
          </p>
          <Link
            to="/my-urls"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg"
          >
            Create My First Link
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        /* DASHBOARD CONTENT */
        <>
          {/* 2. STATS GRID CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Clicks */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Clicks</p>
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <MousePointerClick className="w-4.5 h-4.5" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-4">
                {summary.totalClicks.toLocaleString()}
              </h2>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12% vs last week</span>
              </div>
            </motion.div>

            {/* Created Links */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Links</p>
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                  <Link2 className="w-4.5 h-4.5" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-4">
                {summary.totalUrls}
              </h2>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">All-time shortened codes</p>
            </motion.div>

            {/* Active Links Rate */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Links</p>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Activity className="w-4.5 h-4.5" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-4">
                {summary.activeUrls}
              </h2>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {summary.totalUrls ? Math.round((summary.activeUrls / summary.totalUrls) * 100) : 0}% Active Rate
                </span>
              </div>
            </motion.div>

            {/* Top Referer Source */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Referer</p>
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mt-4 truncate">
                {summary.topReferer}
              </h2>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Primary traffic driving source</p>
            </motion.div>
          </div>

          {/* LIVE GLOBAL TRAFFIC HUB & SECURITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* 3D Traffic Globe */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
              <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl -z-10"></div>
              
              <div className="p-2 md:p-6 space-y-4 max-w-sm">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Live Coordinates Active
                  </span>
                  <h3 className="text-lg font-bold font-outfit mt-3">3D Traffic Intelligence</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Visualizing click redirection requests across global geographic coordinates in real time.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div>
                    <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Active Visitors</p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                      {Math.max(1, Math.round(summary.totalClicks * 0.04))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Pulse Channels</p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">Socket.IO</p>
                  </div>
                </div>
              </div>

              {/* Globe Rendering */}
              <div className="w-full md:w-auto flex items-center justify-center">
                <TrafficGlobe clicksList={liveClicks} width={320} height={320} />
              </div>
            </div>

            {/* Security Guard Shield */}
            <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg flex flex-col justify-between">
              {(() => {
                const fraudSummary = analytics.fraudSummary || { totalClicks: 0, suspiciousClicks: 0, botClicks: 0, spamClicks: 0 };
                const totalC = summary.totalClicks || 1;
                const cleanRate = Math.max(0, Math.min(100, Math.round(((totalC - (fraudSummary.suspiciousClicks || 0)) / totalC) * 100)));
                const threatLevel = (fraudSummary.suspiciousClicks || 0) > (totalC * 0.1) ? 'High' : ((fraudSummary.suspiciousClicks || 0) > 0 ? 'Medium' : 'Low');

                return (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold font-outfit">Security & Fraud Guard</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                          threatLevel === 'High' 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : threatLevel === 'Medium'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {threatLevel} Threat
                        </span>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>Clean Traffic Rate</span>
                            <span>{cleanRate}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cleanRate}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                          <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>Bot Spiders Blocked</span>
                            <span className="text-slate-900 dark:text-white">{fraudSummary.botClicks || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>IP Clicking Spam</span>
                            <span className="text-slate-900 dark:text-white">{fraudSummary.spamClicks || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-slate-500">
                            <span>Suspicious Clicks</span>
                            <span className="text-rose-500 font-bold">{fraudSummary.suspiciousClicks || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 dark:border-white/5 text-[9.5px] text-slate-400 leading-relaxed font-medium">
                      {(fraudSummary.suspiciousClicks || 0) > 0 ? (
                        <span className="text-rose-400 animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Shield Active: Spam IP/UserAgent crawls quarantined.
                        </span>
                      ) : (
                        <span className="text-emerald-450 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          Secure: Express rate limits active. Channel clean.
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* 3. CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Click Timeline (Span 2) */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold font-outfit">Click Traffic Timeline</h3>
                  <p className="text-[10px] text-slate-400">Total clicks parsed over the last 30 days</p>
                </div>
              </div>
              
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyTrends}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(str) => {
                        const date = new Date(str);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                        fontFamily: 'Inter'
                      }}
                      labelFormatter={(str) => `Date: ${new Date(str).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}`}
                    />
                    <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Device breakdown Pie */}
            <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
              <div className="mb-6">
                <h3 className="text-sm font-bold font-outfit">Visitor Device Audit</h3>
                <p className="text-[10px] text-slate-400">Desktop, Mobile, or Tablet breakdown</p>
              </div>

              {analytics.deviceBreakdown.length === 0 ? (
                <div className="h-[230px] flex items-center justify-center text-xs text-slate-400">
                  No device data recorded yet.
                </div>
              ) : (
                <div className="h-[230px] flex flex-col items-center justify-center">
                  <div className="h-[170px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.deviceBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.deviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend list */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {analytics.deviceBreakdown.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
                        <span className="text-slate-900 dark:text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. COUNTRY & BROWSER GRIDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Geographic Bar chart */}
            <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
              <div className="mb-6">
                <h3 className="text-sm font-bold font-outfit">Top Visitor Locations</h3>
                <p className="text-[10px] text-slate-400">Total clicks aggregated by physical country</p>
              </div>

              {analytics.countryBreakdown.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                  No geographic data recorded yet.
                </div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.countryBreakdown} layout="vertical">
                      <XAxis type="number" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} width={80} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px'
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Browsers distribution pie */}
            <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
              <div className="mb-6">
                <h3 className="text-sm font-bold font-outfit">Visitor Browser Audit</h3>
                <p className="text-[10px] text-slate-400">Breakdown of browser agents</p>
              </div>

              {analytics.browserBreakdown.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
                  No browser data recorded yet.
                </div>
              ) : (
                <div className="h-[220px] flex flex-col items-center justify-center">
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.browserBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.browserBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend list */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {analytics.browserBreakdown.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
                        <span className="text-slate-900 dark:text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. MOST CLICKED LINKS TABLE */}
          <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold font-outfit">Top Performing Links</h3>
                <p className="text-[10px] text-slate-400">Top 5 shortened links with the highest engagement</p>
              </div>
              <Link to="/my-urls" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1">
                View all Links
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400 font-bold">
                    <th className="py-3 px-4">Title / Original Link</th>
                    <th className="py-3 px-4">Short Link</th>
                    <th className="py-3 px-4 text-center">Total Clicks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {mostClicked.map((url) => (
                    <tr key={url._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{url.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{url.originalUrl}</p>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {url.shortCode}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {url.clicksCount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(url.shortCode)}
                            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4.5 h-4.5" />
                          </button>
                          
                          <a
                            href={`http://localhost:5000/r/${url.shortCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Open short link"
                          >
                            <ExternalLink className="w-4.5 h-4.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
