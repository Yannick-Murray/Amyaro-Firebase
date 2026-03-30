import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { ActivityNotification } from '../../types';

interface ActivityNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ActivityNotification[];
  loading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export const ActivityNotificationsModal: React.FC<ActivityNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss
}) => {
  const navigate = useNavigate();

  const handleNavigateToList = async (notification: ActivityNotification) => {
    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }
    onClose();
    navigate(`/list/${notification.listId}`);
  };

  const formatDate = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Gerade eben';
    if (diffMin < 60) return `Vor ${diffMin} Min.`;
    if (diffHrs < 24) return `Vor ${diffHrs} Std.`;
    if (diffDays === 1) return 'Gestern';
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getNotificationIcon = (n: ActivityNotification): { icon: string; bgClass: string } => {
    switch (n.type) {
      case 'list_closed':
        return { icon: 'bi-lock text-warning', bgClass: 'bg-warning bg-opacity-10' };
      case 'list_reopened':
        return { icon: 'bi-unlock text-success', bgClass: 'bg-success bg-opacity-10' };
      default:
        return { icon: 'bi-plus-circle text-primary', bgClass: 'bg-primary bg-opacity-10' };
    }
  };

  const getNotificationText = (n: ActivityNotification): React.ReactNode => {
    if (n.type === 'list_reopened') {
      return <>hat die Liste <strong>{n.listName}</strong> wieder geöffnet</>;
    }

    if (n.type === 'list_closed') {
      const unclosed = n.unclosedItemCount ?? 0;
      return (
        <>
          hat die Liste <strong>{n.listName}</strong> geschlossen
          {unclosed > 0 && (
            <> — <span className="text-warning fw-semibold">{unclosed} {unclosed === 1 ? 'Item' : 'Items'} nicht abgehakt</span></>
          )}
          {unclosed === 0 && <> — alle Items wurden abgehakt</>}
        </>
      );
    }

    // items_added
    const count = n.itemCount || 1;
    const countLabel = count === 1 ? '1 Item' : `${count} Items`;
    return (
      <>
        hat <strong>{countLabel}</strong> zur Liste <strong>{n.listName}</strong> hinzugefügt
        {n.itemNames && n.itemNames.length > 0 && (
          <>: {n.itemNames.join(', ')}{count > n.itemNames.length ? ` +${count - n.itemNames.length}` : ''}</>
        )}
      </>
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <div className="modal-header border-0 pb-0">
        <h5 className="modal-title d-flex align-items-center">
          <i className="bi bi-bell me-2 text-primary"></i>
          Aktivitäten
          {unreadCount > 0 && (
            <span className="badge bg-primary ms-2">{unreadCount}</span>
          )}
        </h5>
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        ></button>
      </div>

      <div className="modal-body px-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Laden...</span>
            </div>
            <div className="mt-2 text-muted">Aktivitäten werden geladen...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-bell display-1 text-muted mb-3"></i>
            <h6 className="text-muted">Keine Aktivitäten</h6>
            <p className="text-muted small mb-0">
              Wenn jemand in einer geteilten Liste etwas hinzufügt oder eine Liste abschließt, erscheint es hier.
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {notifications.map((notification) => {
              const { icon, bgClass } = getNotificationIcon(notification);
              return (
                <div key={notification.id} className="col-12">
                  <div className={`card border ${!notification.isRead ? 'border-primary border-opacity-25' : ''}`}>
                    <div className="card-body p-3">
                      {/* Header row: icon + content + dismiss */}
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="d-flex align-items-start gap-3 flex-grow-1 min-w-0">
                          {/* Icon */}
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${bgClass}`}
                            style={{ width: '2.25rem', height: '2.25rem' }}
                          >
                            <i className={`bi ${icon}`}></i>
                          </div>

                          {/* Content */}
                          <div className="flex-grow-1 min-w-0">
                            <p className="mb-1 small text-break">
                              <strong>{notification.fromUserName}</strong>{' '}
                              {getNotificationText(notification)}
                            </p>

                            {/* Nicht-abgehakte Items beim Schließen */}
                            {notification.type === 'list_closed' &&
                              notification.unclosedItemNames &&
                              notification.unclosedItemNames.length > 0 && (
                              <ul className="mb-1 ps-3" style={{ fontSize: '0.75rem' }}>
                                {notification.unclosedItemNames.map((name, i) => (
                                  <li key={i} className="text-muted">{name}</li>
                                ))}
                                {(notification.unclosedItemCount ?? 0) > notification.unclosedItemNames.length && (
                                  <li className="text-muted fst-italic">
                                    +{(notification.unclosedItemCount ?? 0) - notification.unclosedItemNames.length} weitere
                                  </li>
                                )}
                              </ul>
                            )}

                            <div className="d-flex align-items-center gap-2">
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {formatDate(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <span
                                  className="rounded-circle bg-primary"
                                  style={{ width: '0.5rem', height: '0.5rem', display: 'inline-block' }}
                                ></span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dismiss button */}
                        <button
                          type="button"
                          className="btn btn-sm text-muted p-0 ms-2 flex-shrink-0"
                          onClick={() => onDismiss(notification.id)}
                          title="Verwerfen"
                          style={{ lineHeight: 1 }}
                        >
                          <i className="bi bi-x" style={{ fontSize: '1.1rem' }}></i>
                        </button>
                      </div>

                      {/* Navigate Button */}
                      <div className="d-grid gap-2 d-sm-flex">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleNavigateToList(notification)}
                          className="flex-grow-1 flex-sm-grow-0"
                        >
                          <i className="bi bi-arrow-right me-1"></i>
                          Zur Liste „{notification.listName}"
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="modal-footer border-0 pt-0">
          {unreadCount > 0 && (
            <Button variant="outline-secondary" size="sm" onClick={onMarkAllAsRead}>
              <i className="bi bi-check2-all me-1"></i>
              Alle gelesen
            </Button>
          )}
          <Button variant="outline-secondary" onClick={onClose} className="ms-auto">
            Schließen
          </Button>
        </div>
      )}
    </Modal>
  );
};
