import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchApi } from '../../services/api';
import { User } from '../../types';
import './Search.css';

interface Suggestion {
  type: 'user' | 'hashtag';
  id?: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  tag?: string;
  postsCount?: number;
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'hashtags'>('all');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; postsCount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await searchApi.getSuggestions(searchQuery);
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await searchApi.search(query, activeTab === 'all' ? undefined : activeTab);
      setUsers(response.data.results.users);
      setHashtags(response.data.results.hashtags);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === 'user' && suggestion.username) {
      navigate(`/profile/${suggestion.username}`);
    } else if (suggestion.type === 'hashtag' && suggestion.tag) {
      navigate(`/hashtag/${suggestion.tag}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setUsers([]);
    setHashtags([]);
    setSuggestions([]);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search users or #hashtags"
            className="search-input"
          />
          {query && (
            <button type="button" onClick={clearSearch} className="clear-search-btn">
              <X size={16} />
            </button>
          )}
        </div>
        <button type="submit" className="search-submit-btn">
          Search
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.type === 'user' ? (
                <>
                  <img
                    src={suggestion.profilePicture || '/default-avatar.png'}
                    alt={suggestion.username}
                    className="suggestion-avatar"
                  />
                  <div className="suggestion-info">
                    <span className="suggestion-username">{suggestion.username}</span>
                    <span className="suggestion-fullname">{suggestion.fullName}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="hashtag-icon">#</div>
                  <div className="suggestion-info">
                    <span className="suggestion-username">#{suggestion.tag}</span>
                    <span className="suggestion-fullname">{suggestion.postsCount} posts</span>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="search-tabs">
        <button
          className={`search-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`search-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`search-tab ${activeTab === 'hashtags' ? 'active' : ''}`}
          onClick={() => setActiveTab('hashtags')}
        >
          Hashtags
        </button>
      </div>

      {loading ? (
        <div className="search-loading">Searching...</div>
      ) : (
        <div className="search-results">
          {users.length > 0 && (activeTab === 'all' || activeTab === 'users') && (
            <div className="results-section">
              <h3>Users</h3>
              <div className="users-list">
                {users.map(user => (
                  <Link to={`/profile/${user.username}`} key={user._id} className="user-result">
                    <img
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={user.username}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <span className="user-username">{user.username}</span>
                      <span className="user-fullname">{user.fullName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {hashtags.length > 0 && (activeTab === 'all' || activeTab === 'hashtags') && (
            <div className="results-section">
              <h3>Hashtags</h3>
              <div className="hashtags-list">
                {hashtags.map((hashtag, index) => (
                  <Link to={`/hashtag/${hashtag.tag}`} key={index} className="hashtag-result">
                    <div className="hashtag-icon-large">#</div>
                    <div className="hashtag-info">
                      <span className="hashtag-name">#{hashtag.tag}</span>
                      <span className="hashtag-count">{hashtag.postsCount} posts</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && query && users.length === 0 && hashtags.length === 0 && (
            <div className="no-results">
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
