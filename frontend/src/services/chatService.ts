// src/services/chatService.ts
import { io, Socket } from 'socket.io-client';

class ChatService {
  private socket: Socket | null = null;

  connect(userId: string, token: string): Socket {
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:5000';
    this.socket = io(wsUrl, {
      auth: { token },
      query: { userId },
    });
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) this.socket.disconnect();
    this.socket = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('join', conversationId);
  }

  sendMessage(conversationId: string, text: string): void {
    this.socket?.emit('send_message', { conversationId, text });
  }

  onNewMessage(callback: (msg: any) => void): void {
    this.socket?.on('receive_message', callback);
  }

  offNewMessage(): void {
    this.socket?.off('receive_message');
  }

  // Optional: mark messages as read
  markAsRead(conversationId: string): void {
    this.socket?.emit('mark_read', conversationId);
  }
}

export default new ChatService();