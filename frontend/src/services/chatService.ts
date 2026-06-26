// src/services/chatService.ts
import { io, Socket } from 'socket.io-client';

class ChatService {
  private socket: Socket | null = null;

  connect(userId: string, token: string): Socket {
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || window.location.origin;
    this.socket = io(wsUrl, {
      auth: { token },
      query: { userId },
      path: '/socket.io',
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

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  onNewMessage(callback: (msg: any) => void): void {
    this.socket?.on('receive_message', callback);
  }

  offNewMessage(): void {
    this.socket?.off('receive_message');
  }

  onTyping(callback: (payload: any) => void): void {
    this.socket?.on('typing', callback);
  }

  offTyping(): void {
    this.socket?.off('typing');
  }

  onUserStatus(callback: (payload: any) => void): void {
    this.socket?.on('user_status', callback);
  }

  offUserStatus(): void {
    this.socket?.off('user_status');
  }

  onParticipantAdded(callback: (payload: any) => void): void {
    this.socket?.on('participant_added', callback);
  }

  offParticipantAdded(): void {
    this.socket?.off('participant_added');
  }

  onMessagesRead(callback: (payload: any) => void): void {
    this.socket?.on('messages_read', callback);
  }

  offMessagesRead(): void {
    this.socket?.off('messages_read');
  }

  markAsRead(conversationId: string): void {
    this.socket?.emit('mark_read', { conversationId });
  }
}

export default new ChatService();