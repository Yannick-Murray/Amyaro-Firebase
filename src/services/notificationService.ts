import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { ActivityNotification } from '../types';

export class NotificationService {
  private static readonly COLLECTION = 'activityNotifications';

  /**
   * Creates one notification per list member (excluding the actor).
   * Called after items are added, a list is closed, or a list is reopened.
   */
  static async createNotificationsForListMembers(
    listId: string,
    listName: string,
    fromUserId: string,
    fromUserName: string,
    sharedWith: string[],
    listOwnerId: string,
    type: 'items_added' | 'list_closed' | 'list_reopened',
    itemNames?: string[],
    unclosedItemNames?: string[]
  ): Promise<void> {
    if (!auth.currentUser) return;

    // Collect all members (owner + sharedWith), exclude the actor
    const allMembers = new Set([listOwnerId, ...sharedWith]);
    allMembers.delete(fromUserId);

    if (allMembers.size === 0) return;

    const now = Timestamp.now();
    const batch = writeBatch(db);

    allMembers.forEach(recipientId => {
      const ref = doc(collection(db, this.COLLECTION));

      const notification: Record<string, unknown> = {
        recipientId,
        fromUserId,
        fromUserName,
        listId,
        listName,
        type,
        isRead: false,
        createdAt: now
      };

      if (itemNames && itemNames.length > 0) {
        notification.itemCount = itemNames.length;
        notification.itemNames = itemNames.slice(0, 3);
      }

      if (unclosedItemNames !== undefined) {
        notification.unclosedItemCount = unclosedItemNames.length;
        notification.unclosedItemNames = unclosedItemNames.slice(0, 5);
      }

      batch.set(ref, notification);
    });

    await batch.commit();
  }

  /**
   * Real-time listener for all notifications for a user (unread first, newest on top).
   * Returns an unsubscribe function.
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: ActivityNotification[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notifications = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as ActivityNotification));
        callback(notifications);
      },
      () => {
        // Permission denied or other error — fail silently, return empty state
        callback([]);
      }
    );
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const ref = doc(db, this.COLLECTION, notificationId);
    await updateDoc(ref, { isRead: true });
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, this.COLLECTION),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
  }

  /**
   * Delete (dismiss) a notification permanently.
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION, notificationId));
  }
}
