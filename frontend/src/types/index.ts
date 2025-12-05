export interface User {
  _id: string;
  clerkId: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profilePicture?: string;
  website?: string;
  followers: User[];
  following: User[];
  savedPosts: string[];
  followersCount: number;
  followingCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  user: User;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  filter?: string;
  hashtags: string[];
  mentions: string[];
  likes: string[];
  comments: Comment[];
  location?: string;
  likesCount: number;
  commentsCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  user: User;
  text: string;
  likes: string[];
  likesCount: number;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

export interface Reply {
  user: User;
  text: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  recipient: User;
  content: string;
  messageType: 'text' | 'image' | 'post_share';
  sharedPost?: Post;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
  post?: Post;
  comment?: Comment;
  message?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface SearchResult {
  users: User[];
  hashtags: { tag: string; postsCount: number }[];
  posts: Post[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
