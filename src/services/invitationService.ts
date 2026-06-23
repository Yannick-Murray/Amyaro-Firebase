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
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
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
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        throw new Error('Benutzer ist nicht angemeldet');
      }

      // 🔒 SECURITY: Verify fromUserId matches current user
      if (auth.currentUser.uid !== fromUserId) {
        throw new Error('User ID stimmt nicht überein');
      }

      // 🔒 SECURITY: Rate limiting - Check recent invitations from this user
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentInvitationsQuery = query(
        collection(db, 'listInvitations'),
        where('fromUserId', '==', fromUserId),
        where('createdAt', '>=', Timestamp.fromDate(oneHourAgo))
      );
      
      const recentInvitations = await getDocs(recentInvitationsQuery);
      if (recentInvitations.size >= 5) {
        throw new Error('Rate limit erreicht: Maximal 5 Einladungen pro Stunde erlaubt.');
      }

      // 🔒 SECURITY: Check invitations to same email in last 24h
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const emailInvitationsQuery = query(
        collection(db, 'listInvitations'),
        where('toEmail', '==', toEmail.toLowerCase()),
        where('createdAt', '>=', Timestamp.fromDate(oneDayAgo))
      );
      
      const emailInvitations = await getDocs(emailInvitationsQuery);
      if (emailInvitations.size >= 3) {
        throw new Error('Rate limit erreicht: Maximal 3 Einladungen pro E-Mail-Adresse pro Tag.');
      }

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
        
        // 🔒 LIMIT: Max 4 geteilte User pro Liste
        const currentSharedCount = listData.sharedWith ? listData.sharedWith.length : 0;
        if (currentSharedCount >= 4) {
          throw new Error('Listen können nur mit maximal 4 Personen geteilt werden.');
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
    } catch (error: any) {
      // Nur loggen wenn es nicht ein Permission-Problem für unverifizierte Benutzer ist
      if (error.code !== 'permission-denied' || auth.currentUser?.emailVerified) {
        console.error('Fehler beim Laden der Einladungen:', error);
      }
      return [];
    }
  }

  // Einladung annehmen
  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      console.log('🔍 DEBUG: Starting acceptInvitation', { invitationId, userId });
      
      // 🔒 SECURITY: Auth-Check
      if (!auth.currentUser) {
        console.error('❌ DEBUG: No authenticated user');
        throw new Error('Benutzer ist nicht angemeldet');
      }
      console.log('✅ DEBUG: User authenticated', auth.currentUser.uid);

      // 🔒 SECURITY: Verify userId matches current user
      if (auth.currentUser.uid !== userId) {
        console.error('❌ DEBUG: User ID mismatch');
        throw new Error('User ID stimmt nicht überein');
      }
      console.log('✅ DEBUG: User ID verified');

      console.log('🔍 DEBUG: Fetching invitation document...');
      const invitationRef = doc(db, 'listInvitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        console.error('❌ DEBUG: Invitation document not found');
        throw new Error('Einladung nicht gefunden.');
      }
      console.log('✅ DEBUG: Invitation document found');

      const invitation = invitationDoc.data() as ListInvitation;
      console.log('🔍 DEBUG: Invitation data', {
        status: invitation.status,
        toEmail: invitation.toEmail,
        toUserId: invitation.toUserId,
        listId: invitation.listId,
        fromUserId: invitation.fromUserId,
        expiresAt: invitation.expiresAt
      });
      
      // 🔒 SECURITY: Verify user is authorized to accept this invitation
      if (invitation.toUserId && invitation.toUserId !== userId) {
        console.error('❌ DEBUG: Invitation not for this user (toUserId mismatch)', {
          invitationToUserId: invitation.toUserId,
          currentUserId: userId
        });
        throw new Error('Diese Einladung ist nicht für dich bestimmt.');
      }
      
      if (invitation.toEmail && auth.currentUser.email !== invitation.toEmail) {
        console.error('❌ DEBUG: Invitation not for this email', {
          invitationToEmail: invitation.toEmail,
          currentUserEmail: auth.currentUser.email
        });
        throw new Error('Diese Einladung ist nicht für Ihre E-Mail-Adresse bestimmt.');
      }
      console.log('✅ DEBUG: User authorized for this invitation');
      
      // Prüfe ob Einladung noch gültig ist
      if (invitation.status !== 'pending') {
        console.error('❌ DEBUG: Invitation not pending', { status: invitation.status });
        throw new Error('Diese Einladung ist nicht mehr gültig.');
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        console.error('❌ DEBUG: Invitation expired', { 
          expiresAt: invitation.expiresAt,
          now: new Date().toISOString()
        });
        throw new Error('Diese Einladung ist abgelaufen.');
      }
      console.log('✅ DEBUG: Invitation is valid and pending');

      console.log('🔍 DEBUG: Starting transaction (without pre-reading list)...');
      // 🔒 Use Transaction for atomic updates
      await runTransaction(db, async (transaction) => {
        console.log('🔍 DEBUG: Inside transaction');
        
        // Read list document inside transaction
        console.log('🔍 DEBUG: Reading list document inside transaction...', invitation.listId);
        const listRef = doc(db, 'lists', invitation.listId);
        const listDoc = await transaction.get(listRef);
        
        if (!listDoc.exists()) {
          console.error('❌ DEBUG: List document not found in transaction', invitation.listId);
          throw new Error('Liste nicht gefunden.');
        }
        console.log('✅ DEBUG: List document found in transaction');

        const listData = listDoc.data();
        const currentSharedWith = listData.sharedWith || [];
        console.log('🔍 DEBUG: Current list data in transaction', {
          listId: invitation.listId,
          listName: listData.name,
          userId: listData.userId,
          currentSharedWith: currentSharedWith,
          userAlreadyShared: currentSharedWith.includes(userId)
        });
        
        // Nur hinzufügen wenn User noch nicht in der Liste ist
        if (!currentSharedWith.includes(userId)) {
          console.log('🔍 DEBUG: Adding user to sharedWith array');
          transaction.update(listRef, {
            sharedWith: [...currentSharedWith, userId],
            updatedAt: Timestamp.fromDate(new Date())
          });
        } else {
          console.log('🔍 DEBUG: User already in sharedWith array, skipping list update');
        }

        console.log('🔍 DEBUG: Updating invitation status');
        // Markiere Einladung als angenommen
        transaction.update(invitationRef, {
          status: 'accepted',
          respondedAt: Timestamp.fromDate(new Date()),
          toUserId: userId
        });
        
        console.log('✅ DEBUG: Transaction updates prepared');
      });
      
      console.log('✅ DEBUG: Transaction completed successfully');
    } catch (error) {
      console.error('❌ DEBUG: Error in acceptInvitation:', error);
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
        throw new Error('Du kannst nur deine eigenen Einladungen stornieren.');
      }

      await deleteDoc(invitationRef);
    } catch (error) {
      console.error('Fehler beim Stornieren der Einladung:', error);
      throw error;
    }
  }
}