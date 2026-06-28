import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistance } from "date-fns";
import jobService from "../services/jobService";
import chatService from "../services/chatService";
import { STORAGE_KEYS } from "../utils/storageKeys";

interface ConversationParticipant {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role?: string;
}

interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  title?: string | null;
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

interface Message {
  _id?: string;
  conversationId?: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const fallbackParticipant: ConversationParticipant = {
  _id: "",
  firstName: "Fluxo",
  lastName: "User",
  profileImage: "",
};

const normalizeId = (value: unknown): string => {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number") return String(value).trim().toLowerCase();
  return "";
};

const getStoredUserIdentity = () => {
  const rawUser = localStorage.getItem(STORAGE_KEYS.user) || localStorage.getItem("user") || localStorage.getItem("currentUser");
  const rawUserId = localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id");

  let parsedUser: Record<string, any> | null = null;
  if (rawUser) {
    try {
      parsedUser = JSON.parse(rawUser);
    } catch {
      parsedUser = null;
    }
  }

  const candidates = [
    parsedUser?._id,
    parsedUser?.id,
    parsedUser?.userId,
    parsedUser?.uid,
    parsedUser?.sub,
    rawUserId,
    localStorage.getItem(STORAGE_KEYS.accessToken) ? parsedUser?.email : null,
  ].filter(Boolean);

  const userId = candidates.find((value) => normalizeId(value)) || "";
  const firstName = parsedUser?.firstName || parsedUser?.firstname || "";
  const lastName = parsedUser?.lastName || parsedUser?.lastname || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    userId: normalizeId(userId),
    displayName,
  };
};

const WorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRoomId = searchParams.get("room") || "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>(queryRoomId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeRoomRef = useRef<string | null>(activeRoomId);

  const { userId: currentUserId, displayName: currentUserDisplayName } = getStoredUserIdentity();
  const token = localStorage.getItem(STORAGE_KEYS.accessToken) || localStorage.getItem("token") || "";
  const effectiveUserId = currentUserId || "anonymous-user";

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const data = await jobService.getConversations();
        const convList = Array.isArray(data) ? data : [];
        setConversations(convList);

        if (queryRoomId && convList.some((conversation) => conversation._id === queryRoomId)) {
          setActiveRoomId(queryRoomId);
        } else if (convList.length > 0) {
          const firstRoomId = convList[0]._id;
          setActiveRoomId(firstRoomId);
          setSearchParams({ room: firstRoomId });
        } else {
          setActiveRoomId("");
          setSearchParams({});
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        setConversations([]);
        setActiveRoomId("");
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [queryRoomId, setSearchParams]);

  useEffect(() => {
    if (!token) return;

    chatService.connect(effectiveUserId, token);

    const handleNewMessage = (msg: Message) => {
      const currentRoom = activeRoomRef.current;

      if (msg.conversationId === currentRoom) {
        setMessages((prev) => {
          if (msg._id && prev.some((message) => message._id === msg._id)) return prev;
          return [...prev, msg];
        });

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === msg.conversationId
              ? {
                  ...conversation,
                  lastMessage: {
                    text: msg.text,
                    createdAt: msg.createdAt,
                    senderId: msg.senderId,
                  },
                }
              : conversation
          )
        );
      } else {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation._id === msg.conversationId
              ? {
                  ...conversation,
                  unreadCount: (conversation.unreadCount || 0) + 1,
                  lastMessage: {
                    text: msg.text,
                    createdAt: msg.createdAt,
                    senderId: msg.senderId,
                  },
                }
              : conversation
          )
        );
      }
    };

    const handleTyping = (payload: { conversationId: string; isTyping: boolean; userId: string }) => {
      const currentRoom = activeRoomRef.current;
      if (payload.conversationId === currentRoom && payload.userId !== effectiveUserId) {
        setTypingLabel(payload.isTyping ? "Typing..." : null);
      }
    };

    const handleConversationCreated = (conversation: Conversation) => {
      setConversations((prev) => [conversation, ...prev]);
    };

    const handleConversationUpdated = (payload: { conversationId: string; job?: any }) => {
      setConversations((prev) =>
        prev.map((conversation) => (conversation._id === payload.conversationId ? { ...conversation, ...payload.job } : conversation))
      );
    };

    chatService.onNewMessage(handleNewMessage);
    chatService.onTyping(handleTyping);
    chatService.onConversationCreated(handleConversationCreated);
    chatService.onConversationUpdated(handleConversationUpdated);

    return () => {
      chatService.offNewMessage(handleNewMessage);
      chatService.offTyping(handleTyping);
      chatService.offConversationCreated(handleConversationCreated);
      chatService.offConversationUpdated(handleConversationUpdated);
      chatService.disconnect();
    };
  }, [effectiveUserId, token]);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      setTypingLabel(null);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        setTypingLabel(null);

        chatService.joinConversation(activeRoomId);

        const chatHistory = await jobService.getMessages(activeRoomId);
        setMessages(Array.isArray(chatHistory) ? chatHistory : []);

        setConversations((prev) =>
          prev.map((conversation) => (conversation._id === activeRoomId ? { ...conversation, unreadCount: 0 } : conversation))
        );
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingLabel]);

  const handleSelectConversation = (id: string) => {
    setActiveRoomId(id);
    setSearchParams({ room: id });
  };

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const text = newMessageText.trim();
    if (!text || !activeRoomId) return;

    const temp: Message = {
      _id: `tmp-${Date.now()}`,
      conversationId: activeRoomId,
      senderId: effectiveUserId,
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);
    chatService.sendMessage(activeRoomId, text);
    chatService.sendTyping(activeRoomId, false);
    setNewMessageText("");
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
    if (participants.length === 0) return fallbackParticipant;

    const candidateIds = new Set<string>([normalizeId(currentUserId), normalizeId(effectiveUserId)].filter(Boolean));
    const directMatch = participants.find((participant) => {
      const participantId = normalizeId(participant._id || participant.id);
      return participantId && !candidateIds.has(participantId);
    });

    if (directMatch) return directMatch;

    const currentName = currentUserDisplayName.trim().toLowerCase();
    const nameMatch = participants.find((participant) => {
      const participantName = [participant.firstName, participant.lastName].filter(Boolean).join(" ").trim().toLowerCase();
      return participantName && currentName && participantName !== currentName;
    });

    if (nameMatch) return nameMatch;

    if (participants.length === 2) return participants[1] || participants[0] || fallbackParticipant;
    return participants[0] || fallbackParticipant;
  };

  const activeConversation = conversations.find((conversation) => conversation._id === activeRoomId);
  const otherUser = activeConversation ? getOtherParticipant(activeConversation) : null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Chat Workspaces</h2>
          <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-100 text-emerald-800 rounded-full animate-pulse">
            Live Connect
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConversations ? (
            <div className="p-6 text-center text-sm text-slate-400">Loading workspaces...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No active rooms found.</div>
          ) : (
            conversations.map((conversation) => {
              const partner = getOtherParticipant(conversation);
              const isActive = conversation._id === activeRoomId;
              const isUnread = conversation.unreadCount > 0;
              const partnerName = [partner.firstName, partner.lastName].filter(Boolean).join(" ").trim();

              return (
                <button
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation._id)}
                  className={`w-full p-4 flex items-center gap-3 transition-all text-left ${
                    isActive ? "bg-emerald-50/60 border-l-4 border-emerald-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold capitalize shrink-0">
                    {partner.firstName ? partner.firstName[0] : "U"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`text-sm font-semibold truncate ${isActive ? "text-emerald-900" : "text-slate-800"}`}>
                        {conversation.title || partnerName || "Conversation"}
                      </h4>
                      {conversation.lastMessage && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {formatDistance(new Date(conversation.lastMessage.createdAt), new Date(), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate ${isUnread ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                        {conversation.lastMessage ? conversation.lastMessage.text : "Start the conversation..."}
                      </p>
                      {isUnread && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col h-full bg-slate-50 relative">
        {activeRoomId && otherUser ? (
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex items-center shadow-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold capitalize">
                  {otherUser.firstName ? otherUser.firstName[0] : "U"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {activeConversation?.title || [otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ").trim() || "Conversation"}
                  </h3>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Online
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-xs text-slate-400 my-4">Syncing secure connection logs...</div>
              ) : (
                messages.map((message, index) => {
                  const isMe = message.senderId === effectiveUserId || message.senderId === currentUserId;
                  return (
                    <div key={message._id || index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                        <span className={`block text-[9px] mt-1 text-right opacity-75 ${isMe ? "text-emerald-100" : "text-slate-400"}`}>
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {typingLabel && (
                <div className="text-xs text-slate-400 italic animate-pulse bg-white/60 border border-slate-100 py-1.5 px-3 rounded-full inline-block">
                  {typingLabel}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shadow-xs">
              <input
                type="text"
                value={newMessageText}
                onChange={(event) => {
                  setNewMessageText(event.target.value);
                  chatService.sendTyping(activeRoomId, event.target.value.trim().length > 0);
                }}
                placeholder="Type your message here..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-xs shrink-0"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
              💬
            </div>
            <p className="text-sm font-medium">Select a conversation channel to open workspace logs.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;