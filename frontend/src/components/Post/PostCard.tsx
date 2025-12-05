import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Bookmark, Send, MoreHorizontal } from 'lucide-react';
import { Post, Comment } from '../../types';
import { postApi, commentApi } from '../../services/api';
import { useCurrentUser } from '../../context/UserContext';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  onPostUpdate?: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate, onPostDelete }) => {
  const { currentUser } = useCurrentUser();
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?._id || '') || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [saved, setSaved] = useState(currentUser?.savedPosts?.includes(post._id) || false);
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    try {
      if (liked) {
        await postApi.unlikePost(post._id);
        setLikesCount(prev => prev - 1);
      } else {
        await postApi.likePost(post._id);
        setLikesCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await postApi.unsavePost(post._id);
      } else {
        await postApi.savePost(post._id);
      }
      setSaved(!saved);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await commentApi.addComment(post._id, comment);
      setComments(prev => [response.data.comment, ...prev]);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postApi.deletePost(post._id);
        onPostDelete?.(post._id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
    setShowMenu(false);
  };

  const renderCaption = (caption: string) => {
    // Convert hashtags to links
    return caption.split(/(\s+)/).map((word, index) => {
      if (word.startsWith('#')) {
        return (
          <Link key={index} to={`/hashtag/${word.slice(1)}`} className="hashtag">
            {word}
          </Link>
        );
      }
      return word;
    });
  };

  return (
    <article className="post-card">
      <header className="post-header">
        <Link to={`/profile/${post.user?.username}`} className="post-user">
          <img
            src={post.user?.profilePicture || '/default-avatar.png'}
            alt={post.user?.username}
            className="post-avatar"
          />
          <div className="post-user-info">
            <span className="post-username">{post.user?.username}</span>
            {post.location && <span className="post-location">{post.location}</span>}
          </div>
        </Link>
        {currentUser?._id === post.user?._id && (
          <div className="post-menu-container">
            <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="post-menu">
                <button onClick={handleDelete} className="post-menu-item delete">
                  Delete
                </button>
                <button onClick={() => setShowMenu(false)} className="post-menu-item">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="post-media">
        {post.mediaType === 'video' ? (
          <video src={post.mediaUrl} controls className="post-video" />
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || 'Post'}
            className={`post-image filter-${post.filter || 'none'}`}
          />
        )}
      </div>

      <div className="post-actions">
        <div className="post-actions-left">
          <button onClick={handleLike} className={`action-btn ${liked ? 'liked' : ''}`}>
            <Heart size={24} fill={liked ? '#ed4956' : 'none'} color={liked ? '#ed4956' : '#262626'} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="action-btn">
            <MessageCircle size={24} />
          </button>
          <button className="action-btn">
            <Send size={24} />
          </button>
        </div>
        <button onClick={handleSave} className={`action-btn ${saved ? 'saved' : ''}`}>
          <Bookmark size={24} fill={saved ? '#262626' : 'none'} />
        </button>
      </div>

      <div className="post-likes">
        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
      </div>

      {post.caption && (
        <div className="post-caption">
          <Link to={`/profile/${post.user?.username}`} className="caption-username">
            {post.user?.username}
          </Link>{' '}
          {renderCaption(post.caption)}
        </div>
      )}

      {comments.length > 0 && (
        <button
          className="view-comments-btn"
          onClick={() => setShowComments(!showComments)}
        >
          View all {comments.length} comments
        </button>
      )}

      {showComments && (
        <div className="comments-section">
          {comments.slice(0, 3).map((c: Comment) => (
            <div key={c._id} className="comment">
              <Link to={`/profile/${c.user?.username}`} className="comment-username">
                {c.user?.username}
              </Link>{' '}
              <span className="comment-text">{c.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="post-time">
        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
      </div>

      <form onSubmit={handleComment} className="comment-form">
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="comment-input"
        />
        <button
          type="submit"
          disabled={!comment.trim()}
          className="comment-submit"
        >
          Post
        </button>
      </form>
    </article>
  );
};

export default PostCard;
