import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  limit,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ListInvitation } from '../types';

export class InvitationService {
  // Einladung senden
  static async sendInvitation(
    listId: string,
    listName: string,
    fromUserId: string,
    fromUserName: string,
    toEmail: string,
    permission: 'read' | 'write' = 'write'
  ): Promise<string> {
    try {
      // Prüfe ob bereits eine pending Einladung existiert
      const existingQuery = query(
        collection(db, 'listInvitations'),
        where('listId', '==', listId),
        where('toEmail', '==', toEmail.toLowerCase()),
        where('status', '==', 'pending')
      );
      
      const existingInvitations = await getDocs(existingQuery);
      if (!existingInvitations.empty) {
        throw new Error('Eine Einladung für diese E-Mail-Adresse ist bereits ausstehend.');
      }

      // Prüfe ob User bereits Zugriff hat
      const listDoc = await getDoc(doc(db, 'lists', listId));
      if (listDoc.exists()) {
        const listData = listDoc.data();
        if (listData.sharedWith && listData.sharedWith.includes(toEmail)) {
          throw new Error('Diese Person hat bereits Zugriff auf die Liste.');
        }
      }

      // Versuche User anhand der Email zu finden
      let toUserId: string | undefined;
      try {
        const userQuery = query(
          collection(db, 'users'),
          where('email', '==', toEmail.toLowerCase()),
          limit(1)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          toUserId = userSnapshot.docs[0].id;
        }
      } catch (error) {
        console.log('User not found, will create invitation anyway');
      }

      // Erstelle Einladung
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig

      const invitation: Omit<ListInvitation, 'id'> = {
        listId,
        listName,
        fromUserId,
        fromUserName,
        toEmail: toEmail.toLowerCase(),
        toUserId,
        status: 'pending',
        permission,
        createdAt: new Date(),
        expiresAt,
      };

      // Filter undefined values before saving to Firestore
      const invitationData: any = {
        listId: invitation.listId,
        listName: invitation.listName,
        fromUserId: invitation.fromUserId,
        fromUserName: invitation.fromUserName,
        toEmail: invitation.toEmail,
        status: invitation.status,
        permission: invitation.permission,
        createdAt: Timestamp.fromDate(invitation.createdAt),
        expiresAt: Timestamp.fromDate(invitation.expiresAt),
      };

      // Only add toUserId if it's not undefined
      if (invitation.toUserId) {
        invitationData.toUserId = invitation.toUserId;
      }

      const docRef = await addDoc(collection(db, 'listInvitations'), invitationData);

      return docRef.id;
    } catch (error) {
      console.error('Fehler beim Senden der Einladung:', error);
      throw error;
    }
  }

    // Einladungen für einen Benutzer laden
  static async getUserInvitations(userId: string): Promise<ListInvitation[]> {
    try {
      // Hole Einladungen über Email
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return [];
      }

      const userData = userDoc.data();
      const userEmail = userData.email;

      // Vereinfachte Query - nur nach Email filtern
      const q = query(
        collection(db, 'listInvitations'),
        where('toEmail', '==', userEmail)
      );

      const snapshot = await getDocs(q);
      
      // Client-seitige Filterung für pending status und Sortierung
      const invitations = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          expiresAt: doc.data().expiresAt.toDate(),
          respondedAt: doc.data().respondedAt?.toDate(),
        } as ListInvitation))
        .filter(invitation => invitation.status === 'pending')
        .filter(invitation => new Date(invitation.expiresAt) > new Date()) // Nur nicht-abgelaufene
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Nach Datum sortieren

      return invitations;
    } catch (error) {
      console.error('Fehler beim Laden der Einladungen:', error);
      return [];
    }
  }

  // Einladung annehmen
  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'listInvitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        throw new Error('Einladung nicht gefunden.');
      }

      const invitation = invitationDoc.data() as ListInvitation;
      
      // Prüfe ob Einladung noch gültig ist
      if (invitation.status !== 'pending') {
        throw new Error('Diese Einladung ist nicht mehr gültig.');
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        throw new Error('Diese Einladung ist abgelaufen.');
      }

      // Füge User zur Liste hinzu
      const listRef = doc(db, 'lists', invitation.listId);
      const listDoc = await getDoc(listRef);
      
      if (!listDoc.exists()) {
        throw new Error('Liste nicht gefunden.');
      }

      const listData = listDoc.data();
      const currentSharedWith = listData.sharedWith || [];
      
      if (!currentSharedWith.includes(userId)) {
        await updateDoc(listRef, {
          sharedWith: [...currentSharedWith, userId],
          updatedAt: Timestamp.fromDate(new Date())
        });
      }

      // Markiere Einladung als angenommen
      await updateDoc(invitationRef, {
        status: 'accepted',
        respondedAt: Timestamp.fromDate(new Date()),
        toUserId: userId
      });
    } catch (error) {
      console.error('Fehler beim Annehmen der Einladung:', error);
      throw error;
    }
  }

  // Einladung ablehnen
  static async declineInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'listInvitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'declined',
        respondedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Fehler beim Ablehnen der Einladung:', error);
      throw error;
    }
  }

  // Abgelaufene Einladungen bereinigen (vereinfacht)
  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      // Vereinfachte Query - alle Einladungen laden und client-seitig filtern
      const q = query(collection(db, 'listInvitations'));
      const snapshot = await getDocs(q);
      
      const now = new Date();
      const updatePromises: Promise<void>[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'pending' && data.expiresAt.toDate() < now) {
          updatePromises.push(
            updateDoc(doc.ref, { status: 'expired' })
          );
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Fehler beim Bereinigen abgelaufener Einladungen:', error);
    }
  }

  // Einladung löschen (für den Absender)
  static async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'listInvitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        throw new Error('Einladung nicht gefunden.');
      }

      const invitation = invitationDoc.data() as ListInvitation;
      
      if (invitation.fromUserId !== userId) {
        throw new Error('Sie können nur Ihre eigenen Einladungen stornieren.');
      }

      await deleteDoc(invitationRef);
    } catch (error) {
      console.error('Fehler beim Stornieren der Einladung:', error);
      throw error;
    }
  }
}