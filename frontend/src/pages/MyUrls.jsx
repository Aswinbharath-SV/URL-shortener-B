import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import urlService from '../services/urlService';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import VoiceAliasModal from '../components/VoiceAliasModal';
import QrCustomizer from '../components/QrCustomizer';
import TeamWorkspaceManager from './TeamWorkspaceManager';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Copy, 
  ExternalLink, 
  QrCode, 
  BarChart3, 
  Edit3, 
  Trash2, 
  Grid, 
  List,
  Download,
  Upload,
  X,
  Sparkles,
  Power,
  RefreshCw,
  FileSpreadsheet,
  Briefcase,
  ArrowRightLeft,
  Users,
  Check,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyUrls = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Searching, Filtering, Sorting States
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modals States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  
  // Custom Modals States
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [qrCustomizerOpen, setQrCustomizerOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  // AI Suggestions states
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [suggesting, setSuggesting] = useState(false);

  // Workspace scopes states
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('personal');
  const [activeWorkspaceName, setActiveWorkspaceName] = useState('Personal Workspace');
  const [workspaces, setWorkspaces] = useState([]);

  // Modal active records
  const [activeUrlRecord, setActiveUrlRecord] = useState(null);

  // Create form states
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlDesc, setUrlDesc] = useState('');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [clickLimit, setClickLimit] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit form states
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editClickLimit, setEditClickLimit] = useState('');
  const [editFallbackUrl, setEditFallbackUrl] = useState('');
  const [editUtmSource, setEditUtmSource] = useState('');
  const [editUtmMedium, setEditUtmMedium] = useState('');
  const [editUtmCampaign, setEditUtmCampaign] = useState('');
  const [editAdvancedOpen, setEditAdvancedOpen] = useState(false);

  // Bulk form states
  const [csvText, setCsvText] = useState('');
  const [bulkPreview, setBulkPreview] = useState([]);

  const notify = useNotification();
  const { user, reloadUser } = useAuth();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      if (res.data && res.data.success) {
        setWorkspaces(res.data.workspaces || []);
      }
    } catch (err) {
      console.error('Workspaces loading failed:', err);
    }
  };

  const fetchUrls = async () => {
    try {
      const res = await urlService.getMyUrls({
        search,
        sortBy,
        isActive: isActiveFilter
      });
      if (res && res.success) {
        setUrls(res.urls || []);
      }
    } catch (err) {
      console.error(err);
      notify('Failed to retrieve link database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    if (user) {
      setActiveWorkspaceId(user.currentWorkspaceId || 'personal');
    }
  }, [user]);

  useEffect(() => {
    if (workspaces.length > 0 && activeWorkspaceId !== 'personal') {
      const found = workspaces.find(w => w._id === activeWorkspaceId);
      if (found) {
        setActiveWorkspaceName(found.name);
      }
    } else {
      setActiveWorkspaceName('Personal Workspace');
    }
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    fetchUrls();
  }, [search, sortBy, isActiveFilter, activeWorkspaceId]);

  const handleWorkspaceSelect = async (id) => {
    try {
      setLoading(true);
      const res = await api.post(`/workspaces/select/${id}`);
      if (res.data && res.data.success) {
        setActiveWorkspaceId(id);
        reloadUser();
      }
    } catch (err) {
      notify('Failed to switch workspace context', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceChange = (id, workspaceObj) => {
    setActiveWorkspaceId(id);
    setActiveWorkspaceName(workspaceObj ? workspaceObj.name : 'Personal Workspace');
    fetchWorkspaces();
    reloadUser();
  };

  const fetchAiSuggestions = async () => {
    if (!longUrl || !longUrl.startsWith('http')) return;
    setSuggesting(true);
    try {
      const res = await api.get(`/urls/ai-suggest?url=${encodeURIComponent(longUrl)}`);
      if (res.data && res.data.success) {
        setAiSuggestions(res.data.suggestions);
        notify('AI suggestions generated!', 'success');
      }
    } catch (err) {
      notify('AI suggestion engine failed', 'error');
    } finally {
      setSuggesting(false);
    }
  };

  const handleCopyLink = (code) => {
    const shortUrl = `${window.location.origin.replace('5173', '5000')}/r/${code}`;
    navigator.clipboard.writeText(shortUrl);
    notify('Short URL copied to clipboard!', 'success');
  };

  // 1. CREATE URL TRIGGER
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    setSubmitting(true);
    try {
      const res = await urlService.shorten({
        originalUrl: longUrl,
        customAlias: customAlias || undefined,
        title: urlTitle || undefined,
        description: urlDesc || undefined,
        password: password || undefined,
        expiresAt: expiresAt || undefined,
        clickLimit: clickLimit !== '' ? Number(clickLimit) : undefined,
        fallbackUrl: fallbackUrl || undefined,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined
      });

      if (res && res.success) {
        notify('Link shortened successfully!', 'success');
        setLongUrl('');
        setCustomAlias('');
        setUrlTitle('');
        setUrlDesc('');
        setPassword('');
        setExpiresAt('');
        setClickLimit('');
        setFallbackUrl('');
        setUtmSource('');
        setUtmMedium('');
        setUtmCampaign('');
        setAdvancedOpen(false);
        setCreateModalOpen(false);
        fetchUrls();
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to shorten URL', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. EDIT URL TRIGGER
  const openEditModal = (url) => {
    setActiveUrlRecord(url);
    setEditUrl(url.originalUrl);
    setEditTitle(url.title || '');
    setEditDesc(url.description || '');
    setEditIsActive(url.isActive);
    setEditPassword(url.password || '');
    
    let formattedDate = '';
    if (url.expiresAt) {
      const date = new Date(url.expiresAt);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      formattedDate = localDate.toISOString().substring(0, 16);
    }
    setEditExpiresAt(formattedDate);
    setEditClickLimit(url.clickLimit !== null && url.clickLimit !== undefined ? url.clickLimit : '');
    setEditFallbackUrl(url.fallbackUrl || '');
    setEditUtmSource(url.utmSource || '');
    setEditUtmMedium(url.utmMedium || '');
    setEditUtmCampaign(url.utmCampaign || '');
    setEditAdvancedOpen(false);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeUrlRecord) return;

    setSubmitting(true);
    try {
      const res = await urlService.update(activeUrlRecord._id, {
        originalUrl: editUrl,
        title: editTitle,
        description: editDesc,
        isActive: editIsActive,
        password: editPassword,
        expiresAt: editExpiresAt || null,
        clickLimit: editClickLimit !== '' ? Number(editClickLimit) : null,
        fallbackUrl: editFallbackUrl,
        utmSource: editUtmSource,
        utmMedium: editUtmMedium,
        utmCampaign: editUtmCampaign
      });

      if (res && res.success) {
        notify('Link details updated successfully', 'success');
        setEditModalOpen(false);
        fetchUrls();
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update link', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. DELETE URL TRIGGER
  const handleDeleteUrl = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortened link? All associated analytics metrics will be deleted forever.')) return;
    
    try {
      const res = await urlService.delete(id);
      if (res && res.success) {
        notify('Shortened link deleted successfully', 'success');
        fetchUrls();
      }
    } catch (err) {
      notify('Failed to delete shortened link', 'error');
    }
  };

  // 4. OPEN QR MODAL
  const openQrModal = (url) => {
    setActiveUrlRecord(url);
    setQrCustomizerOpen(true);
  };

  const handleSaveQrStyle = async (styles) => {
    try {
      setSubmitting(true);
      const res = await urlService.update(activeUrlRecord._id, {
        qrColor: styles.qrColor,
        qrBrandLogo: styles.qrBrandLogo,
        qrCodeDataUrl: styles.qrCodeDataUrl
      });
      if (res && res.success) {
        notify('Custom QR Brand Style saved successfully!', 'success');
        fetchUrls();
      }
    } catch (err) {
      notify('Failed to save branded QR styles', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. BULK CSV HANDLER
  const handleCsvTextChange = (e) => {
    const text = e.target.value;
    setCsvText(text);
    
    // Quick parse for visual review
    try {
      const lines = text.split('\n');
      const rows = [];
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(',').map(c => c.trim());
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = columns[idx] || '';
        });
        if (obj.originalurl) {
          rows.push(obj);
        }
      }
      setBulkPreview(rows);
    } catch (err) {
      setBulkPreview([]);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setSubmitting(true);
    try {
      const lines = csvText.split('\n');
      if (lines.length <= 1) {
        notify('CSV must contain a header row and at least one data row', 'error');
        setSubmitting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const urlsArray = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(',').map(c => c.trim());
        const rowObj = {};
        
        headers.forEach((header, index) => {
          rowObj[header] = columns[index] || '';
        });

        if (rowObj.originalurl) {
          urlsArray.push({
            originalUrl: rowObj.originalurl,
            customAlias: rowObj.customalias || undefined,
            title: rowObj.title || undefined,
            description: rowObj.description || undefined
          });
        }
      }

      if (urlsArray.length === 0) {
        notify('No valid URLs found in CSV text', 'error');
        setSubmitting(false);
        return;
      }

      const res = await urlService.bulkUpload(urlsArray);
      if (res && res.success) {
        notify(`Bulk Upload Complete! Shortened ${res.processedCount} URLs.`, 'success');
        if (res.failedCount > 0) {
          notify(`${res.failedCount} rows failed due to duplicate custom aliases.`, 'info');
        }
        setCsvText('');
        setBulkPreview([]);
        setBulkModalOpen(false);
        fetchUrls();
      }
    } catch (err) {
      notify('Failed to process bulk upload', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER AND CREATE BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight font-outfit text-slate-900 dark:text-white">
            Link Repository
          </h1>
          
          {/* Workspace Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-extrabold active:scale-95 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{activeWorkspaceName}</span>
              <ArrowRightLeft className="w-3 h-3 ml-0.5" />
            </button>
            
            {workspaceDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c101d] shadow-xl z-[999] py-2">
                <p className="px-4 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1.5">
                  Select Workspace
                </p>
                
                {/* Personal Option */}
                <button
                  onClick={() => {
                    handleWorkspaceSelect('personal');
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs font-bold transition-all flex items-center justify-between ${
                    activeWorkspaceId === 'personal'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                      : 'text-slate-650 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span>Personal Workspace</span>
                  {activeWorkspaceId === 'personal' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                </button>
                
                {/* Team Options */}
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      handleWorkspaceSelect(ws._id);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-all flex items-center justify-between ${
                      activeWorkspaceId === ws._id
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                        : 'text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate pr-2">{ws.name}</span>
                    {activeWorkspaceId === ws._id && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                  </button>
                ))}
                
                <div className="border-t border-slate-100 dark:border-white/5 mt-1.5 pt-1.5">
                  <button
                    onClick={() => {
                      setWorkspaceManagerOpen(true);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    Manage Teams & Members
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Button */}
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/5 rounded-xl text-xs font-semibold active:scale-95 transition-all shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            CSV Import
          </button>
          
          {/* Create Button */}
          <button
            onClick={() => {
              setAiSuggestions(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
            Shorten a URL
          </button>
        </div>
      </div>

      {/* 2. SEARCH, SORT, FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/30 backdrop-blur-xl shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, target URL, or short code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#080b13] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters and sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Sort By */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-[#080b13] px-3 py-2 border border-slate-200 dark:border-white/5 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="clicks">Clicks</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-[#080b13] px-3 py-2 border border-slate-200 dark:border-white/5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Grid/Table view toggler */}
          <div className="flex items-center border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-[#080b13] text-slate-400'}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-[#080b13] text-slate-400'}`}
              title="Grid card view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CORE LINKS LIST (TABLE OR GRID) */}
      {loading ? (
        /* Skeletons */
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl glass-panel animate-pulse bg-slate-200/50 dark:bg-slate-900/30"></div>
          ))}
        </div>
      ) : urls.length === 0 ? (
        /* Empty states search */
        <div className="p-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 text-center text-slate-400 bg-white dark:bg-[#0b0f19]/10">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-bold font-outfit text-slate-900 dark:text-white">No URLs Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try refining your search text or create a new shortened link to start tracking.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW MODE */
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400 font-bold bg-slate-50/50 dark:bg-white/[0.01]">
                  <th className="py-3.5 px-6">Link Profile</th>
                  <th className="py-3.5 px-6">Short Link</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-center">Clicks</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {urls.map((url) => (
                  <tr key={url._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-all">
                    {/* Column 1: Title & Description & Original link */}
                    <td className="py-4 px-6 max-w-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate">{url.title}</span>
                        {url.description && <span className="text-[10px] text-slate-400 truncate">{url.description}</span>}
                        <span className="text-[9px] text-indigo-500/70 dark:text-indigo-400/50 font-mono truncate mt-0.5 max-w-xs block" title={url.originalUrl}>
                          {url.originalUrl}
                        </span>
                      </div>
                    </td>
                    
                    {/* Column 2: Short Code */}
                    <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all">
                      {url.shortCode}
                    </td>

                    {/* Column 3: Active Status */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        url.isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${url.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {url.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Column 4: Clicks count */}
                    <td className="py-4 px-6 text-center font-bold text-slate-850 dark:text-slate-200">
                      {url.clicksCount.toLocaleString()}
                    </td>

                    {/* Column 5: Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(url.shortCode)}
                          className="p-1.5 rounded-lg hover:bg-slate-250 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Copy short link"
                        >
                          <Copy className="w-4.5 h-4.5" />
                        </button>

                        {/* View QR Code */}
                        <button
                          onClick={() => openQrModal(url)}
                          className="p-1.5 rounded-lg hover:bg-slate-250 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-4.5 h-4.5" />
                        </button>

                        {/* Link stats page */}
                        <Link
                          to={`/analytics/${url._id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-250 dark:hover:bg-slate-800/80 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Analytics details"
                        >
                          <BarChart3 className="w-4.5 h-4.5" />
                        </Link>

                        {/* Edit metadata */}
                        <button
                          onClick={() => openEditModal(url)}
                          className="p-1.5 rounded-lg hover:bg-slate-250 dark:hover:bg-slate-800/80 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit metadata"
                        >
                          <Edit3 className="w-4.5 h-4.5" />
                        </button>

                        {/* Delete URL */}
                        <button
                          onClick={() => handleDeleteUrl(url._id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete shortcode"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {urls.map((url) => (
            <motion.div
              layout
              key={url._id}
              className="p-6 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    url.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  }`}>
                    <span className={`h-1 w-1 rounded-full ${url.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {url.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md">
                    <span>{url.clicksCount} clicks</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-extrabold font-outfit text-slate-900 dark:text-white truncate">{url.title}</h3>
                  {url.description && <p className="text-[10px] text-slate-400 truncate mt-1">{url.description}</p>}
                  
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-[#070a13] border border-slate-100 dark:border-white/[0.02]">
                    <div className="flex items-center justify-between gap-4 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="truncate">r/{url.shortCode}</span>
                      <button
                        onClick={() => handleCopyLink(url.shortCode)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Copy short link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between border-t border-slate-150 dark:border-white/[0.04] pt-4 mt-6">
                <Link
                  to={`/analytics/${url._id}`}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  View Stats
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openQrModal(url)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-900 dark:hover:text-white"
                    title="QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(url)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-900 dark:hover:text-white"
                    title="Edit link"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUrl(url._id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-450 hover:text-rose-500"
                    title="Delete link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODALS OVERLAYS */}
      <AnimatePresence>
        
        {/* MODAL 1: CREATE SHORT URL LINK */}
        {createModalOpen && (
          <div 
            onClick={() => setCreateModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm z-[999] overflow-y-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c101d] shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Create Short URL
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Original URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={longUrl}
                      onChange={(e) => setLongUrl(e.target.value)}
                      placeholder="https://example-destination-long-link.com/details..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                      required
                    />
                    {longUrl && longUrl.startsWith('http') && (
                      <button
                        type="button"
                        onClick={fetchAiSuggestions}
                        disabled={suggesting}
                        className="px-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-500/20 transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {suggesting ? '...' : 'AI Suggest'}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Suggestions Pill Bar */}
                {aiSuggestions && (
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] space-y-2 animate-fadeIn">
                    <p className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Alias Suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(aiSuggestions).map(([type, val]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setCustomAlias(val)}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c101d] hover:border-indigo-500 text-slate-700 dark:text-slate-300 active:scale-95 transition-all"
                          title={`${type.toUpperCase()} Style`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      Custom Alias (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        placeholder="e.g. promo-code"
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setVoiceModalOpen(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                        title="Voice Alias Generator"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      Link Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      placeholder="e.g. Summer Promo"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Link Description (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={urlDesc}
                    onChange={(e) => setUrlDesc(e.target.value)}
                    placeholder="Provide a description details for internal notes..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* Advanced Configurations Section */}
                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-4">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className="flex items-center justify-between w-full text-left text-xs font-bold text-indigo-650 dark:text-indigo-400 py-1 hover:underline"
                  >
                    <span>{advancedOpen ? 'Hide' : 'Show'} Advanced Settings (Password, Expiry, UTMs)</span>
                    <span className="text-[10px]">{advancedOpen ? '▲' : '▼'}</span>
                  </button>
                </div>

                {advancedOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Password Protection */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Password Gate
                        </label>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="e.g. secret123"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      {/* Expiration Date */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Expiration Date
                        </label>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Click Limit */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Click Limit Threshold
                        </label>
                        <input
                          type="number"
                          value={clickLimit}
                          onChange={(e) => setClickLimit(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Fallback URL */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Fallback / Expired Redirect
                        </label>
                        <input
                          type="url"
                          value={fallbackUrl}
                          onChange={(e) => setFallbackUrl(e.target.value)}
                          placeholder="https://backup.com"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/[0.04] pt-3">
                      <p className="text-[9px] font-bold text-slate-450 uppercase mb-2">Campaign UTM Tags Auto-Appender</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <input
                            type="text"
                            value={utmSource}
                            onChange={(e) => setUtmSource(e.target.value)}
                            placeholder="Source (e.g. email)"
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={utmMedium}
                            onChange={(e) => setUtmMedium(e.target.value)}
                            placeholder="Medium (e.g. social)"
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={utmCampaign}
                            onChange={(e) => setUtmCampaign(e.target.value)}
                            placeholder="Campaign (e.g. promo)"
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Shortening...' : 'Generate Short Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 2: EDIT URL METADATA */}
        {editModalOpen && (
          <div 
            onClick={() => setEditModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm z-[999] overflow-y-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c101d] shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">
                  Edit Link Details
                </h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Destination URL
                  </label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Link Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Link Description
                  </label>
                  <textarea
                    rows="2"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* Toggle Active Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#080c16] border border-slate-100 dark:border-white/[0.02]">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Redirect Activity</p>
                    <p className="text-[9px] text-slate-400">If inactive, visitors will see a 404 page</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                      editIsActive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20' 
                        : 'bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-transparent'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {editIsActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Advanced Configurations Section */}
                <div className="border-t border-slate-100 dark:border-white/[0.04] pt-4">
                  <button
                    type="button"
                    onClick={() => setEditAdvancedOpen(!editAdvancedOpen)}
                    className="flex items-center justify-between w-full text-left text-xs font-bold text-indigo-650 dark:text-indigo-400 py-1 hover:underline"
                  >
                    <span>{editAdvancedOpen ? 'Hide' : 'Show'} Advanced Settings (Password, Expiry, UTMs)</span>
                    <span className="text-[10px]">{editAdvancedOpen ? '▲' : '▼'}</span>
                  </button>
                </div>

                {editAdvancedOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Password Protection */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Password Gate
                        </label>
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="e.g. secret123"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      {/* Expiration Date */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Expiration Date
                        </label>
                        <input
                          type="datetime-local"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Click Limit */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Click Limit Threshold
                        </label>
                        <input
                          type="number"
                          value={editClickLimit}
                          onChange={(e) => setEditClickLimit(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Fallback URL */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          Fallback / Expired Redirect
                        </label>
                        <input
                          type="url"
                          value={editFallbackUrl}
                          onChange={(e) => setEditFallbackUrl(e.target.value)}
                          placeholder="https://backup.com"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[11px] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/[0.04] pt-3">
                      <p className="text-[9px] font-bold text-slate-450 uppercase mb-2">Campaign UTM Tags Auto-Appender</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <input
                            type="text"
                            value={editUtmSource}
                            onChange={(e) => setEditUtmSource(e.target.value)}
                            placeholder="Source (e.g. email)"
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editUtmMedium}
                            onChange={(e) => setEditUtmMedium(e.target.value)}
                            placeholder="Medium (e.g. social)"
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={editUtmCampaign}
                            onChange={(e) => setEditUtmCampaign(e.target.value)}
                            placeholder="Campaign (e.g. promo)"
                            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 4: BULK CSV UPLOAD */}
        {bulkModalOpen && (
          <div 
            onClick={() => setBulkModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm z-[999] overflow-y-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c101d] shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  CSV Bulk Importer
                </h3>
                <button
                  onClick={() => setBulkModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-300 text-[10px] leading-relaxed mb-6 font-medium">
                <strong>Format Guidelines:</strong> Paste raw comma-separated values (CSV) containing headers in the first row. Required column: <code>originalUrl</code>. Optional columns: <code>customAlias</code>, <code>title</code>, <code>description</code>.
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Paste CSV Data
                  </label>
                  <textarea
                    rows="6"
                    value={csvText}
                    onChange={handleCsvTextChange}
                    placeholder="originalUrl,customAlias,title,description&#10;https://google.com,google-home,Google Search,Main Search Engine&#10;https://github.com,git-portal,GitHub Code,Developer Coding Hub"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-[10px] text-slate-900 dark:text-white font-mono resize-none leading-relaxed"
                    required
                  />
                </div>

                {/* Real-time Row Preview Table */}
                {bulkPreview.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold text-slate-450 uppercase mb-2">Live Row Preview (First 5 rows)</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                      <table className="w-full text-left text-[9px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-white/5 text-slate-400 font-bold border-b border-slate-200/50 dark:border-white/5">
                            <th className="py-2 px-3">Original URL</th>
                            <th className="py-2 px-3">Alias</th>
                            <th className="py-2 px-3">Title</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02]">
                          {bulkPreview.map((row, idx) => (
                            <tr key={idx} className="text-slate-650 dark:text-slate-300">
                              <td className="py-2 px-3 truncate max-w-xs">{row.originalurl}</td>
                              <td className="py-2 px-3 font-mono">{row.customalias || 'N/A'}</td>
                              <td className="py-2 px-3 truncate max-w-[80px]">{row.title || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText('');
                      setBulkPreview([]);
                      setBulkModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || bulkPreview.length === 0}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    {submitting ? 'Processing Upload...' : `Import ${bulkPreview.length} links`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Voice Recognition Modal */}
        <VoiceAliasModal
          isOpen={voiceModalOpen}
          onClose={() => setVoiceModalOpen(false)}
          onSuccess={(alias) => setCustomAlias(alias)}
        />

        {/* QR Customizer Designer Modal */}
        {qrCustomizerOpen && activeUrlRecord && (
          <QrCustomizer
            isOpen={qrCustomizerOpen}
            onClose={() => setQrCustomizerOpen(false)}
            qrCodeDataUrl={activeUrlRecord.qrCodeDataUrl}
            shortCode={activeUrlRecord.shortCode}
            onSaveStyle={handleSaveQrStyle}
          />
        )}

        {/* Team Workspace Manager overlay modal */}
        {workspaceManagerOpen && (
          <div 
            onClick={() => setWorkspaceManagerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/85 backdrop-blur-sm z-[999] overflow-y-auto flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl border border-slate-250 dark:border-white/5 bg-white dark:bg-[#0c101d] shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Team Workspace Manager
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Invite teammates and collaborate on link campaigns</p>
                </div>
                <button
                  onClick={() => setWorkspaceManagerOpen(false)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <TeamWorkspaceManager
                activeWorkspaceId={activeWorkspaceId}
                onWorkspaceChanged={handleWorkspaceChange}
              />
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default MyUrls;
