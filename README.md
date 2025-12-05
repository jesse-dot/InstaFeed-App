# InstaFeed-App

An Instagram-like social media application built with Node.js, React, MongoDB, and Clerk authentication.

## Features

- **User Authentication**: Sign-up/login with Clerk (supports social logins)
- **Editable Profiles**: Update bio, profile picture, website, and privacy settings
- **Main Feed**: View posts from followed users, prioritized by likes
- **Post Creation**: Upload photos/videos with simple image filters
- **Interactions**: Like, comment, and save posts
- **Follow System**: Follow/unfollow users
- **Real-time Direct Messaging**: Private messaging with Socket.io
- **Search**: Find users and hashtags
- **Notifications**: Get notified about likes, comments, follows, and messages
- **Explore**: Discover popular posts from all users

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time messaging
- **Clerk** for authentication
- **Multer** for file uploads

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Clerk React** for authentication UI
- **Socket.io Client** for real-time features
- **Axios** for API calls
- **Lucide React** for icons
- **date-fns** for date formatting

## Project Structure

```
InstaFeed-App/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── server.js       # Express server
│   ├── uploads/            # Uploaded media files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API and socket services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Clerk account (for authentication)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/InstaFeed-App.git
cd InstaFeed-App
```

### 2. Set up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Create a new application
3. Copy your Publishable Key and Secret Key

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/instafeed
NODE_ENV=development

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
```

Start the backend:

```bash
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file based on `.env.example`:

```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm start
```

### 5. Access the Application

Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Users
- `POST /api/users/sync` - Sync user from Clerk
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:username` - Get user by username
- `POST /api/users/:id/follow` - Follow a user
- `POST /api/users/:id/unfollow` - Unfollow a user

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/feed` - Get feed posts
- `GET /api/posts/explore` - Get explore posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/unlike` - Unlike a post
- `POST /api/posts/:id/save` - Save a post
- `DELETE /api/posts/:id` - Delete a post

### Comments
- `POST /api/comments/:postId` - Add comment
- `GET /api/comments/:postId` - Get comments
- `POST /api/comments/:id/like` - Like a comment
- `DELETE /api/comments/:id` - Delete a comment

### Messages
- `POST /api/messages` - Send a message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/read-all` - Mark all as read

### Search
- `GET /api/search` - Search users and hashtags
- `GET /api/search/hashtag/:tag` - Get posts by hashtag

## Image Filters

The app supports the following image filters:
- Normal (none)
- Grayscale
- Sepia
- Saturate
- Contrast
- Brightness
- Vintage
- Warm
- Cool

## Real-time Features

Socket.io is used for:
- Instant message delivery
- Typing indicators
- Real-time notifications

## License

MIT License