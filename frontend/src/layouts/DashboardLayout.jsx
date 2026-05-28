import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../hooks/useNotification';
import api from '../services/api';
import { 
  Link2, 
  LayoutDashboard, 
  Layers, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  User as UserIcon,
  ChevronsUpDown,
  Users,
  Briefcase,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = () => {
  const { user, isAuthenticated, loading, logout, switchWorkspace } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const notify = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);

  const activeWorkspaceId = user?.currentWorkspaceId || 'personal';

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      if (res.data && res.data.success) {
        setWorkspaces(res.data.workspaces || []);
      }
    } catch (err) {
      console.error('Layout workspaces load failed:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, activeWorkspaceId]);

  const handleSwitchWorkspace = async (id) => {
    const res = await switchWorkspace(id);
    if (res && res.success) {
      notify(res.message, 'success');
    } else {
      notify(res.error || 'Failed to switch workspace', 'error');
    }
    setWorkspaceOpen(false);
  };

  const activeWorkspace = workspaces.find(w => w._id === activeWorkspaceId);
  const activeWorkspaceName = activeWorkspace ? activeWorkspace.name : 'Personal Workspace';

  // If auth is loading, render a beautiful full-screen loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/25 mb-4"
        >
          <Link2 className="w-7 h-7 text-white" />
        </motion.div>
        <span className="text-slate-400 text-sm tracking-wider font-semibold animate-pulse">
          CONFIGURING SECURE DASHBOARD...
        </span>
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Links', href: '/my-urls', icon: Layers },
    { name: 'Workspaces', href: '/workspaces', icon: Users },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] flex transition-colors duration-300">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0b0f19]/60 backdrop-blur-xl shrink-0 fixed inset-y-0 left-0 z-40">
        {/* Top Header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-200/60 dark:border-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
            <Link2 className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent font-outfit">
            SnipURL.
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logged In User profile strip */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="relative">
            <div 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
            >
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            </div>

            {/* Micro-profile Dropup Menu */}
            <AnimatePresence>
              {profileDropdownOpen && (
                <>
                  <div 
                    onClick={() => setProfileDropdownOpen(false)} 
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-14 left-0 right-0 z-50 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-xl p-1.5"
                  >
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* 2. DYNAMIC MAIN CONTAINER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-[#030712]/70 backdrop-blur-xl sticky top-0 z-30">
          
          {/* Left: Mobile hamburger & breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 lg:hidden rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <button
                  onClick={() => setWorkspaceOpen(!workspaceOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 rounded-full text-[10px] font-extrabold active:scale-95 transition-all"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{activeWorkspaceName}</span>
                  <ChevronsUpDown className="w-3 h-3 ml-0.5" />
                </button>
                
                {workspaceOpen && (
                  <>
                    <div 
                      onClick={() => setWorkspaceOpen(false)} 
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c101d] shadow-xl z-50 py-2">
                      <p className="px-4 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1.5">
                        Select Workspace
                      </p>
                      
                      {/* Personal Option */}
                      <button
                        onClick={() => handleSwitchWorkspace('personal')}
                        className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center justify-between ${
                          activeWorkspaceId === 'personal'
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                            : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>Personal Workspace</span>
                        {activeWorkspaceId === 'personal' && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                      </button>
                      
                      {/* Team Options */}
                      {workspaces.map((ws) => (
                        <button
                          key={ws._id}
                          onClick={() => handleSwitchWorkspace(ws._id)}
                          className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-all flex items-center justify-between ${
                            activeWorkspaceId === ws._id
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                              : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate pr-2">{ws.name}</span>
                          {activeWorkspaceId === ws._id && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                        </button>
                      ))}
                      
                      <div className="border-t border-slate-100 dark:border-white/5 mt-1.5 pt-1.5">
                        <Link
                          to="/workspaces"
                          onClick={() => setWorkspaceOpen(false)}
                          className="flex items-center gap-1.5 px-4 py-2 text-left text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <Users className="w-4 h-4" />
                          Manage Workspaces
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-400">/</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize font-outfit">
                {location.pathname.replace('/', '').replace('-', ' ') || 'overview'}
              </span>
            </div>
          </div>

          {/* Right: theme toggle and user initial */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Main Content Router Mount */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto relative overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* 3. MOBILE MENU SLIDE DRAWER OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />
            
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-white/5 p-6 flex flex-col justify-between z-50 lg:hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
                      <Link2 className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-base font-bold dark:text-white font-outfit">SnipURL</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="flex items-center gap-3 p-1 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-40">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
