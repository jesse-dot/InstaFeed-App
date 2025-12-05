const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and MP4 are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, upload.single('media'), [
  body('caption').optional().trim().isLength({ max: 2200 }),
  body('filter').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file && !req.body.mediaUrl) {
      return res.status(400).json({ message: 'Media file or URL is required' });
    }

    const { caption, filter, location, mediaUrl, mediaType } = req.body;

    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    if (req.file) {
      finalMediaUrl = `/uploads/${req.file.filename}`;
      finalMediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const post = await Post.create({
      user: req.user._id,
      mediaUrl: finalMediaUrl,
      mediaType: finalMediaType || 'image',
      caption: caption || '',
      filter: filter || 'none',
      location: location || ''
    });

    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/feed
// @desc    Get feed posts from followed users (prioritized by likes)
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts from followed users and own posts
    const followingIds = [...req.user.following, req.user._id];

    const posts = await Post.aggregate([
      {
        $match: {
          user: { $in: followingIds },
          isArchived: false
        }
      },
      {
        $addFields: {
          likesCount: { $size: '$likes' }
        }
      },
      {
        $sort: { likesCount: -1, createdAt: -1 }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Populate user details
    await Post.populate(posts, {
      path: 'user',
      select: 'username fullName profilePicture'
    });

    const total = await Post.countDocuments({
      user: { $in: followingIds },
      isArchived: false
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/explore
// @desc    Get explore posts (public posts)
// @access  Public
router.get('/explore', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.aggregate([
      { $match: { isArchived: false } },
      { $addFields: { likesCount: { $size: '$likes' } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    await Post.populate(posts, {
      path: 'user',
      select: 'username fullName profilePicture'
    });

    const total = await Post.countDocuments({ isArchived: false });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get explore error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      user: req.params.userId,
      isArchived: false
    })
      .populate('user', 'username fullName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      user: req.params.userId,
      isArchived: false
    });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username fullName profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username fullName profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like a post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already liked
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    post.likes.push(req.user._id);
    await post.save();

    // Create notification if not liking own post
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'like',
        post: post._id,
        message: `${req.user.username} liked your post`
      });
    }

    res.json({
      success: true,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/unlike
// @desc    Unlike a post
// @access  Private
router.post('/:id/unlike', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if not liked
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Post not liked yet' });
    }

    post.likes = post.likes.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({
      success: true,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/save
// @desc    Save a post
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already saved
    if (req.user.savedPosts.includes(post._id)) {
      return res.status(400).json({ message: 'Post already saved' });
    }

    req.user.savedPosts.push(post._id);
    await req.user.save();

    res.json({
      success: true,
      message: 'Post saved'
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/unsave
// @desc    Unsave a post
// @access  Private
router.post('/:id/unsave', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if not saved
    if (!req.user.savedPosts.includes(post._id)) {
      return res.status(400).json({ message: 'Post not saved' });
    }

    req.user.savedPosts = req.user.savedPosts.filter(
      id => id.toString() !== post._id.toString()
    );
    await req.user.save();

    res.json({
      success: true,
      message: 'Post unsaved'
    });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/saved
// @desc    Get saved posts
// @access  Private
router.get('/saved/list', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedPosts',
        populate: {
          path: 'user',
          select: 'username fullName profilePicture'
        }
      });

    res.json({
      success: true,
      posts: user.savedPosts
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    // Remove from saved posts
    await User.updateMany(
      { savedPosts: post._id },
      { $pull: { savedPosts: post._id } }
    );

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
