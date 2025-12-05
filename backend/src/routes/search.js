const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');

// @route   GET /api/search
// @desc    Search users and hashtags
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = q.trim();
    const searchType = type || 'all';

    let results = {
      users: [],
      hashtags: [],
      posts: []
    };

    // Search users
    if (searchType === 'all' || searchType === 'users') {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username fullName profilePicture bio followersCount')
        .limit(20);

      results.users = users;
    }

    // Search hashtags
    if (searchType === 'all' || searchType === 'hashtags') {
      const hashtagQuery = query.startsWith('#') ? query.slice(1) : query;
      
      const hashtagPosts = await Post.aggregate([
        {
          $match: {
            hashtags: { $regex: hashtagQuery, $options: 'i' },
            isArchived: false
          }
        },
        { $unwind: '$hashtags' },
        {
          $match: {
            hashtags: { $regex: hashtagQuery, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$hashtags',
            postsCount: { $sum: 1 }
          }
        },
        { $sort: { postsCount: -1 } },
        { $limit: 20 }
      ]);

      results.hashtags = hashtagPosts.map(h => ({
        tag: h._id,
        postsCount: h.postsCount
      }));
    }

    // Search posts by caption
    if (searchType === 'posts') {
      const posts = await Post.find({
        caption: { $regex: query, $options: 'i' },
        isArchived: false
      })
        .populate('user', 'username fullName profilePicture')
        .sort({ createdAt: -1 })
        .limit(20);

      results.posts = posts;
    }

    res.json({
      success: true,
      query,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/hashtag/:tag
// @desc    Get posts by hashtag
// @access  Public
router.get('/hashtag/:tag', async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      hashtags: tag,
      isArchived: false
    })
      .populate('user', 'username fullName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      hashtags: tag,
      isArchived: false
    });

    res.json({
      success: true,
      hashtag: tag,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Hashtag search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const query = q.trim();

    // Get user suggestions
    const users = await User.find({
      $or: [
        { username: { $regex: `^${query}`, $options: 'i' } },
        { fullName: { $regex: `^${query}`, $options: 'i' } }
      ]
    })
      .select('username fullName profilePicture')
      .limit(5);

    // Get hashtag suggestions
    const hashtags = await Post.aggregate([
      {
        $match: {
          hashtags: { $regex: `^${query}`, $options: 'i' },
          isArchived: false
        }
      },
      { $unwind: '$hashtags' },
      {
        $match: {
          hashtags: { $regex: `^${query}`, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const suggestions = [
      ...users.map(u => ({
        type: 'user',
        id: u._id,
        username: u.username,
        fullName: u.fullName,
        profilePicture: u.profilePicture
      })),
      ...hashtags.map(h => ({
        type: 'hashtag',
        tag: h._id,
        postsCount: h.count
      }))
    ];

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
