const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required']
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters']
  },
  filter: {
    type: String,
    default: 'none'
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  location: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Extract hashtags from caption
postSchema.pre('save', function(next) {
  if (this.caption) {
    const hashtagRegex = /#(\w+)/g;
    const matches = this.caption.match(hashtagRegex);
    if (matches) {
      this.hashtags = matches.map(tag => tag.slice(1).toLowerCase());
    }
  }
  next();
});

// Get likes count
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Get comments count
postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// Index for efficient queries
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
