import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_passkey_123_abc_xyz_hackathon_99', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  const { name, email, password, companyName, jobTitle, monthlyVolume, workspaceName } = req.body;

  console.log(`[AUTH] Registration attempt received for email: ${email}`);

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.warn(`[AUTH] Registration failed: User with email ${email} already exists.`);
      return res.status(400).json({
        success: false,
        message: 'A user with that email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      companyName: companyName || '',
      jobTitle: jobTitle || '',
      monthlyVolume: monthlyVolume || '',
    });

    if (user) {
      console.log(`[AUTH] User created successfully in database: ${email} (ID: ${user._id})`);
      
      // Automatically create workspace if provided
      if (workspaceName) {
        try {
          console.log(`[AUTH] Creating default workspace "${workspaceName}" for user: ${email}`);
          const workspace = await Workspace.create({
            name: workspaceName,
            ownerId: user._id,
            members: [{ userId: user._id, role: 'owner' }]
          });
          user.currentWorkspaceId = workspace._id;
          await user.save();
          console.log(`[AUTH] Workspace created and assigned (ID: ${workspace._id})`);
        } catch (wsErr) {
          console.error('[AUTH] Failed to create default workspace during signup:', wsErr.message);
        }
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currentWorkspaceId: user.currentWorkspaceId || null,
        },
      });
    } else {
      console.warn(`[AUTH] Registration failed: Invalid user data received for email: ${email}`);
      res.status(400).json({ success: false, message: 'Invalid user data received' });
    }
  } catch (error) {
    console.error(`[AUTH] Unhandled error during user registration for ${email}:`, error);
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.json({
      success: true,
      message: 'Logged in successfully',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currentWorkspaceId: user.currentWorkspaceId || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        currentWorkspaceId: req.user.currentWorkspaceId || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
