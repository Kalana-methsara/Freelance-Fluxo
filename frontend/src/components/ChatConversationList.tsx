import { useCallback, useEffect, useState } from 'react';
import { formatDistance } from 'date-fns';
import jobService from '../services/jobService';
import chatService from '../services/chatService';
import { getInitials } from '../utils/auth';

const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];
function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

interface ConversationParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  avatar?: string;
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

export default function ChatConversationList({ onSelectConversation, selectedId }: {
  onSelectConversation: (convId: string, conversation: any) => void;
  selectedId?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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

    return () => {
      chatService.offNewMessage();
      chatService.offMessagesRead();
    };
  }, [loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    onSelectConversation(conv._id, conv);
    chatService.markAsRead(conv._id);
    setConversations((prev) => prev.map((item) => item._id === conv._id ? { ...item, unreadCount: 0 } : item));
  };

  if (loading) return <div className="p-4 text-gray-500">Loading conversations…</div>;

  return (
    <div className="divide-y divide-gray-100">
      {conversations.length === 0 ? (
        <p className="p-4 text-gray-500 text-center">No conversations yet. Start by messaging a client from an active job.</p>
      ) : (
        conversations.map(conv => (
          <button
            key={conv._id}
            onClick={() => handleSelectConversation(conv)}
            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
              selectedId === conv._id ? 'bg-green-50' : ''
            }`}
          >
            <div className="flex -space-x-2 shrink-0">
              {(conv.participants || []).slice(0, 3).map((participant) => (
                <div
                  key={participant._id}
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                  style={{ background: avatarColor(participant._id) }}
                >
                  {participant.profileImage ? (
                    <img src={participant.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(`${participant.firstName} ${participant.lastName}`)
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {conv.title || (conv.participants || []).map((p) => `${p.firstName} ${p.lastName}`).join(', ')}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {conv.lastMessage?.createdAt ? formatDistance(new Date(conv.lastMessage.createdAt), new Date(), { addSuffix: true }) : 'just now'}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <p className="text-sm text-gray-500 truncate">{conv.lastMessage?.text || 'Start the conversation'}</p>
                {conv.unreadCount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5 shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}