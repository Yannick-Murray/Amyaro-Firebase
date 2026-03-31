import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { useInvitations } from '../../hooks/useInvitations';
import { useActivityNotifications } from '../../hooks/useActivityNotifications';
import { InvitationsModal } from '../business/InvitationsModal';
import { ActivityNotificationsModal } from '../business/ActivityNotificationsModal';
import type { ActivityNotification } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  
  const { 
    invitations, 
    loading: invitationsLoading, 
    unreadCount: invitationsUnreadCount, 
    acceptInvitation, 
    declineInvitation 
  } = useInvitations();

  const {
    notifications: activityNotifications,
    loading: activityLoading,
    unreadCount: activityUnreadCount,
    markAsRead: markActivityAsRead,
    markAllAsRead: markAllActivityAsRead,
    dismissNotification
  } = useActivityNotifications();

  const totalUnreadCount = invitationsUnreadCount + activityUnreadCount;
  const unreadActivities = activityNotifications.filter(n => !n.isRead);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleUserDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const closeDropdown = () => {
    setIsUserDropdownOpen(false);
  };

  const openInvitationsModal = () => {
    setIsInvitationsModalOpen(true);
    setIsUserDropdownOpen(false);
  };

  const openActivityModal = () => {
    setIsActivityModalOpen(true);
    setIsUserDropdownOpen(false);
  };

  const handleActivityNotificationClick = async (notification: ActivityNotification) => {
    setIsUserDropdownOpen(false);
    if (!notification.isRead) {
      await markActivityAsRead(notification);
    }
    navigate(`/list/${notification.listId}`);
  };

  return (
    <>
      {/* Navigation */}
      <nav className="navbar amyaro-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold text-primary" to="/" onClick={closeDropdown}>
            <i className="bi bi-check2-square me-2"></i>
            Amyaro
          </Link>
          
          {/* Account Icon */}
          {user && (
            <div className="position-relative">
              <button
                className="btn btn-link text-decoration-none border-0 bg-transparent text-secondary p-2 position-relative"
                type="button"
                onClick={toggleUserDropdown}
                aria-expanded={isUserDropdownOpen}
                style={{ fontSize: '1.25rem' }}
              >
                <i className="bi bi-person-circle"></i>
                {/* Notification Bubble */}
                {totalUnreadCount > 0 && (
                  <span
                    className="position-absolute badge rounded-pill bg-danger"
                    style={{
                      top: '4px',
                      right: '4px',
                      fontSize: '0.55rem',
                      minWidth: '1.1rem',
                      height: '1.1rem',
                      padding: '0 3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      border: '1.5px solid white',
                      pointerEvents: 'none',
                    }}
                  >
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    <span className="visually-hidden">Neue Benachrichtigungen</span>
                  </span>
                )}
              </button>
              
              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="dropdown-menu show position-absolute end-0" style={{ zIndex: 1050, minWidth: '200px' }}>
                  <div className="dropdown-header">
                    <small className="text-muted">{user.displayName || user.email}</small>
                  </div>
                  <div className="dropdown-divider"></div>
                  
                  {/* Einladungen Menüpunkt */}
                  <button 
                    className={`dropdown-item d-flex align-items-center justify-content-between ${invitationsUnreadCount > 0 ? 'bg-light' : ''}`}
                    type="button"
                    onClick={openInvitationsModal}
                  >
                    <span>
                      <i className="bi bi-envelope me-2"></i>
                      Einladungen
                    </span>
                    {invitationsUnreadCount > 0 && (
                      <span className="badge bg-primary rounded-pill">{invitationsUnreadCount}</span>
                    )}
                  </button>

                  {/* Aktivitäten Menüpunkt */}
                  <button
                    className={`dropdown-item d-flex align-items-center justify-content-between ${activityUnreadCount > 0 ? 'bg-light' : ''}`}
                    type="button"
                    onClick={openActivityModal}
                  >
                    <span>
                      <i className="bi bi-bell me-2"></i>
                      Aktivitäten
                    </span>
                    {activityUnreadCount > 0 && (
                      <span className="badge bg-primary rounded-pill">{activityUnreadCount}</span>
                    )}
                  </button>

                  {/* Aktivitäten Vorschau: max. 3 ungelesene */}
                  {unreadActivities.slice(0, 3).map(n => (
                    <button
                      key={n.id}
                      className="dropdown-item py-1 px-3"
                      type="button"
                      onClick={() => handleActivityNotificationClick(n)}
                      style={{ borderLeft: '3px solid var(--bs-primary)', fontSize: '0.8rem' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi flex-shrink-0 ${n.type === 'list_closed' ? 'bi-lock text-warning' : n.type === 'list_reopened' ? 'bi-unlock text-success' : 'bi-plus-circle text-primary'}`} style={{ fontSize: '0.75rem' }}></i>
                        <span className="text-truncate" style={{ maxWidth: '160px' }}>
                          <strong>{n.fromUserName?.split(' ')[0]}</strong>
                          {' '}→{' '}
                          {n.listName}
                        </span>
                      </div>
                    </button>
                  ))}

                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item" to="/profile" onClick={closeDropdown}>
                    <i className="bi bi-person me-2"></i>
                    Profil
                  </Link>
                  <Link className="dropdown-item" to="/statistics" onClick={closeDropdown}>
                    <i className="bi bi-bar-chart me-2"></i>
                    Statistiken
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item" 
                    type="button"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Backdrop für User-Dropdown */}
      {isUserDropdownOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040 }}
          onClick={closeDropdown}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-grow-1">
        {children}
      </main>

      {/* Einladungen Modal */}
      <InvitationsModal
        isOpen={isInvitationsModalOpen}
        onClose={() => setIsInvitationsModalOpen(false)}
        invitations={invitations}
        loading={invitationsLoading}
        onAccept={acceptInvitation}
        onDecline={declineInvitation}
      />

      {/* Aktivitäten Modal */}
      <ActivityNotificationsModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        notifications={activityNotifications}
        loading={activityLoading}
        onMarkAsRead={markActivityAsRead}
        onMarkAllAsRead={markAllActivityAsRead}
        onDismiss={dismissNotification}
      />

      {/* Footer */}
      <footer className="text-center text-muted mt-5 py-4 border-top border-light">
        <div className="container">
          <div className="mb-2">
            © 2026 Amyaro - Deine persönliche Listen App
          </div>
          <div className="small">
            <Link to="/impressum" className="text-muted text-decoration-none me-3">
              Impressum
            </Link>
            <Link to="/terms" className="text-muted text-decoration-none">
              Nutzungsbedingungen
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;