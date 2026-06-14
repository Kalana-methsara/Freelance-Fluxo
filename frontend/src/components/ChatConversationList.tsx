import { useEffect, useState } from 'react';
import { formatDistance } from 'date-fns';
import jobService from '../services/jobService';
import { getInitials } from '../utils/auth';

const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];
function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

interface Conversation {
  _id: string;
  participant: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export default function ChatConversationList({ onSelectConversation, selectedId }: { 
  onSelectConversation: (convId: string, participant: any) => void;
  selectedId?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobService.getConversations()
      .then(setConversations)   // jobService.getConversations returns the array directly
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-gray-500">Loading conversations…</div>;

  return (
    <div className="divide-y divide-gray-100">
      {conversations.length === 0 ? (
        <p className="p-4 text-gray-500 text-center">No conversations yet. Start by messaging a client from an active job.</p>
      ) : (
        conversations.map(conv => (
          <button
            key={conv._id}
            onClick={() => onSelectConversation(conv._id, conv.participant)}
            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
              selectedId === conv._id ? 'bg-green-50' : ''
            }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: avatarColor(conv.participant._id) }}
            >
              {getInitials(`${conv.participant.firstName} ${conv.participant.lastName}`)}
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">
                  {conv.participant.firstName} {conv.participant.lastName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistance(new Date(conv.lastMessage.createdAt), new Date(), { addSuffix: true })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 truncate max-w-45">{conv.lastMessage.text}</p>
                {conv.unreadCount > 0 && (
                  <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
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