import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authStorage } from "@/lib/auth";
import { toast } from "sonner";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

type NotificationsContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  bumpBell: boolean;
  flashNewId?: string | null;
  markAsRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const SOUND_KEY = "notificationSoundEnabled";

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const user = authStorage.getUser();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw == null ? true : raw === "true";
  });
  const [bumpBell, setBumpBell] = useState<boolean>(false);
  const [flashNewId, setFlashNewId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const debounceMs = 2000;
  const primedRef = useRef<boolean>(false);

  useEffect(() => {
    // Prepare audio element lazily and allow priming via first user interaction
    audioRef.current = new Audio("/success-sound.mp3");
    audioRef.current.volume = 0.7;

    const primeAudio = () => {
      if (!audioRef.current || primedRef.current) return;
      audioRef.current.muted = true;
      audioRef.current.play().catch(() => {});
      audioRef.current.pause();
      audioRef.current.muted = false;
      primedRef.current = true;
    };
    window.addEventListener("click", primeAudio, { once: true });
    return () => {
      window.removeEventListener("click", primeAudio);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, soundEnabled ? "true" : "false");
  }, [soundEnabled]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const sb: any = supabase;
        const { data, error } = await sb
          .from("notifications")
          .select("id,title,message,created_at,is_read")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!cancelled && Array.isArray(data)) {
          const mapped: AppNotification[] = data.map((rec: any) => ({
            id: String(rec?.id),
            title: String(rec?.title ?? "New notification"),
            message: String(rec?.message ?? ""),
            created_at: String(rec?.created_at ?? new Date().toISOString()),
            is_read: Boolean(rec?.is_read ?? false),
          }));
          setNotifications(mapped);
          setUnreadCount(mapped.filter((n) => !n.is_read).length);
        }
      } catch (err) {
        // Fail silently; realtime will still update
        console.warn("Failed to load notifications", err);
      }
    };
    load();
    // Polling fallback in case realtime misses events
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  // Realtime subscription to inserts
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        } as any,
        (payload: any) => {
          const rec = payload?.new as any;
          if (!rec) return;
          const incoming: AppNotification = {
            id: String(rec.id),
            title: String(rec.title || "New notification"),
            message: String(rec.message || ""),
            created_at: String(rec.created_at || new Date().toISOString()),
            is_read: Boolean(rec.is_read ?? false),
          };

          setNotifications((prev) => [incoming, ...prev]);
          if (!incoming.is_read) setUnreadCount((c) => c + 1);

          // Flash highlight if dropdown is open
          if (dropdownOpen) {
            setFlashNewId(incoming.id);
            setTimeout(() => setFlashNewId(null), 1500);
          }

          // Bell bump for 1s
          setBumpBell(true);
          setTimeout(() => setBumpBell(false), 1000);

          // Conditional sound
          const now = Date.now();
          const shouldPlay =
            soundEnabled &&
            !dropdownOpen &&
            document.visibilityState === "visible" &&
            now - lastPlayedRef.current > debounceMs;
          if (shouldPlay && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
            lastPlayedRef.current = now;
          }

          // In-app toast for visibility
          toast(incoming.title, {
            description: incoming.message,
            duration: 3500,
          });
        }
      );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [userId, dropdownOpen, soundEnabled]);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
  };

  const markAsRead = async (id: string) => {
    try {
      const sb: any = supabase;
      const { error } = await sb
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
    } catch (err) {
      console.warn("Failed to mark notification as read", err);
    } finally {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const value = useMemo<NotificationsContextType>(() => ({
    notifications,
    unreadCount,
    dropdownOpen,
    setDropdownOpen,
    soundEnabled,
    setSoundEnabled,
    bumpBell,
    flashNewId,
    markAsRead,
  }), [notifications, unreadCount, dropdownOpen, soundEnabled, bumpBell, flashNewId]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
