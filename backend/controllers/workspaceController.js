import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

/**
 * @desc    Create a new collaborative workspace
 * @route   POST /api/workspaces
 * @access  Private
 */
export const createWorkspace = async (req, res, next) => {
  const { name } = req.body;
  const ownerId = req.user._id;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      ownerId,
      members: [{ userId: ownerId, role: 'owner' }]
    });

    // Automatically set as active workspace for the user
    const user = await User.findById(ownerId);
    if (user) {
      user.currentWorkspaceId = workspace._id;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Team Workspace created successfully',
      workspace
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's workspaces (both owned and member of)
 * @route   GET /api/workspaces
 * @access  Private
 */
export const getMyWorkspaces = async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Find all workspaces where current user is a member
    const workspaces = await Workspace.find({
      'members.userId': userId
    });

    res.json({
      success: true,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Switch/Select active workspace
 * @route   POST /api/workspaces/select/:id
 * @access  Private
 */
export const selectWorkspace = async (req, res, next) => {
  const userId = req.user._id;
  const workspaceId = req.params.id;

  try {
    let activeWorkspace = null;

    if (workspaceId === 'personal') {
      // Switched back to personal workspace
      const user = await User.findById(userId);
      if (user) {
        user.currentWorkspaceId = null;
        await user.save();
      }
      return res.json({
        success: true,
        message: 'Switched to Personal Workspace',
        currentWorkspaceId: null
      });
    }

    // Verify member permissions
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found or unauthorized access'
      });
    }

    const user = await User.findById(userId);
    if (user) {
      user.currentWorkspaceId = workspace._id;
      await user.save();
      activeWorkspace = workspace;
    }

    res.json({
      success: true,
      message: `Switched to Workspace: ${workspace.name}`,
      currentWorkspaceId: workspace._id,
      workspace: activeWorkspace
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite collaborative member to workspace
 * @route   POST /api/workspaces/:id/invite
 * @access  Private (Owner/Editor only)
 */
export const inviteMember = async (req, res, next) => {
  const userId = req.user._id;
  const workspaceId = req.params.id;
  const { email, role = 'editor' } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email of collaborator' });
    }

    // Find the workspace
    const workspace = await Workspace.findOne({ _id: workspaceId });
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Check if the current user is owner or editor
    const currentUserMember = workspace.members.find(m => String(m.userId) === String(userId));
    if (!currentUserMember || (currentUserMember.role !== 'owner' && currentUserMember.role !== 'editor')) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only workspace owners/editors can invite.' });
    }

    // Find user to invite by email
    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: `No registered user found with email: ${email}. Collaborator must sign up first.`
      });
    }

    // Check if already a member
    const alreadyMember = workspace.members.some(m => String(m.userId) === String(userToInvite._id));
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    // Add member
    workspace.members.push({ userId: userToInvite._id, role });
    await workspace.save();

    res.json({
      success: true,
      message: `Successfully invited ${userToInvite.name} to workspace!`,
      members: workspace.members
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get members of a workspace
 * @route   GET /api/workspaces/:id/members
 * @access  Private
 */
export const getWorkspaceMembers = async (req, res, next) => {
  const userId = req.user._id;
  const workspaceId = req.params.id;

  try {
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.userId': userId
    });

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found or unauthorized' });
    }

    // Hydrate members list with user details
    const hydratedMembers = [];
    for (const member of workspace.members) {
      const user = await User.findById(member.userId).select('name email');
      if (user) {
        hydratedMembers.push({
          userId: member.userId,
          role: member.role,
          name: user.name,
          email: user.email
        });
      }
    }

    res.json({
      success: true,
      members: hydratedMembers
    });
  } catch (error) {
    next(error);
  }
};
