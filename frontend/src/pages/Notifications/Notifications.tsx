import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { notificationApi } from '../../services/api';
import { Notification } from '../../types';
import './Notifications.css';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationApi.getNotifications();
        setNotifications(response.data.notifications);
        
        // Mark all as read
        await notificationApi.markAllAsRead();
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} fill="#ed4956" color="#ed4956" />;
      case 'comment':
        return <MessageCircle size={16} color="#0095f6" />;
      case 'follow':
        return <UserPlus size={16} color="#00b894" />;
      case 'mention':
        return <AtSign size={16} color="#6c5ce7" />;
      default:
        return <Heart size={16} />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        return notification.post ? `/post/${notification.post._id}` : '#';
      case 'follow':
        return `/profile/${notification.sender.username}`;
      case 'message':
        return `/messages/${notification.sender._id}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return <div className="notifications-loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-container">
      <h1>Notifications</h1>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">
          <div className="no-notifications-icon">🔔</div>
          <p>No notifications yet</p>
          <p className="no-notifications-hint">When someone likes, comments, or follows you, you'll see it here</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <Link
              key={notification._id}
              to={getNotificationLink(notification)}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            >
              <img
                src={notification.sender.profilePicture || '/default-avatar.png'}
                alt={notification.sender.username}
                className="notification-avatar"
              />
              <div className="notification-content">
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-text">
                  <span className="notification-username">
                    {notification.sender.username}
                  </span>{' '}
                  <span className="notification-message">
                    {notification.message}
                  </span>
                  <span className="notification-time">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {notification.post?.mediaUrl && (
                <img
                  src={notification.post.mediaUrl}
                  alt=""
                  className="notification-post-preview"
                />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
