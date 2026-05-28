import React from 'react';
import TeamWorkspaceManager from './TeamWorkspaceManager';
import { useAuth } from '../contexts/AuthContext';

const WorkspacePage = () => {
  const { user, reloadUser } = useAuth();
  const activeWorkspaceId = user?.currentWorkspaceId || 'personal';

  const handleWorkspaceChange = () => {
    // Reload user information to trigger state refresh on layout breadcrumbs/sidebar
    reloadUser();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-outfit bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
          Collaborative Workspaces
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Create workspaces, invite team members, assign editor/viewer roles, and share links
        </p>
      </div>

      <TeamWorkspaceManager
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceChanged={handleWorkspaceChange}
      />
    </div>
  );
};

export default WorkspacePage;
