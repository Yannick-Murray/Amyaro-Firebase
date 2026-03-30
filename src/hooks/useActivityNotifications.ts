import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/notificationService';
import type { ActivityNotification } from '../types';

export const useActivityNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up previous listener
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
        setNotifications(incoming);
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

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      await NotificationService.markAsRead(notificationId);
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

  const dismissNotification = async (notificationId: string): Promise<void> => {
    try {
      await NotificationService.deleteNotification(notificationId);
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
