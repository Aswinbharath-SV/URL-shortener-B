import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Mail, 
  Shield, 
  Briefcase, 
  ChevronRight, 
  UserCheck,
  CheckCircle,
  Building,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeamWorkspaceManager = ({ activeWorkspaceId, onWorkspaceChanged }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const notify = useNotification();

  const fetchWorkspacesData = async () => {
    try {
      const res = await api.get('/workspaces');
      if (res.data && res.data.success) {
        setWorkspaces(res.data.workspaces || []);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  const fetchMembersData = async () => {
    if (!activeWorkspaceId || activeWorkspaceId === 'personal') {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/workspaces/${activeWorkspaceId}/members`);
      if (res.data && res.data.success) {
        setMembers(res.data.members || []);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspacesData();
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchMembersData();
  }, [activeWorkspaceId]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post('/workspaces', { name: workspaceName });
      if (res.data && res.data.success) {
        notify('Team Workspace created successfully!', 'success');
        setWorkspaceName('');
        await fetchWorkspacesData();
        // Switch to the newly created workspace
        onWorkspaceChanged(res.data.workspace._id, res.data.workspace);
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create workspace', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleInviteCollaborator = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspaceId || activeWorkspaceId === 'personal') return;

    setInviting(true);
    try {
      const res = await api.post(`/workspaces/${activeWorkspaceId}/invite`, {
        email: inviteEmail,
        role: inviteRole
      });
      if (res.data && res.data.success) {
        notify('Collaborator invited successfully!', 'success');
        setInviteEmail('');
        fetchMembersData();
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to invite collaborator. Make sure they are registered first.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleSelectWorkspace = async (id) => {
    try {
      const res = await api.post(`/workspaces/select/${id}`);
      if (res.data && res.data.success) {
        notify(res.data.message, 'success');
        onWorkspaceChanged(id === 'personal' ? 'personal' : res.data.currentWorkspaceId, res.data.workspace || null);
      }
    } catch (err) {
      notify('Failed to switch workspace', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Workspace Switcher & Creator */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4 flex items-center gap-2">
            <Building className="w-4.5 h-4.5 text-indigo-500" />
            Switch Active Workspace
          </h3>

          <div className="space-y-2">
            {/* Personal Workspace */}
            <button
              onClick={() => handleSelectWorkspace('personal')}
              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                !activeWorkspaceId || activeWorkspaceId === 'personal'
                  ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold font-outfit">Personal Workspace</p>
                  <p className="text-[9px] text-slate-400">Your private links and graphs</p>
                </div>
              </div>
              {(!activeWorkspaceId || activeWorkspaceId === 'personal') && (
                <CheckCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
              )}
            </button>

            {/* Team Workspaces */}
            {workspaces.map((ws) => (
              <button
                key={ws._id}
                onClick={() => handleSelectWorkspace(ws._id)}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  activeWorkspaceId === ws._id
                    ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold font-outfit truncate max-w-[120px]">{ws.name}</p>
                    <p className="text-[9px] text-slate-400">{ws.members.length} members sharing links</p>
                  </div>
                </div>
                {activeWorkspaceId === ws._id && (
                  <CheckCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Create Workspace Form */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
          <h3 className="text-sm font-bold font-outfit mb-4 flex items-center gap-2">
            <Plus className="w-4.5 h-4.5 text-indigo-500" />
            Create Team Workspace
          </h3>

          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 mb-1 uppercase tracking-wider">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Katomaran Marketing"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {creating ? 'Creating...' : 'Create Workspace'}
            </button>
          </form>
        </div>
      </div>

      {/* Column 2 & 3: Invites & Member Listings */}
      <div className="lg:col-span-2 space-y-6">
        {!activeWorkspaceId || activeWorkspaceId === 'personal' ? (
          <div className="h-full rounded-2xl border border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center p-12 text-slate-400 bg-white dark:bg-[#0b0f19]/20">
            <Briefcase className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-4 animate-pulse" />
            <h4 className="text-sm font-bold font-outfit text-slate-900 dark:text-white">Personal Workspace Active</h4>
            <p className="text-xs text-slate-450 mt-1 max-w-xs text-center">
              Invite options are only active inside Team Workspaces. Switch to or create a Team Workspace on the left.
            </p>
          </div>
        ) : (
          <>
            {/* Invite Form */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
              <h3 className="text-sm font-bold font-outfit mb-4 flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5 text-indigo-500" />
                Invite Team Collaborator
              </h3>

              <form onSubmit={handleInviteCollaborator} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter registered user email address..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl focus:border-indigo-500 focus:outline-none text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 bg-slate-50 dark:bg-[#070a14] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="editor">Editor (Write)</option>
                    <option value="viewer">Viewer (Read)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
                  >
                    {inviting ? 'Inviting...' : 'Invite'}
                  </button>
                </div>
              </form>
            </div>

            {/* Members List */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0f19]/40 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold font-outfit flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-indigo-500" />
                    Collaborators Registry
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Active users who have shared access to links and stats</p>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  {members.length} Members
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {members.map((member) => (
                    <div key={member.userId} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/10">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {member.name}
                            {member.role === 'owner' && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                                <Shield className="w-2.5 h-2.5" />
                                Owner
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-450 font-medium">{member.email}</p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                        member.role === 'owner'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : member.role === 'editor'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-450 border-transparent'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamWorkspaceManager;
