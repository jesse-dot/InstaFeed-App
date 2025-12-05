import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinUserRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('join_user', userId);
    }
  }

  sendTyping(senderId: string, recipientId: string): void {
    if (this.socket) {
      this.socket.emit('typing', { senderId, recipientId });
    }
  }

  sendStopTyping(senderId: string, recipientId: string): void {
    if (this.socket) {
      this.socket.emit('stop_typing', { senderId, recipientId });
    }
  }

  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onUserTyping(callback: (data: { userId: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStopTyping(callback: (data: { userId: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
export default socketService;
