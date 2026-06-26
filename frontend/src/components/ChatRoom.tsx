import { useState, useEffect, useRef, useCallback } from "react";
import { LoaderCircle, UserPlus, X } from "lucide-react";
import chatService from "../services/chatService";
import jobService from "../services/jobService";
import authService from "../services/authService";

interface Message {
  _id?: string;
  conversationId?: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ConversationParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

interface ConversationLike {
  _id?: string;
  title?: string | null;
  participants?: ConversationParticipant[];
}

export default function ChatRoom({ conversationId, currentUserId, conversation, otherUser }: {
  conversationId: string;
  currentUserId: string;
  conversation?: ConversationLike;
  otherUser?: { _id: string; firstName: string; lastName: string; profileImage?: string };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [onlineParticipantIds, setOnlineParticipantIds] = useState<string[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [participantInput, setParticipantInput] = useState("");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [addParticipantError, setAddParticipantError] = useState<string | null>(null);
  const [addParticipantSuccess, setAddParticipantSuccess] = useState<string | null>(null);
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
    const normalizedParticipants = (conversation?.participants || (otherUser ? [otherUser] : []))
      .filter((participant): participant is ConversationParticipant => Boolean(participant && participant._id));

    setParticipants(normalizedParticipants.filter((participant) => participant._id !== currentUserId));
  }, [conversation?.participants, currentUserId, otherUser]);

  const resolveParticipantTarget = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Please enter a user ID, email, or username.");
    }

    if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const response = await authService.getUsers({ search: trimmed, page: 1, limit: 10 });
      const match = response?.users?.find((user: any) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
        return user.email?.toLowerCase() === trimmed.toLowerCase() || fullName === trimmed.toLowerCase();
      });
      if (match?._id) {
        return match._id;
      }
    } catch {
      // fall back to the raw identifier and let the server validate it
    }

    return trimmed;
  }, []);

  const handleAddParticipant = useCallback(async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!conversationId) return;

    setAddParticipantError(null);
    setAddParticipantSuccess(null);
    setIsAddingParticipant(true);

    try {
      const targetUserId = await resolveParticipantTarget(participantInput);
      const response = await jobService.addParticipantToConversation(conversationId, targetUserId);
      const addedParticipant = response?.participant;

      if (addedParticipant?._id) {
        setParticipants((prev) => (prev.some((participant) => participant._id === addedParticipant._id) ? prev : [...prev, addedParticipant]));
      }

      setAddParticipantSuccess(`${addedParticipant?.firstName || "User"} was added to the room.`);
      setParticipantInput("");
      setIsAddParticipantOpen(false);
    } catch (error: any) {
      setAddParticipantError(error?.response?.data?.message || error?.message || "Unable to add that participant right now.");
    } finally {
      setIsAddingParticipant(false);
    }
  }, [conversationId, participantInput, resolveParticipantTarget]);

  useEffect(() => {
    if (!conversationId) return;

    chatService.joinConversation(conversationId);
    chatService.markAsRead(conversationId);

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

      const typingUser = participants.find((participant) => participant._id === payload.userId);

      if (payload.isTyping) {
        setTypingLabel(typingUser ? `${typingUser.firstName} is typing...` : 'Someone is typing...');
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setTypingLabel(null), 2500);
      } else {
        setTypingLabel(null);
      }
    };

    const handleUserStatus = (payload: { userId: string; online: boolean }) => {
      setOnlineParticipantIds((prev) => {
        if (payload.online) {
          return prev.includes(payload.userId) ? prev : [...prev, payload.userId];
        }
        return prev.filter((id) => id !== payload.userId);
      });
    };

    const handleParticipantAdded = (payload: { conversationId?: string; participant?: ConversationParticipant }) => {
      if (payload.conversationId !== conversationId || !payload.participant?._id) return;
      setParticipants((prev) => (prev.some((participant) => participant._id === payload.participant!._id) ? prev : [...prev, payload.participant!]));
    };

    chatService.onNewMessage(handleIncoming);
    chatService.onTyping(handleTyping);
    chatService.onUserStatus(handleUserStatus);
    chatService.onParticipantAdded(handleParticipantAdded);

    return () => {
      chatService.offNewMessage();
      chatService.offTyping();
      chatService.offUserStatus();
      chatService.offParticipantAdded();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, participants]);

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

  const isAnyOnline = participants.some((participant) => onlineParticipantIds.includes(participant._id));
  const headerTitle = conversation?.title || participants.map((participant) => `${participant.firstName} ${participant.lastName}`).join(', ') || 'Conversation';

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      <div className="border-b p-4 bg-gray-50 rounded-t-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-2 shrink-0">
            {participants.slice(0, 3).map((participant) => (
              <div
                key={participant._id}
                className="w-9 h-9 rounded-full border-2 border-white bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center overflow-hidden"
              >
                {participant.profileImage ? (
                  <img src={participant.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  participant.firstName?.[0] || '?'
                )}
              </div>
            ))}
            {participants.length > 3 && (
              <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-700 text-white text-[11px] font-semibold flex items-center justify-center">
                +{participants.length - 3}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{headerTitle}</div>
            <div className="text-xs text-gray-500">{typingLabel || (isAnyOnline ? 'Online now' : 'Live conversation')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAddParticipantError(null);
              setAddParticipantSuccess(null);
              setIsAddParticipantOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Person</span>
          </button>
          <div className={`text-xs ${isAnyOnline ? 'text-green-600' : 'text-slate-500'}`}>
            {isAnyOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {isAddParticipantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all duration-200">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Add someone to this chat</h3>
                <p className="mt-1 text-sm text-slate-500">Enter a user ID, email address, or username to invite them to this room.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddParticipantOpen(false);
                  setAddParticipantError(null);
                  setAddParticipantSuccess(null);
                  setParticipantInput("");
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3">
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="user@example.com or user ID"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              {addParticipantError && <p className="text-sm text-rose-600">{addParticipantError}</p>}
              {addParticipantSuccess && <p className="text-sm text-emerald-600">{addParticipantSuccess}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddParticipantOpen(false);
                    setAddParticipantError(null);
                    setAddParticipantSuccess(null);
                    setParticipantInput("");
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingParticipant}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isAddingParticipant ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {isAddingParticipant ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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