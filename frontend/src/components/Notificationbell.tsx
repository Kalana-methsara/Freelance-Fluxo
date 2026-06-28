// =============================================================
// src/components/NotificationBell.tsx
// =============================================================
// Drop into the Navbar for both client and freelancer layouts.
// Shows unread count, a dropdown history, and a live toast the
// moment a "you've been hired" (or any other) notification arrives
// over the socket — this is the piece that makes the hire flow feel
// instant instead of "refresh to see if anything happened."
// =============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import notificationService, {type AppNotification,type NotificationType } from "../services/notificationService.ts";

const ICONS: Record<NotificationType, string> = {
  hire_offer: "🤝",
  hire_accepted: "✅",
  hire_declined: "✕",
  proposal_received: "📩",
  milestone_submitted: "📦",
  job_completed: "🎉",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list({ limit: 20 });
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handleIncoming = (n: AppNotification) => {
      setItems((prev) => [n, ...prev]);
      setToast(n);
      window.setTimeout(() => setToast((current) => (current?._id === n._id ? null : current)), 6000);
    };
    notificationService.onNotification(handleIncoming);
    return () => notificationService.offNotification();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const goTo = (n: AppNotification) => {
    if (n.conversationId) navigate(`/workspace?conversation=${n.conversationId}`);
    else if (n.jobId) navigate(`/jobs/${n.jobId}`);
  };

  const handleSelect = (n: AppNotification) => {
    setItems((prev) => prev.map((item) => (item._id === n._id ? { ...item, read: true } : item)));
    notificationService.markAsRead(n._id).catch(() => {});
    setOpen(false);
    goTo(n);
  };

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    notificationService.markAllAsRead().catch(() => {});
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.85 23.85 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-emerald-700 font-medium hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-gray-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">You're all caught up.</div>
          ) : (
            items.map((n) => (
              <button
                key={n._id}
                onClick={() => handleSelect(n)}
                className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition ${
                  !n.read ? "bg-emerald-50/40" : ""
                }`}
              >
                <span className="text-lg shrink-0 leading-none mt-0.5">{ICONS[n.type] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 truncate">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
              </button>
            ))
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex gap-3 items-start z-[60]">
          <span className="text-xl shrink-0">{ICONS[toast.type] ?? "🔔"}</span>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { goTo(toast); setToast(null); }}>
            <p className="text-sm font-bold text-gray-900">{toast.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{toast.body}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-300 hover:text-gray-500 shrink-0" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}