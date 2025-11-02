import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../components/Context/AuthContext";

export type AppNotification = {
  id: number | string;
  title: string;
  message?: string;
  type?: string; // e.g. 'approval'
  relatedId?: number | string;
  read?: boolean;
  createdAt?: string;
  extra?: Record<string, any>;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function useNotifications(pollInterval = 10000) {
  const { token } = useAuth() as any; // si tu useAuth expone token
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: AppNotification[] = Array.isArray(data) ? data : data?.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      // silencio por ahora
      console.error("Error fetching notifications:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    if (pollInterval > 0) {
      intervalRef.current = window.setInterval(() => {
        fetchNotifications();
      }, pollInterval);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [fetchNotifications, pollInterval]);

  const markAsRead = async (id: string | number) => {
    // optimista
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err) {
      console.error("Error marking notification read:", err);
      // opcional: refrescar desde servidor
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    // optimista
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err) {
      console.error("Error marking all read:", err);
      fetchNotifications();
    }
  };

  const refresh = () => fetchNotifications();

  return { notifications, unreadCount, markAsRead, markAllRead, refresh };
}