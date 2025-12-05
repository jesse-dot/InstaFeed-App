import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { User } from '../types';
import { userApi, setAuthToken } from '../services/api';
import socketService from '../services/socket';

interface SyncUserData {
  username: string;
  fullName?: string;
  bio?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  syncUser: (data: SyncUserData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (!clerkLoaded) return;

      if (clerkUser) {
        try {
          const token = await getToken();
          setAuthToken(token);

          // Connect to socket and join user room
          socketService.connect();

          // Try to get existing user
          try {
            const response = await userApi.getMe();
            setCurrentUser(response.data.user);
            socketService.joinUserRoom(response.data.user._id);
          } catch {
            // User doesn't exist yet, will need to sync
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error initializing user:', error);
        }
      } else {
        setAuthToken(null);
        socketService.disconnect();
        setCurrentUser(null);
      }
      setLoading(false);
    };

    initializeUser();
  }, [clerkUser, clerkLoaded, getToken]);

  const syncUser = async (data: SyncUserData) => {
    if (!clerkUser) return;

    try {
      const token = await getToken();
      setAuthToken(token);

      const response = await userApi.syncUser({
        username: data.username,
        email: clerkUser.emailAddresses[0].emailAddress,
        fullName: data.fullName || '',
        profilePicture: clerkUser.imageUrl || '',
        bio: data.bio || '',
      });

      setCurrentUser(response.data.user);
      socketService.joinUserRoom(response.data.user._id);
    } catch (error) {
      console.error('Error syncing user:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await userApi.updateProfile(data as any);
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, loading, syncUser, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
};
