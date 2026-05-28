import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import { useNotification } from '../hooks/useNotification';
import api from '../services/api';
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
  ChevronLeft, 
  Copy, 
  Download, 
  Share2, 
  ExternalLink,
  MousePointerClick,
  Monitor,
  Globe,
  Globe2,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];

const AnalyticsDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [bestPostingTime, setBestPostingTime] = useState(null);
  const notify = useNotification();
  const navigate = useNavigate();

  const fetchUrlDetail = async () => {
    try {
      const res = await analyticsService.getUrlDetail(id);
      if (res && res.success) {
        setData(res);
      } else {
        notify('Failed to load link statistics', 'error');
        navigate('/my-urls');
      }
    } catch (err) {
      console.error(err);
      notify('Link not found or unauthorized access', 'error');
      navigate('/my-urls');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictiveData = async () => {
    try {
      const res = await api.get(`/analytics/predict/${id}`);
      if (res.data && res.data.success) {
        setPredictions(res.data.predictions || []);
        setBestPostingTime(res.data.bestPostingTime || null);
      }
    } catch (err) {
      console.error('Failed to load predictive analytics:', err);
    }
  };

  useEffect(() => {
    fetchUrlDetail();
    fetchPredictiveData();
  }, [id]);

  useEffect(() => {
    if (data?.url) {
      const socket = initiateSocket(null, data.url.shortCode);
      if (socket) {
        socket.on('new-click', (eventData) => {
          notify('Real-time redirection click detected!', 'success');

          setData(prev => {
            if (!prev) return prev;

            const updatedUrl = {
              ...prev.url,
              clicksCount: eventData.clicksCount
            };

            const updatedRecent = [eventData.click, ...(prev.recentClicks || [])].slice(0, 50);

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
              recentClicks: updatedRecent,
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

  const handleCopyShort = () => {
    if (!data?.url) return;
    const shortUrl = `http://localhost:5000/r/${data.url.shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    notify('Short URL copied to clipboard!', 'success');
  };

  const handleCopyPublicStatsLink = () => {
    if (!data?.url) return;
    const publicUrl = `${window.location.origin}/public-analytics/${data.url.shortCode}`;
    navigator.clipboard.writeText(publicUrl);
    setCopying(true);
    notify('Public share link copied! Anyone can view these graphs.', 'success');
    setTimeout(() => setCopying(false), 2000);
  };

  const handleExportCSV = async () => {
    if (!data?.url) return;
    try {
      notify('Compiling spreadsheet...', 'info');
      await analyticsService.exportCSV(id, data.url.shortCode);
      notify('CSV click logs exported successfully!', 'success');
    } catch (err) {
      notify('Failed to export click logs', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        <div className="h-28 rounded-2xl glass-panel animate-pulse bg-slate-100 dark:bg-slate-900/30"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[280px] rounded-2xl glass-panel animate-pulse bg-slate-100 dark:bg-slate-900/30"></div>
          <div className="h-[280px] rounded-2xl glass-panel animate-pulse bg-slate-100 dark:bg-slate-900/30"></div>
        </div>
      </div>
    );
  }

  const { url, analytics, recentClicks = [] } = data || {};

  return (
    <div className="space-y-6">
      
      {/* 1. BACK BUTTON AND NAVIGATION */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-urls"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-300 font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Links
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Public Stats Share */}
          <button
            onClick={handleCopyPublicStatsLink}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/5 rounded-xl text-xs font-semibold active:scale-95 transition-all"
            title="Copy public analytics link"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copying ? 'Link Copied!' : 'Share Public Stats'}
          </button>
          
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 2. URL DETAILS HEADER CARD */}
      <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg relative">
        <div className="absolute right-6 top-6 h-12 w-12 rounded-xl bg-slate-50 dark:bg-[#080c16] p-1.5 border border-slate-150 dark:border-white/[0.04] hidden sm:flex items-center justify-center">
          <img src={url.qrCodeDataUrl} alt="QR Mini" className="w-full h-full object-contain" />
        </div>

        <div className="max-w-2xl">
          <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white truncate">
            {url.title}
          </h2>
          {url.description && <p className="text-slate-400 text-xs mt-1 leading-relaxed">{url.description}</p>}
          
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination URL</p>
              <a
                href={url.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 flex items-center gap-1 mt-1 break-all"
              >
                <span className="truncate max-w-[280px]">{url.originalUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shortened Link</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  https://snipurl.com/r/{url.shortCode}
                </span>
                <button
                  onClick={handleCopyShort}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 hover:text-indigo-500"
                  title="Copy link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2b. CLICK JOURNEY VISUAL FLOW */}
      {recentClicks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl -z-10"></div>
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-bold font-outfit flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Real-Time Redirect Journey Flow
              </h3>
              <p className="text-[10px] text-slate-400">Interactive click visualization of the most recent visitor</p>
            </div>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-650 dark:text-indigo-400">
              Live Click Map
            </span>
          </div>

          {/* Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center relative">
            
            {/* Step 1: Visitor */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/[0.02] flex flex-col items-center text-center relative">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold mb-2">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-[10px] font-bold text-slate-950 dark:text-white">1. Visitor Inbound</p>
              <p className="text-[9px] text-slate-400 mt-1 truncate max-w-full" title={recentClicks[0].country}>
                {recentClicks[0].country || 'Unknown'} ({recentClicks[0].device || 'Desktop'})
              </p>
              <p className="text-[8px] font-mono text-slate-450 mt-0.5">{recentClicks[0].ip}</p>
            </div>

            {/* Connection 1 */}
            <div className="hidden md:flex justify-center text-indigo-500">
              <motion.div
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </div>

            {/* Step 2: Security */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/[0.02] flex flex-col items-center text-center relative">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold mb-2 ${
                recentClicks[0].isSuspicious 
                  ? 'bg-rose-500/10 text-rose-500' 
                  : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                {recentClicks[0].isSuspicious ? (
                  <ShieldAlert className="w-5 h-5 animate-bounce" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-955 dark:text-white">2. Abuse Audit</p>
              <p className="text-[9px] text-slate-400 mt-1">
                {recentClicks[0].isSuspicious ? 'Suspicious click flagged' : 'Clean visitor verified'}
              </p>
              <p className="text-[8px] font-mono text-slate-450 mt-0.5">Threat: {recentClicks[0].threatType || 'none'}</p>
            </div>

            {/* Connection 2 */}
            <div className="hidden md:flex justify-center text-indigo-500">
              <motion.div
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </div>

            {/* Step 3: Redirect */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/[0.02] flex flex-col items-center text-center relative">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold mb-2">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <p className="text-[10px] font-bold text-slate-950 dark:text-white">3. Link Dispatch</p>
              <p className="text-[9px] text-slate-400 mt-1">Ref: {recentClicks[0].referer || 'Direct'}</p>
              <p className="text-[8px] font-mono text-slate-450 mt-0.5">r/{url.shortCode}</p>
            </div>

            {/* Connection 3 */}
            <div className="hidden md:flex justify-center text-indigo-500">
              <motion.div
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </div>

            {/* Step 4: Destination */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-150 dark:border-white/[0.02] flex flex-col items-center text-center relative">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold mb-2">
                <ExternalLink className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-slate-950 dark:text-white">4. Destination</p>
              <p className="text-[9px] text-slate-400 mt-1 truncate max-w-full" title={url.originalUrl}>
                {(() => {
                  try {
                    return new URL(url.originalUrl).hostname;
                  } catch (e) {
                    return 'Target URL';
                  }
                })()}
              </p>
              <p className="text-[8px] font-mono text-emerald-500 mt-0.5">Redirected Successfully</p>
            </div>

          </div>
        </motion.div>
      )}

      {/* 3. DYNAMIC COUNTERS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Click Counter */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Engagement</span>
            <MousePointerClick className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-3">
            {url.clicksCount.toLocaleString()}
          </h3>
          <p className="text-[9px] text-slate-400 mt-1.5 font-medium">All-time redirection clicks</p>
        </div>

        {/* Primary Geo Location */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Primary Market</span>
            <Globe2 className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-3 truncate">
            {analytics.countryBreakdown.length > 0 ? analytics.countryBreakdown[0].name : 'Direct'}
          </h3>
          <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Driving geographical territory</p>
        </div>

        {/* Primary Device */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Primary Device</span>
            <Monitor className="w-4.5 h-4.5 text-purple-500" />
          </div>
          <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-3">
            {analytics.deviceBreakdown.length > 0 ? analytics.deviceBreakdown[0].name : 'Desktop'}
          </h3>
          <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Driving client device type</p>
        </div>
      </div>

      {/* 4. CLINIC TRAFFIC GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-6">Traffic Click Velocity</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyTrends}>
                <defs>
                  <linearGradient id="colorUrlClicks" x1="0" y1="0" x2="0" y2="1">
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
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUrlClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device breakdown Pie */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <div className="mb-6">
            <h3 className="text-sm font-bold font-outfit">Device Breakups</h3>
            <p className="text-[10px] text-slate-400">Total clicks aggregated by client devices</p>
          </div>

          {analytics.deviceBreakdown.length === 0 ? (
            <div className="h-[210px] flex items-center justify-center text-xs text-slate-400">
              No clicks registered yet.
            </div>
          ) : (
            <div className="h-[210px] flex flex-col items-center justify-center">
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
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
              
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                {analytics.deviceBreakdown.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="text-slate-400">{entry.name}:</span>
                    <span className="text-slate-800 dark:text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. COUNTRY, BROWSER & REFERERS GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Country distribution */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4">Location Breakdowns</h3>
          {analytics.countryBreakdown.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
              No clicks registered.
            </div>
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.countryBreakdown} layout="vertical">
                  <XAxis type="number" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
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

        {/* Browser distribution */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4">Browser distribution</h3>
          {analytics.browserBreakdown.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
              No clicks registered.
            </div>
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
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {analytics.browserBreakdown.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="text-slate-400">{entry.name}:</span>
                    <span className="text-slate-800 dark:text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Referers distribution */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4">Traffic referer Sources</h3>
          {analytics.refererBreakdown.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
              No clicks registered.
            </div>
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.refererBreakdown}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '10px'
                    }}
                  />
                  <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AI PREDICTIONS & CAMPAIGN INTEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Predictive Traffic Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg relative">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl -z-10"></div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold font-outfit flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                AI Traffic Forecasting (7-Day Projection)
              </h3>
              <p className="text-[10px] text-slate-400">Projected click redirection velocity calculated via exponential smoothing</p>
            </div>
            {bestPostingTime && (
              <span className="px-3 py-1 rounded-full text-[9px] font-extrabold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                💡 Best Posting: {bestPostingTime.day} at {bestPostingTime.time}
              </span>
            )}
          </div>

          <div className="h-[230px]">
            {predictions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Running forecasting algorithm model...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictions}>
                  <defs>
                    <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '10px'
                    }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorPredict)" name="Projected Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-outfit mb-4">UTM Campaign Analytics</h3>
            {(!analytics.utmCampaignBreakdown || analytics.utmCampaignBreakdown.length === 0) ? (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
                No campaign details mapped yet.
              </div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.utmCampaignBreakdown}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '10px'
                      }}
                    />
                    <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={12} name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-[9px] text-slate-400 leading-normal font-medium">
            💡 Pro Tip: Append UTM parameters to short links to filter campaigns automatically.
          </div>
        </div>
      </div>

      {/* GEO TIMEZONES & ISPS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timezones */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4">Visitor Timezones</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {(!analytics.timezoneBreakdown || analytics.timezoneBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">No timezones recorded.</p>
            ) : (
              analytics.timezoneBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-100 dark:border-white/[0.02] last:border-0">
                  <span className="text-slate-650 dark:text-slate-350">{item.name}</span>
                  <span className="text-slate-900 dark:text-white font-mono bg-slate-150 dark:bg-white/5 px-2 py-0.5 rounded">{item.value} clicks</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ISPs */}
        <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4">Visitor ISPs</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {(!analytics.ispBreakdown || analytics.ispBreakdown.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-4">No ISPs recorded.</p>
            ) : (
              analytics.ispBreakdown.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-semibold py-1.5 border-b border-slate-100 dark:border-white/[0.02] last:border-0">
                  <span className="text-slate-650 dark:text-slate-350">{item.name}</span>
                  <span className="text-slate-900 dark:text-white font-mono bg-slate-150 dark:bg-white/5 px-2 py-0.5 rounded">{item.value} clicks</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. RECENT VISIT HISTORY LOG TABLE */}
      <div className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
        <div className="mb-6">
          <h3 className="text-sm font-bold font-outfit flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-indigo-500" />
            Recent click Audit Trail
          </h3>
          <p className="text-[10px] text-slate-400">Chronological list of the last 50 individual clicks logged by redirection</p>
        </div>

        {recentClicks.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No clicks recorded yet for this shortened URL link.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400 font-bold bg-slate-50/50 dark:bg-white/[0.01]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Visitor IP Address</th>
                  <th className="py-2.5 px-4">Device Details</th>
                  <th className="py-2.5 px-4">Geographic Location</th>
                  <th className="py-2.5 px-4 text-right">Referer Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] text-slate-650 dark:text-slate-350">
                {recentClicks.map((click, idx) => (
                  <tr key={click._id || idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.005] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-400">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono select-all">
                      {click.ip}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-250">{click.device}</span>
                      <span className="text-slate-400 font-medium"> / {click.browser} / {click.os}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-250">{click.country}</span>
                      <span className="text-slate-400 font-medium">, {click.city}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-500">
                      {click.referer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDetail;
