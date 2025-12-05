import React, { useState, useEffect, useCallback } from 'react';
import { postApi } from '../../services/api';
import { Post } from '../../types';
import PostCard from '../../components/Post/PostCard';
import { useCurrentUser } from '../../context/UserContext';
import './Feed.css';

const Feed: React.FC = () => {
  const { currentUser, syncUser, loading: userLoading } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setNeedsSync(true);
    }
  }, [userLoading, currentUser]);

  const handleSyncUser = async () => {
    try {
      await syncUser();
      setNeedsSync(false);
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const response = await postApi.getFeed(page);
      const newPosts = response.data.posts;
      
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }, [page, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [fetchPosts, currentUser]);

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (userLoading) {
    return <div className="feed-loading">Loading...</div>;
  }

  if (needsSync) {
    return (
      <div className="feed-sync">
        <h2>Welcome to InstaFeed!</h2>
        <p>Please complete your profile setup to continue.</p>
        <button onClick={handleSyncUser} className="sync-btn">
          Complete Setup
        </button>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="feed-posts">
        {loading && posts.length === 0 ? (
          <div className="feed-loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <h3>Your Feed is Empty</h3>
            <p>Follow some users to see their posts here!</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onPostDelete={handlePostDelete}
              />
            ))}
            {hasMore && (
              <button onClick={loadMore} className="load-more-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>

      <aside className="feed-sidebar">
        {currentUser && (
          <div className="sidebar-profile">
            <img
              src={currentUser.profilePicture || '/default-avatar.png'}
              alt={currentUser.username}
              className="sidebar-avatar"
            />
            <div className="sidebar-user-info">
              <span className="sidebar-username">{currentUser.username}</span>
              <span className="sidebar-fullname">{currentUser.fullName}</span>
            </div>
          </div>
        )}
        <div className="sidebar-suggestions">
          <h4>Suggestions For You</h4>
          <p className="sidebar-note">Start following people to see posts in your feed!</p>
        </div>
      </aside>
    </div>
  );
};

export default Feed;
