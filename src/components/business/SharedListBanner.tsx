import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { List } from '../../types/todoList';

interface SharedListBannerProps {
  list: List;
  currentUserId?: string;
}

export const SharedListBanner: React.FC<SharedListBannerProps> = ({ 
  list, 
  currentUserId 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Prüfe ob die Liste mit dem aktuellen User geteilt wurde (User ist nicht der ursprüngliche Ersteller)
  const isSharedWithUser = currentUserId && list.userId !== currentUserId && list.sharedWith?.includes(currentUserId);

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (!list.userId || !isSharedWithUser) {
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', list.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreatorName(userData.displayName || userData.email || 'Unbekannter Nutzer');
        } else {
          setCreatorName('Unbekannter Nutzer');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Creator-Namens:', error);
        setCreatorName('Unbekannter Nutzer');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorName();
  }, [list.userId, isSharedWithUser]);
  
  // Wenn die Liste nicht geteilt wurde, zeige nichts an
  if (!isSharedWithUser) {
    return null;
  }

  return (
    <div className="mb-3">
      {/* Compact Header - Always Visible */}
      <div 
        className="d-flex align-items-center justify-content-between py-2 px-3 bg-light border rounded cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderLeft: '4px solid #0d6efd'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-share text-primary" style={{ fontSize: '1rem' }}></i>
          {loading ? (
            <span className="text-primary fw-medium small">Geteilte Liste</span>
          ) : (
            <span className="text-primary fw-medium small">geteilt von {creatorName}</span>
          )}
        </div>
        
        <i 
          className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted`}
          style={{ 
            fontSize: '0.875rem',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'
          }}
        ></i>
      </div>
      
      {/* Expandable Content */}
      {isExpanded && (
        <div 
          className="border border-top-0 rounded-bottom bg-white p-3"
          style={{ 
            borderLeft: '4px solid #0d6efd',
            animation: 'fadeInSharedBanner 0.2s ease-in-out'
          }}
        >
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-info-circle text-info mt-1" style={{ fontSize: '1.25rem' }}></i>
            <div>
              <h6 className="mb-2 text-primary">
                Geteilte Liste
              </h6>
              {loading ? (
                <p className="mb-0 text-muted small">
                  Diese Liste wurde von einem anderen Nutzer mit Ihnen geteilt. 
                  Sie können Artikel hinzufügen, bearbeiten und als erledigt markieren.
                </p>
              ) : (
                <p className="mb-0 text-muted small">
                  <strong>{creatorName}</strong> hat diese Liste mit Ihnen geteilt. 
                  Sie können Artikel hinzufügen, bearbeiten und als erledigt markieren.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};