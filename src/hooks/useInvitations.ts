import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { InvitationService } from '../services/invitationService';
import type { ListInvitation } from '../types';

export const useInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<ListInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadInvitations = async () => {
    if (!user) {
      setInvitations([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userInvitations = await InvitationService.getUserInvitations(user.uid);
      setInvitations(userInvitations);
      setUnreadCount(userInvitations.length);
    } catch (error) {
      console.error('Fehler beim Laden der Einladungen:', error);
      setInvitations([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const acceptInvitation = async (invitationId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await InvitationService.acceptInvitation(invitationId, user.uid);
      await loadInvitations(); // Neu laden
    } catch (error: any) {
      console.error('Fehler beim Annehmen der Einladung:', error);
      throw error;
    }
  };

  const declineInvitation = async (invitationId: string): Promise<void> => {
    try {
      await InvitationService.declineInvitation(invitationId);
      await loadInvitations(); // Neu laden
    } catch (error: any) {
      console.error('Fehler beim Ablehnen der Einladung:', error);
      throw error;
    }
  };

  return {
    invitations,
    loading,
    unreadCount,
    acceptInvitation,
    declineInvitation,
    refreshInvitations: loadInvitations
  };
};