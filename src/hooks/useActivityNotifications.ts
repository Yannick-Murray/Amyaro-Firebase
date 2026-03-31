import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/notificationService';
import type { ActivityNotification } from '../types';

/**
 * Merges unread `items_added` notifications from the same person on the same list
 * into a single consolidated entry so the user sees one summary instead of many.
 */
function mergeItemsAdded(notifications: ActivityNotification[]): ActivityNotification[] {
  const mergeMap = new Map<string, ActivityNotification>();
  const rest: ActivityNotification[] = [];

  for (const n of notifications) {
    if (n.type === 'items_added' && !n.isRead) {
      const key = `${n.listId}__${n.fromUserId}`;
      const existing = mergeMap.get(key);
      if (existing) {
        const mergedIds = [...(existing.ids ?? [existing.id]), n.id];
        const allNames = [...(existing.itemNames ?? []), ...(n.itemNames ?? [])];
        const uniqueNames = [...new Set(allNames)];
        mergeMap.set(key, {
          ...existing,
          ids: mergedIds,
          itemCount: (existing.itemCount ?? 1) + (n.itemCount ?? 1),
          itemNames: uniqueNames.slice(0, 3),
          // keep the newest timestamp so the card sorts correctly
          createdAt: n.createdAt.toMillis() > existing.createdAt.toMillis()
            ? n.createdAt
            : existing.createdAt,
        });
      } else {
        mergeMap.set(key, { ...n, ids: [n.id] });
      }
    } else {
      rest.push(n);
    }
  }

  return [...rest, ...mergeMap.values()].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
  );
}

export const useActivityNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!user || !user.emailVerified) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    unsubscribeRef.current = NotificationService.subscribeToNotifications(
      user.uid,
      (incoming) => {
        setNotifications(mergeItemsAdded(incoming));
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notification: ActivityNotification): Promise<void> => {
    try {
      const ids = notification.ids ?? [notification.id];
      if (ids.length === 1) {
        await NotificationService.markAsRead(ids[0]);
      } else {
        await NotificationService.markManyAsRead(ids);
      }
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    if (!user) return;
    try {
      await NotificationService.markAllAsRead(user.uid);
    } catch (error) {
      console.error('Fehler beim Markieren aller als gelesen:', error);
    }
  };

  const dismissNotification = async (notification: ActivityNotification): Promise<void> => {
    try {
      const ids = notification.ids ?? [notification.id];
      if (ids.length === 1) {
        await NotificationService.deleteNotification(ids[0]);
      } else {
        await NotificationService.deleteManyNotifications(ids);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Benachrichtigung:', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification
  };
};
