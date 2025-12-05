const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

// Clerk middleware to require authentication
const requireAuth = ClerkExpressRequireAuth({});

// Middleware to get or create user from Clerk session
const getUserFromClerk = async (req, res, next) => {
  try {
    const clerkId = req.auth.userId;
    
    if (!clerkId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Find user by Clerk ID
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      // User will be created through webhook or user routes
      req.user = null;
      req.clerkId = clerkId;
    } else {
      req.user = user;
      req.clerkId = clerkId;
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Combined middleware for protected routes
const protect = [requireAuth, getUserFromClerk];

// Optional auth - doesn't fail if not authenticated
const optionalAuth = async (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      const user = await User.findOne({ clerkId: req.auth.userId });
      req.user = user;
      req.clerkId = req.auth.userId;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  requireAuth,
  getUserFromClerk,
  protect,
  optionalAuth
};
