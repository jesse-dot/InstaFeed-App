import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X } from 'lucide-react';
import { postApi } from '../../services/api';
import './CreatePost.css';

const FILTERS = [
  { name: 'none', label: 'Normal' },
  { name: 'grayscale', label: 'Grayscale' },
  { name: 'sepia', label: 'Sepia' },
  { name: 'saturate', label: 'Saturate' },
  { name: 'contrast', label: 'Contrast' },
  { name: 'brightness', label: 'Brightness' },
  { name: 'vintage', label: 'Vintage' },
  { name: 'warm', label: 'Warm' },
  { name: 'cool', label: 'Cool' },
];

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setSelectedFilter('none');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('caption', caption);
      formData.append('filter', selectedFilter);
      formData.append('location', location);

      await postApi.createPost(formData);
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h1>Create New Post</h1>

        {!preview ? (
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <Image size={64} strokeWidth={1} />
            <p>Drag photos and videos here</p>
            <button type="button" className="select-btn">
              Select from computer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              hidden
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="create-post-form">
            <div className="preview-section">
              <button type="button" className="clear-btn" onClick={clearSelection}>
                <X size={20} />
              </button>
              {mediaType === 'video' ? (
                <video src={preview} controls className="media-preview" />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className={`media-preview filter-${selectedFilter}`}
                />
              )}
            </div>

            {mediaType === 'image' && (
              <div className="filters-section">
                <h3>Filters</h3>
                <div className="filters-grid">
                  {FILTERS.map(filter => (
                    <button
                      key={filter.name}
                      type="button"
                      className={`filter-btn ${selectedFilter === filter.name ? 'active' : ''}`}
                      onClick={() => setSelectedFilter(filter.name)}
                    >
                      <img
                        src={preview}
                        alt={filter.label}
                        className={`filter-preview filter-${filter.name}`}
                      />
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="details-section">
              <div className="form-group">
                <label htmlFor="caption">Caption</label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption... Use #hashtags to categorize your post"
                  maxLength={2200}
                  rows={4}
                />
                <span className="char-count">{caption.length}/2200</span>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                />
              </div>
            </div>

            <div className="submit-section">
              <button type="submit" className="share-btn" disabled={loading}>
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
