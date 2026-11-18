import { Button } from '../ui/Button';
import type { ListInvitation } from '../../types';

interface InvitationCardProps {
  invitation: ListInvitation;
  isProcessing: boolean;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

const formatDateTime = (date: Date) => {
  const safeDate = date instanceof Date ? date : new Date(date);

  return {
    date: safeDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    time: safeDate.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

export const InvitationCard = ({
  invitation,
  isProcessing,
  onAccept,
  onDecline
}: InvitationCardProps) => {
  const { date, time } = formatDateTime(invitation.createdAt);
  const expires = formatDateTime(invitation.expiresAt);
  const permissionLabel = invitation.permission === 'write' ? 'Bearbeiten' : 'Nur lesen';

  return (
    <div className="card border border-primary border-opacity-25">
      <div className="card-body p-3">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="flex-grow-1 min-w-0">
            <h6 className="card-title mb-1 text-truncate">
              {invitation.listName}
            </h6>
            <p className="card-text text-muted small mb-1">
              von <strong>{invitation.fromUserName}</strong>
            </p>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {date} um {time}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Gültig bis {expires.date} · {permissionLabel}
            </div>
          </div>
          <i className="bi bi-share text-primary ms-2" style={{ fontSize: '1.25rem' }}></i>
        </div>

        <div className="d-grid gap-2 d-sm-flex">
          <Button
            variant="success"
            size="sm"
            onClick={() => onAccept(invitation.id)}
            disabled={isProcessing}
            isLoading={isProcessing}
            className="flex-grow-1 flex-sm-grow-0"
          >
            <i className="bi bi-check-lg me-1"></i>
            Annehmen
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => onDecline(invitation.id)}
            disabled={isProcessing}
            className="flex-grow-1 flex-sm-grow-0"
          >
            <i className="bi bi-x-lg me-1"></i>
            Ablehnen
          </Button>
        </div>
      </div>
    </div>
  );
};
