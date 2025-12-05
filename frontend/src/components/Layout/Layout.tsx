import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useCurrentUser } from '../../context/UserContext';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  MessageCircle,
  User,
  LogOut,
  Compass,
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { currentUser } = useCurrentUser();

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo">
            InstaFeed
          </Link>

          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <Home size={24} />
              <span className="nav-label">Home</span>
            </Link>

            <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`}>
              <Search size={24} />
              <span className="nav-label">Search</span>
            </Link>

            <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'active' : ''}`}>
              <Compass size={24} />
              <span className="nav-label">Explore</span>
            </Link>

            <Link to="/create" className={`nav-link ${isActive('/create') ? 'active' : ''}`}>
              <PlusSquare size={24} />
              <span className="nav-label">Create</span>
            </Link>

            <Link to="/notifications" className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}>
              <Heart size={24} />
              <span className="nav-label">Notifications</span>
            </Link>

            <Link to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`}>
              <MessageCircle size={24} />
              <span className="nav-label">Messages</span>
            </Link>

            <Link
              to={currentUser ? `/profile/${currentUser.username}` : '/profile'}
              className={`nav-link ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
            >
              {clerkUser?.imageUrl ? (
                <img src={clerkUser.imageUrl} alt="Profile" className="nav-avatar" />
              ) : (
                <User size={24} />
              )}
              <span className="nav-label">Profile</span>
            </Link>

            <button onClick={handleSignOut} className="nav-link logout-btn">
              <LogOut size={24} />
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
