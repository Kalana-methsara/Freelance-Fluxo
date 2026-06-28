import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, UserPlus, X } from "lucide-react";
import chatService from "../services/chatService";
import jobService from "../services/jobService";
import authService from "../services/authService";
import Avatar from "./Avatar";
import AvatarGroup from "./Avatargroup";
import StatusBadge from "./Statusbadge";

interface Message {
  _id?: string;
  conversationId?: string;
  senderId?: string | { _id?: string } | null;
  sender?: { _id?: string; firstName?: string; lastName?: string; profileImage?: string } | null;
  text: string;
  createdAt: string;
}

interface ConversationParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

interface ConversationJob {
  _id: string;
  title: string;
  status: string;
  budget: number;
}

interface ConversationLike {
  _id?: string;
  title?: string | null;
  participants?: ConversationParticipant[];
  /**
   * Present when this thread was created from a hire (the normal case).
   * Absent for ad-hoc, non-job direct messages. See ARCHITECTURE.md ->
   * ChatController -> GET /api/chat/conversations for the backend shape.
   */
  job?: ConversationJob | null;
}

const normalizeId = (value: unknown): string => {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number") return String(value).trim().toLowerCase();
  if (value && typeof value === "object") {
    const typed = value as { _id?: unknown; id?: unknown };
    const idValue = typed._id ?? typed.id;
    if (typeof idValue === "string") return idValue.trim().toLowerCase();
    if (typeof idValue === "number") return String(idValue).trim().toLowerCase();
  }
  return "";
};

const getMessageSenderId = (message: Message): string => {
  if (!message) return "";
  if (typeof message.senderId === "string") return normalizeId(message.senderId);
  if (message.senderId && typeof message.senderId === "object") return normalizeId(message.senderId._id);
  if (message.sender && typeof message.sender === "object") return normalizeId(message.sender._id);
  return "";
};

export default function ChatRoom({ conversationId, currentUserId, conversation, otherUser }: {
  conversationId: string;
  currentUserId: string;
  conversation?: ConversationLike;
  otherUser?: { _id: string; firstName: string; lastName: string; profileImage?: string };
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [onlineParticipantIds, setOnlineParticipantIds] = useState<string[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [job, setJob] = useState<ConversationJob | null | undefined>(conversation?.job);
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
    setJob(conversation?.job);
  }, [conversation?.job]);

  useEffect(() => {
    const normalizedParticipants = (conversation?.participants || (otherUser ? [otherUser] : []))
      .filter((participant): participant is ConversationParticipant => Boolean(participant && participant._id));

    setParticipants(normalizedParticipants.filter((participant) => normalizeId(participant._id) !== normalizeId(currentUserId)));
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
      if (normalizeId(payload.userId) === normalizeId(currentUserId)) return;

      const normalizedPayloadUserId = normalizeId(payload.userId);
      const typingUser = participants.find((participant) => normalizeId(participant._id) === normalizedPayloadUserId);

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
      const normalizedUserId = normalizeId(payload.userId);
      setOnlineParticipantIds((prev) => {
        if (payload.online) {
          return prev.includes(normalizedUserId) ? prev : [...prev, normalizedUserId];
        }
        return prev.filter((id) => id !== normalizedUserId);
      });
    };

    const handleParticipantAdded = (payload: { conversationId?: string; participant?: ConversationParticipant }) => {
      if (payload.conversationId !== conversationId || !payload.participant?._id) return;
      setParticipants((prev) => (prev.some((participant) => participant._id === payload.participant!._id) ? prev : [...prev, payload.participant!]));
    };

    // Job status / budget changed (milestone submitted, job completed, etc.)
    // — keeps the status pill in the header live without a page refresh.
    const handleConversationUpdated = (payload: { conversationId: string; job?: ConversationJob }) => {
      if (payload.conversationId !== conversationId || !payload.job) return;
      setJob(payload.job);
    };

    chatService.onNewMessage(handleIncoming);
    chatService.onTyping(handleTyping);
    chatService.onUserStatus(handleUserStatus);
    chatService.onOnlineUsersUpdate((userIds) => setOnlineParticipantIds(userIds.map(normalizeId)));
    chatService.onParticipantAdded(handleParticipantAdded);
    chatService.onConversationUpdated(handleConversationUpdated);
    chatService.requestOnlineUsers();

    return () => {
      chatService.offNewMessage(handleIncoming);
      chatService.offTyping(handleTyping);
      chatService.offUserStatus();
      chatService.offOnlineUsersUpdate();
      chatService.offParticipantAdded();
      chatService.offConversationUpdated();
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

  const normalizedOnlineParticipantIds = onlineParticipantIds.map(normalizeId);
  const isAnyOnline = participants.some((participant) => normalizedOnlineParticipantIds.includes(normalizeId(participant._id)));
  const headerTitle = conversation?.title || participants.map((participant) => `${participant.firstName} ${participant.lastName}`).join(', ') || 'Conversation';

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      <div className="border-b p-4 bg-gray-50 rounded-t-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {participants.length > 1 ? (
            <AvatarGroup people={participants} max={3} size="sm" />
          ) : participants[0] ? (
            <Avatar person={participants[0]} size="sm" online={normalizedOnlineParticipantIds.includes(normalizeId(participants[0]._id))} />
          ) : null}
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

      {/* Job context bar — the "this is a workspace, not a casual DM" marker */}
      {job && (
        <div className="border-b border-gray-100 bg-white px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 font-medium">Project</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-gray-400">Budget</p>
              <p className="text-sm font-bold text-gray-900">${job.budget.toLocaleString()}</p>
            </div>
            <StatusBadge status={job.status} />
            <button
              onClick={() => navigate(`/jobs/${job._id}`)}
              className="text-xs text-emerald-700 font-semibold hover:text-emerald-800 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition shrink-0"
            >
              View Job
            </button>
          </div>
        </div>
      )}

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

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] p-4 space-y-3 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {messages.map((msg) => {
          const senderId = getMessageSenderId(msg);
          const normalizedCurrentUserId = normalizeId(currentUserId);
          const isMe = senderId === normalizedCurrentUserId;

          return (
            <div
              key={msg._id || `${senderId}-${msg.createdAt}`}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-3xl text-sm leading-5 shadow-sm ${
                  isMe
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
          );
        })}
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