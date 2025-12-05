import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout/Layout';
import Feed from './pages/Feed/Feed';
import Profile from './pages/Profile/Profile';
import CreatePost from './pages/CreatePost/CreatePost';
import Explore from './pages/Explore/Explore';
import Search from './pages/Search/Search';
import Messages from './pages/Messages/Messages';
import Notifications from './pages/Notifications/Notifications';
import './App.css';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Missing Clerk Publishable Key. Please set REACT_APP_CLERK_PUBLISHABLE_KEY in your .env file');
}

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects if signed in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main routes component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/sign-in/*"
        element={
          <PublicRoute>
            <div className="auth-container">
              <SignIn routing="path" path="/sign-in" />
            </div>
          </PublicRoute>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <PublicRoute>
            <div className="auth-container">
              <SignUp routing="path" path="/sign-up" />
            </div>
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Feed />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Profile />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Profile />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <CreatePost />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Explore />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Search />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Messages />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:userId"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Messages />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <UserProvider>
              <Layout>
                <Notifications />
              </Layout>
            </UserProvider>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey || ''}>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
