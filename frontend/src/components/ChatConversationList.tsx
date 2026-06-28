// =============================================================
// src/components/ChatConversationList.tsx
// =============================================================
// Sidebar list for the Workspace page. Same data source as before
// (jobService.getConversations / chatService realtime events), with
// three additions:
//   1. Shared Avatar / AvatarGroup instead of duplicated avatar JSX.
//   2. A job-status pill per row when the conversation is tied to a
//      job (see the Conversation.job field — backend contract for
//      this is documented in ARCHITECTURE.md, ChatController section).
//   3. Listens for chatService.onConversationCreated so a brand-new
//      thread — created the instant a client hits "Hire" — appears
//      at the top of the list with no refresh needed.
// =============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistance } from 'date-fns';
import jobService from '../services/jobService';
import chatService from '../services/chatService';
import Avatar from './Avatar';
import AvatarGroup from './Avatargroup';
import StatusBadge from './Statusbadge';

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

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  title?: string | null;
  job?: ConversationJob | null;
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export default function ChatConversationList({ onSelectConversation, selectedId, currentUserId }: {
  onSelectConversation: (convId: string, conversation: Conversation) => void;
  selectedId?: string;
  currentUserId?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const data = await jobService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const refreshConversations = () => loadConversations();
    chatService.onNewMessage(refreshConversations);
    chatService.onMessagesRead(refreshConversations);

    // A hire just happened somewhere else in the app: drop the brand new
    // thread straight into the list instead of waiting for a refresh.
    const handleConversationCreated = (conversation: Conversation) => {
      setConversations((prev) => (prev.some((c) => c._id === conversation._id) ? prev : [conversation, ...prev]));
    };
    chatService.onConversationCreated(handleConversationCreated);

    // Job status changed (e.g. milestone submitted -> under_review).
    const handleConversationUpdated = (payload: { conversationId: string; job?: ConversationJob }) => {
      if (!payload.job) return;
      setConversations((prev) =>
        prev.map((c) => (c._id === payload.conversationId ? { ...c, job: payload.job! } : c))
      );
    };
    chatService.onConversationUpdated(handleConversationUpdated);

    return () => {
      chatService.offNewMessage();
      chatService.offMessagesRead();
      chatService.offConversationCreated();
      chatService.offConversationUpdated();
    };
  }, [loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    onSelectConversation(conv._id, conv);
    chatService.markAsRead(conv._id);
    setConversations((prev) => prev.map((item) => item._id === conv._id ? { ...item, unreadCount: 0 } : item));
  };

  const otherParticipants = (conv: Conversation) =>
    currentUserId ? (conv.participants || []).filter((p) => p._id !== currentUserId) : (conv.participants || []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const names = otherParticipants(conv).map((p) => `${p.firstName} ${p.lastName}`).join(' ').toLowerCase();
      const jobTitle = conv.job?.title?.toLowerCase() || '';
      return names.includes(q) || jobTitle.includes(q) || (conv.title || '').toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, query, currentUserId]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-2.5 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-6 text-gray-400 text-center text-xs leading-relaxed">
            {conversations.length === 0
              ? 'No conversations yet. Once a job leads to a hire, the workspace chat shows up here automatically.'
              : 'No conversations match your search.'}
          </p>
        ) : (
          filtered.map((conv) => {
            const others = otherParticipants(conv);
            const headerName = conv.title || others.map((p) => `${p.firstName} ${p.lastName}`).join(', ') || 'Conversation';

            return (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                  selectedId === conv._id ? 'bg-emerald-50/60 border-l-2 border-emerald-600' : 'border-l-2 border-transparent'
                }`}
              >
                {others.length > 1 ? (
                  <AvatarGroup people={others} max={3} />
                ) : others[0] ? (
                  <Avatar person={others[0]} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">{headerName}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                      {conv.lastMessage?.createdAt
                        ? formatDistance(new Date(conv.lastMessage.createdAt), new Date(), { addSuffix: true })
                        : 'new'}
                    </span>
                  </div>

                  {conv.job?.title && (
                    <p className="text-[11px] text-gray-400 truncate mb-1">{conv.job.title}</p>
                  )}

                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.text || 'Say hello to start the conversation'}</p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {conv.job?.status && (
                    <div className="mt-1.5">
                      <StatusBadge status={conv.job.status} size="sm" />
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}