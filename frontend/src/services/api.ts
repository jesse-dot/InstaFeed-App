import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// User API
export const userApi = {
  syncUser: (data: { username: string; email: string; fullName?: string; profilePicture?: string; bio?: string }) =>
    api.post('/users/sync', data),
  getMe: () => api.get('/users/me'),
  updateProfile: (data: { fullName?: string; bio?: string; website?: string; profilePicture?: string; isPrivate?: boolean }) =>
    api.put('/users/profile', data),
  getUser: (username: string) => api.get(`/users/${username}`),
  followUser: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId: string) => api.post(`/users/${userId}/unfollow`),
  getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId: string) => api.get(`/users/${userId}/following`),
};

// Post API
export const postApi = {
  createPost: (formData: FormData) =>
    api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getFeed: (page = 1, limit = 10) =>
    api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getExplore: (page = 1, limit = 20) =>
    api.get(`/posts/explore?page=${page}&limit=${limit}`),
  getUserPosts: (userId: string, page = 1, limit = 12) =>
    api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`),
  getPost: (postId: string) => api.get(`/posts/${postId}`),
  likePost: (postId: string) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId: string) => api.post(`/posts/${postId}/unlike`),
  savePost: (postId: string) => api.post(`/posts/${postId}/save`),
  unsavePost: (postId: string) => api.post(`/posts/${postId}/unsave`),
  getSavedPosts: () => api.get('/posts/saved/list'),
  deletePost: (postId: string) => api.delete(`/posts/${postId}`),
};

// Comment API
export const commentApi = {
  addComment: (postId: string, text: string) =>
    api.post(`/comments/${postId}`, { text }),
  getComments: (postId: string, page = 1, limit = 20) =>
    api.get(`/comments/${postId}?page=${page}&limit=${limit}`),
  likeComment: (commentId: string) => api.post(`/comments/${commentId}/like`),
  unlikeComment: (commentId: string) => api.post(`/comments/${commentId}/unlike`),
  replyToComment: (commentId: string, text: string) =>
    api.post(`/comments/${commentId}/reply`, { text }),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Message API
export const messageApi = {
  sendMessage: (data: { recipientId: string; content: string; messageType?: string; sharedPostId?: string }) =>
    api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId: string, page = 1, limit = 50) =>
    api.get(`/messages/${userId}?page=${page}&limit=${limit}`),
  markAsRead: (messageId: string) => api.put(`/messages/${messageId}/read`),
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),
};

// Notification API
export const notificationApi = {
  getNotifications: (page = 1, limit = 20) =>
    api.get(`/notifications?page=${page}&limit=${limit}`),
  markAsRead: (notificationId: string) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Search API
export const searchApi = {
  search: (query: string, type?: string) =>
    api.get(`/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
  searchHashtag: (tag: string, page = 1, limit = 20) =>
    api.get(`/search/hashtag/${tag}?page=${page}&limit=${limit}`),
  getSuggestions: (query: string) =>
    api.get(`/search/suggestions?q=${encodeURIComponent(query)}`),
};

export default api;
