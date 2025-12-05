import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Grid, Bookmark, Settings } from 'lucide-react';
import { userApi, postApi } from '../../services/api';
import { useCurrentUser } from '../../context/UserContext';
import { User, Post } from '../../types';
import './Profile.css';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { currentUser, updateProfile } = useCurrentUser();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    website: '',
  });

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        const userResponse = await userApi.getUser(username);
        setUser(userResponse.data.user);
        
        setIsFollowing(
          currentUser?.following?.some(
            (f: any) => f._id === userResponse.data.user._id || f === userResponse.data.user._id
          ) || false
        );

        const postsResponse = await postApi.getUserPosts(userResponse.data.user._id);
        setPosts(postsResponse.data.posts);

        if (isOwnProfile) {
          const savedResponse = await postApi.getSavedPosts();
          setSavedPosts(savedResponse.data.posts);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!user) return;
    
    try {
      if (isFollowing) {
        await userApi.unfollowUser(user._id);
        setIsFollowing(false);
        setUser(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : null);
      } else {
        await userApi.followUser(user._id);
        setIsFollowing(true);
        setUser(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(editForm as any);
      setUser(prev => prev ? { ...prev, ...editForm } : null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        bio: user.bio || '',
        website: user.website || '',
      });
      setShowEditModal(true);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading...</div>;
  }

  if (!user) {
    return <div className="profile-not-found">User not found</div>;
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-avatar-container">
          <img
            src={user.profilePicture || '/default-avatar.png'}
            alt={user.username}
            className="profile-avatar"
          />
        </div>

        <div className="profile-info">
          <div className="profile-info-header">
            <h1 className="profile-username">{user.username}</h1>
            {isOwnProfile ? (
              <>
                <button onClick={openEditModal} className="edit-profile-btn">
                  Edit Profile
                </button>
                <Link to="/settings" className="settings-btn">
                  <Settings size={24} />
                </Link>
              </>
            ) : (
              <button
                onClick={handleFollow}
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="profile-stats">
            <span><strong>{posts.length}</strong> posts</span>
            <span><strong>{user.followersCount}</strong> followers</span>
            <span><strong>{user.followingCount}</strong> following</span>
          </div>

          <div className="profile-bio">
            {user.fullName && <h2 className="profile-fullname">{user.fullName}</h2>}
            {user.bio && <p className="profile-bio-text">{user.bio}</p>}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="profile-website">
                {user.website}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid size={12} /> POSTS
        </button>
        {isOwnProfile && (
          <button
            className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={12} /> SAVED
          </button>
        )}
      </div>

      <div className="profile-posts-grid">
        {(activeTab === 'posts' ? posts : savedPosts).map(post => (
          <Link to={`/post/${post._id}`} key={post._id} className="profile-post">
            {post.mediaType === 'video' ? (
              <video src={post.mediaUrl} className="profile-post-media" />
            ) : (
              <img src={post.mediaUrl} alt="" className="profile-post-media" />
            )}
            <div className="profile-post-overlay">
              <span>❤️ {post.likesCount}</span>
              <span>💬 {post.commentsCount}</span>
            </div>
          </Link>
        ))}
      </div>

      {(activeTab === 'posts' ? posts : savedPosts).length === 0 && (
        <div className="profile-no-posts">
          <p>{activeTab === 'posts' ? 'No posts yet' : 'No saved posts'}</p>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  maxLength={150}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
