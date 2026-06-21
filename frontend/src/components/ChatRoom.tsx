import { useState, useEffect, useRef, useCallback } from "react";
import chatService from "../services/chatService";
import jobService from "../services/jobService";

interface Message {
  _id?: string;
  conversationId?: string;
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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await jobService.getMessages(conversationId);
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to load messages", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!conversationId) return;

    chatService.joinConversation(conversationId);

    const handleIncoming = (msg: Message) => {
      setMessages((prev) => {
        if (msg._id && prev.some((item) => item._id === msg._id)) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    const handleTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUserId) return;

      if (payload.isTyping) {
        setTypingLabel(`${otherUser.firstName} is typing...`);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setTypingLabel(null), 2500);
      } else {
        setTypingLabel(null);
      }
    };

    const handleUserStatus = (payload: { userId: string; online: boolean }) => {
      if (payload.userId !== otherUser._id) return;
      setIsOtherOnline(payload.online);
    };

    chatService.onNewMessage(handleIncoming);
    chatService.onTyping(handleTyping);
    chatService.onUserStatus(handleUserStatus);

    return () => {
      chatService.offNewMessage();
      chatService.offTyping();
      chatService.offUserStatus();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, otherUser.firstName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    const tempMsg: Message = {
      _id: `local-${Date.now()}`,
      senderId: currentUserId,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");
    chatService.sendTyping(conversationId, false);
    chatService.sendMessage(conversationId, trimmed);
  };

  if (loading) return <div className="p-4 text-center">Loading messages…</div>;

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      <div className="border-b p-4 bg-gray-50 rounded-t-lg flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {otherUser.firstName} {otherUser.lastName}
          </div>
          <div className="text-xs text-gray-500">Live conversation</div>
        </div>
        <div className={`text-xs ${isOtherOnline ? 'text-green-600' : 'text-slate-500'}`}>
          {isOtherOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg._id || `${msg.senderId}-${msg.createdAt}`}
            className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-3xl text-sm leading-5 shadow-sm ${
                msg.senderId === currentUserId
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-900 border border-slate-200"
              }`}
            >
              <p>{msg.text}</p>
              <div className="text-[11px] opacity-70 mt-2 text-right">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-white">
        {typingLabel && <div className="mb-2 text-xs text-gray-500">{typingLabel}</div>}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              const text = e.target.value;
              setNewMessage(text);
              if (conversationId) {
                chatService.sendTyping(conversationId, text.trim().length > 0);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}