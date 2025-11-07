import React, { useState, useEffect } from 'react';
import { UserService } from '../../services/userService';

interface UserDisplayProps {
  userId: string;
  showEmail?: boolean;
  showAvatar?: boolean;
  fallback?: string;
  className?: string;
}

/**
 * Robust User Display Component
 * Handles deleted/non-existent users gracefully
 */
export const UserDisplay: React.FC<UserDisplayProps> = ({
  userId,
  showEmail = false,
  showAvatar = false,
  fallback = 'Unbekannter Benutzer',
  className = ''
}) => {
  const [userData, setUserData] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState<string>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        
        if (showEmail || showAvatar) {
          // Load full user data
          const data = await UserService.getUserData(userId);
          setUserData(data);
          setDisplayName(data?.displayName || data?.email || fallback);
        } else {
          // Load only display name
          const name = await UserService.getUserDisplayName(userId);
          setDisplayName(name);
        }
      } catch (error) {
        console.warn('Error loading user:', userId, error);
        setDisplayName(fallback);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUser();
    } else {
      setDisplayName(fallback);
      setLoading(false);
    }
  }, [userId, showEmail, showAvatar, fallback]);

  if (loading) {
    return (
      <span className={`text-muted ${className}`}>
        <i className="bi bi-three-dots"></i>
      </span>
    );
  }

  return (
    <span className={className}>
      {showAvatar && (
        <span className="me-2">
          {userData?.photoURL ? (
            <img
              src={userData.photoURL}
              alt={displayName}
              className="rounded-circle"
              style={{ width: '24px', height: '24px' }}
            />
          ) : (
            <i className="bi bi-person-circle text-muted"></i>
          )}
        </span>
      )}
      
      <span className={userData ? '' : 'text-muted fst-italic'}>
        {displayName}
      </span>
      
      {showEmail && userData?.email && userData.email !== displayName && (
        <small className="text-muted ms-1">({userData.email})</small>
      )}
    </span>
  );
};

interface UserListProps {
  userIds: string[];
  max?: number;
  showMore?: boolean;
  className?: string;
}

/**
 * Display a list of users with robust fallbacks
 */
export const UserList: React.FC<UserListProps> = ({
  userIds,
  max = 3,
  showMore = true,
  className = ''
}) => {
  const displayIds = userIds.slice(0, max);
  const remainingCount = userIds.length - max;

  return (
    <div className={className}>
      {displayIds.map((userId, index) => (
        <React.Fragment key={userId}>
          {index > 0 && ', '}
          <UserDisplay userId={userId} />
        </React.Fragment>
      ))}
      
      {showMore && remainingCount > 0 && (
        <span className="text-muted ms-1">
          und {remainingCount} weitere
        </span>
      )}
    </div>
  );
};