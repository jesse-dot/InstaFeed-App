import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import './SetupModal.css';

interface SetupModalProps {
  onComplete: (data: {
    username: string;
    fullName: string;
    bio: string;
  }) => Promise<void>;
  onClose?: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onComplete, onClose }) => {
  const { user: clerkUser } = useUser();
  const [username, setUsername] = useState(
    clerkUser?.username || 
    clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || 
    ''
  );
  const [fullName, setFullName] = useState(clerkUser?.fullName || '');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 30) {
      setError('Username cannot exceed 30 characters');
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onComplete({
        username: username.trim(),
        fullName: fullName.trim(),
        bio: bio.trim(),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to complete setup. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="setup-modal-overlay">
      <div className="setup-modal">
        <div className="setup-modal-header">
          <h2>Complete Your Profile</h2>
          <p>Set up your InstaFeed profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="setup-avatar-section">
            <img
              src={clerkUser?.imageUrl || '/default-avatar.png'}
              alt="Profile"
              className="setup-avatar"
            />
            <p className="setup-avatar-note">
              Your profile picture is synced from your login provider
            </p>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <div className="setup-form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Choose a unique username"
              maxLength={30}
              required
              disabled={loading}
            />
            <span className="setup-input-hint">
              This will be your unique identifier on InstaFeed
            </span>
          </div>

          <div className="setup-form-group">
            <label htmlFor="fullName">Display Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your display name"
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="setup-form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={150}
              rows={3}
              disabled={loading}
            />
            <span className="setup-char-count">{bio.length}/150</span>
          </div>

          <div className="setup-actions">
            <button
              type="submit"
              className="setup-submit-btn"
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupModal;
