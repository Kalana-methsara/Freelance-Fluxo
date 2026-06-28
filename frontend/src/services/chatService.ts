// =============================================================
// src/services/chatService.ts
// =============================================================
// Same public API as before (connect/disconnect/joinConversation/
// sendMessage/...), now routed through the single shared socket in
// socketClient.ts instead of holding its own socket instance.
//
// Two new event pairs added to close the gaps in the hire→notify→
// chat flow:
//   onConversationCreated / offConversationCreated
//     -> fired when a hire action spins up a new ChatRoom on the
//        backend. Both the client and the freelancer get this, so
//        the new thread can pop into the sidebar immediately
//        instead of waiting for a page refresh.
//   onConversationUpdated / offConversationUpdated
//     -> fired whenever the *job* behind a conversation changes
//        status (hired -> in_progress -> under_review -> completed)
//        so the job-status marker inside the chat updates live.
// =============================================================

import { connectSocket, disconnectSocket, getSocket } from "./socketClient";

class ChatService {
  connect(userId: string, token: string) {
    return connectSocket(userId, token);
  }

  disconnect(): void {
    disconnectSocket();
  }

  joinConversation(conversationId: string): void {
    getSocket()?.emit("join", conversationId);
  }

  sendMessage(conversationId: string, text: string): void {
    getSocket()?.emit("send_message", { conversationId, text });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    getSocket()?.emit("typing", { conversationId, isTyping });
  }

  onNewMessage(callback: (msg: any) => void): void {
    getSocket()?.on("receive_message", callback);
  }

  offNewMessage(callback?: (msg: any) => void): void {
    if (callback) {
      getSocket()?.off("receive_message", callback);
    } else {
      getSocket()?.off("receive_message");
    }
  }

  onTyping(callback: (payload: any) => void): void {
    getSocket()?.on("typing", callback);
  }

  offTyping(callback?: (payload: any) => void): void {
    if (callback) {
      getSocket()?.off("typing", callback);
    } else {
      getSocket()?.off("typing");
    }
  }

  onUserStatus(callback: (payload: any) => void): void {
    getSocket()?.on("user_status", callback);
  }

  offUserStatus(): void {
    getSocket()?.off("user_status");
  }

  onOnlineUsersUpdate(callback: (userIds: string[]) => void): void {
    getSocket()?.on("get_online_users", callback);
  }

  offOnlineUsersUpdate(): void {
    getSocket()?.off("get_online_users");
  }

  requestOnlineUsers(): void {
    getSocket()?.emit("request_online_users");
  }

  onParticipantAdded(callback: (payload: any) => void): void {
    getSocket()?.on("participant_added", callback);
  }

  offParticipantAdded(): void {
    getSocket()?.off("participant_added");
  }

  onMessagesRead(callback: (payload: any) => void): void {
    getSocket()?.on("messages_read", callback);
  }

  offMessagesRead(): void {
    getSocket()?.off("messages_read");
  }

  markAsRead(conversationId: string): void {
    getSocket()?.emit("mark_read", { conversationId });
  }

  // ── New: fired when a hire action creates a fresh ChatRoom ──
  onConversationCreated(callback: (conversation: any) => void): void {
    getSocket()?.on("conversation_created", callback);
  }

  offConversationCreated(callback?: (conversation: any) => void): void {
    if (callback) {
      getSocket()?.off("conversation_created", callback);
    } else {
      getSocket()?.off("conversation_created");
    }
  }

  // ── New: fired on job status / budget / participant changes ──
  onConversationUpdated(callback: (payload: { conversationId: string; job?: any }) => void): void {
    getSocket()?.on("conversation_updated", callback);
  }

  offConversationUpdated(callback?: (payload: { conversationId: string; job?: any }) => void): void {
    if (callback) {
      getSocket()?.off("conversation_updated", callback);
    } else {
      getSocket()?.off("conversation_updated");
    }
  }
}

export default new ChatService();