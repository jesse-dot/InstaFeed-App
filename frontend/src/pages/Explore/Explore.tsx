import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postApi } from '../../services/api';
import { Post } from '../../types';
import './Explore.css';

const Explore: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await postApi.getExplore(page, 20);
        
        if (page === 1) {
          setPosts(response.data.posts);
        } else {
          setPosts(prev => [...prev, ...response.data.posts]);
        }
        
        setHasMore(response.data.pagination.page < response.data.pagination.pages);
      } catch (error) {
        console.error('Error fetching explore posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="explore-container">
      <h1 className="explore-title">Explore</h1>
      
      {loading && posts.length === 0 ? (
        <div className="explore-loading">Loading...</div>
      ) : (
        <>
          <div className="explore-grid">
            {posts.map(post => (
              <Link to={`/post/${post._id}`} key={post._id} className="explore-post">
                {post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} className="explore-media" />
                ) : (
                  <img src={post.mediaUrl} alt="" className="explore-media" />
                )}
                <div className="explore-overlay">
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                </div>
              </Link>
            ))}
          </div>
          
          {hasMore && (
            <button onClick={loadMore} className="load-more-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
