import { useState, useEffect, useRef } from 'react';
import chatService from '../services/chatService';
import jobService from '../services/jobService';   // ✅ use jobService instead

interface Message {
  _id?: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export default function ChatRoom({ conversationId, currentUserId, otherUser }: {
  conversationId: string;
  currentUserId: string;
  otherUser: { _id: string; firstName: string; lastName: string };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load previous messages via REST (jobService returns array directly)
  useEffect(() => {
    if (!conversationId) return;
    jobService.getMessages(conversationId)
      .then(setMessages)   // ✅ no .data needed
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Connect to WebSocket and listen for new messages
  useEffect(() => {
    if (!conversationId) return;
    chatService.joinConversation(conversationId);
    chatService.onNewMessage((msg: Message) => {
      if (msg.senderId !== currentUserId) {
        setMessages(prev => [...prev, msg]);
        // Optional: mark as read (if implemented in chatService)
        // chatService.markAsRead(conversationId);
      }
    });
    return () => {
      chatService.offNewMessage();
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const tempMsg: Message = {
      senderId: currentUserId,
      text: newMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    chatService.sendMessage(conversationId, newMessage);
    setNewMessage('');
  };

  if (loading) return <div className="p-4 text-center">Loading messages…</div>;

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      {/* Header */}
      <div className="border-b p-3 font-medium bg-gray-50 rounded-t-lg">
        Chat with {otherUser.firstName} {otherUser.lastName}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                msg.senderId === currentUserId
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.text}
              <div className="text-[10px] opacity-70 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 text-white rounded-full px-4 py-2 text-sm hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}