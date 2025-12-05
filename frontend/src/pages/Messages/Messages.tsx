import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { messageApi } from '../../services/api';
import { useCurrentUser } from '../../context/UserContext';
import socketService from '../../services/socket';
import { Conversation, Message, User } from '../../types';
import './Messages.css';

const Messages: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { currentUser } = useCurrentUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await messageApi.getConversations();
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchMessages = async () => {
        try {
          const response = await messageApi.getMessages(userId);
          setMessages(response.data.messages);
          
          // Find user from conversations or set from messages
          const conv = conversations.find(c => c.user._id === userId);
          if (conv) {
            setSelectedUser(conv.user);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessages();
    }
  }, [userId, conversations]);

  useEffect(() => {
    // Socket listeners for real-time messaging
    socketService.onNewMessage((message: Message) => {
      if (
        (message.sender._id === userId) ||
        (message.recipient._id === userId)
      ) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(
          c => c.user._id === message.sender._id || c.user._id === message.recipient._id
        );
        
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: message,
            unreadCount: message.sender._id !== currentUser?._id 
              ? updated[existingIndex].unreadCount + 1 
              : updated[existingIndex].unreadCount
          };
          return updated;
        }
        
        return prev;
      });
    });

    socketService.onUserTyping(({ userId: typingUserId }) => {
      if (typingUserId === userId) {
        setIsTyping(true);
      }
    });

    socketService.onUserStopTyping(({ userId: typingUserId }) => {
      if (typingUserId === userId) {
        setIsTyping(false);
      }
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [userId, currentUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    try {
      const response = await messageApi.sendMessage({
        recipientId: userId,
        content: newMessage,
      });

      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!currentUser || !userId) return;

    socketService.sendTyping(currentUser._id, userId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendStopTyping(currentUser._id, userId);
    }, 2000);
  };

  const selectConversation = (user: User) => {
    setSelectedUser(user);
    window.history.pushState({}, '', `/messages/${user._id}`);
  };

  if (loading) {
    return <div className="messages-loading">Loading conversations...</div>;
  }

  return (
    <div className="messages-container">
      <div className={`conversations-list ${userId ? 'hidden-mobile' : ''}`}>
        <div className="conversations-header">
          <h2>{currentUser?.username}</h2>
        </div>
        
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No messages yet</p>
            <p className="no-conversations-hint">Start a conversation by visiting a user's profile</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.user._id}
              className={`conversation-item ${userId === conv.user._id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.user)}
            >
              <img
                src={conv.user.profilePicture || '/default-avatar.png'}
                alt={conv.user.username}
                className="conversation-avatar"
              />
              <div className="conversation-info">
                <span className="conversation-username">{conv.user.username}</span>
                <span className="conversation-last-message">
                  {conv.lastMessage?.content?.substring(0, 30)}
                  {conv.lastMessage?.content?.length > 30 ? '...' : ''}
                </span>
              </div>
              {conv.unreadCount > 0 && (
                <span className="unread-badge">{conv.unreadCount}</span>
              )}
            </button>
          ))
        )}
      </div>

      <div className={`chat-area ${!userId ? 'hidden-mobile' : ''}`}>
        {userId && selectedUser ? (
          <>
            <div className="chat-header">
              <button
                className="back-btn mobile-only"
                onClick={() => window.history.pushState({}, '', '/messages')}
              >
                <ArrowLeft size={24} />
              </button>
              <img
                src={selectedUser.profilePicture || '/default-avatar.png'}
                alt={selectedUser.username}
                className="chat-avatar"
              />
              <div className="chat-user-info">
                <span className="chat-username">{selectedUser.username}</span>
                {isTyping && <span className="typing-indicator">typing...</span>}
              </div>
            </div>

            <div className="messages-list">
              {messages.map(message => (
                <div
                  key={message._id}
                  className={`message ${
                    message.sender._id === currentUser?._id ? 'sent' : 'received'
                  }`}
                >
                  <div className="message-content">{message.content}</div>
                  <span className="message-time">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Message..."
                className="message-input"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="send-btn"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>Your Messages</h3>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
