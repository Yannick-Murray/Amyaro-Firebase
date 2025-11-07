import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ListService } from '../services/listService';
import { auth, db } from '../config/firebase';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="amyaro-card p-4">
            <div className="text-center mb-4">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profil" className="rounded-circle" style={{width: '80px', height: '80px'}} />
                ) : (
                  <i className="bi bi-person-circle display-4"></i>
                )}
              </div>
              <h2>{user.displayName || 'Unbekannter Benutzer'}</h2>
              <p className="text-muted">{user.email}</p>
            </div>

            <div className="mb-4">
              <h5 className="mb-3">Account-Informationen</h5>
              <div className="row">
                <div className="col-sm-4">
                  <strong>Name:</strong>
                </div>
                <div className="col-sm-8">
                  {user.displayName || 'Nicht angegeben'}
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-4">
                  <strong>E-Mail:</strong>
                </div>
                <div className="col-sm-8">
                  {user.email}
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-4">
                  <strong>Registriert:</strong>
                </div>
                <div className="col-sm-8">
                  {new Date(user.createdAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-outline-primary" disabled>
                <i className="bi bi-person-gear me-2"></i>
                Profil bearbeiten (Coming Soon)
              </button>
              <button className="btn btn-outline-secondary" disabled>
                <i className="bi bi-key me-2"></i>
                Passwort ändern (Coming Soon)
              </button>
              <hr />
              
              {/* 🔒 GDPR: Account Deletion */}
              <div className="mb-3">
                <h6 className="text-danger">Gefährliche Aktionen</h6>
                <p className="text-muted small">
                  Diese Aktionen können nicht rückgängig gemacht werden.
                </p>
                <button
                  className="btn btn-outline-danger"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      'Account wirklich löschen?\n\n' +
                      'WARNUNG: Diese Aktion kann nicht rückgängig gemacht werden!\n' +
                      '• Alle Ihre Listen und Items werden gelöscht\n' +
                      '• Sie werden aus allen geteilten Listen entfernt\n' +
                      '• Ihre persönlichen Daten werden permanent gelöscht\n\n' +
                      'Wenn Sie fortfahren möchten, klicken Sie OK.'
                    );

                    if (!confirmed) return;

                    try {
                      setDeleting(true);

                      // Ensure we have a current user id
                      const uid = auth.currentUser?.uid || user?.uid;
                      if (!uid) throw new Error('Kein angemeldeter Benutzer gefunden');

                      // 1) Lösche alle eigenen Listen (inkl. Items & Kategorien)
                      const allLists = await ListService.getUserLists(uid);
                      const ownedLists = allLists.filter(l => l.userId === uid);

                      for (const list of ownedLists) {
                        try {
                          await ListService.deleteList(list.id);
                        } catch (err) {
                          console.warn('Fehler beim Löschen der Liste', list.id, err);
                        }
                      }

                      // 2) Entferne den Benutzer von allen geteilten Listen
                      const sharedLists = allLists.filter(l => l.sharedWith && Array.isArray(l.sharedWith) && l.sharedWith.includes(uid) && l.userId !== uid);
                      for (const list of sharedLists) {
                        try {
                          const newShared = (list.sharedWith || []).filter((id: string) => id !== uid);
                          await ListService.updateList(list.id, { sharedWith: newShared });
                        } catch (err) {
                          console.warn('Fehler beim Entfernen aus geteilter Liste', list.id, err);
                        }
                      }

                      // 3) Lösche Firestore Nutzer-Dokument
                      try {
                        await deleteDoc(doc(db, 'users', uid));
                      } catch (err) {
                        console.warn('Benutzer-Dokument konnte nicht gelöscht werden:', err);
                      }

                      // 4) Lösche Firebase Auth User
                      try {
                        if (auth.currentUser) {
                          await deleteUser(auth.currentUser);
                        }
                      } catch (err: any) {
                        // If reauthentication is required, surface a helpful error
                        if (err?.code === 'auth/requires-recent-login') {
                          alert('Aus Sicherheitsgründen muss der Benutzer kürzlich angemeldet sein. Bitte melden Sie sich erneut an und versuchen Sie die Löschung noch einmal.');
                          return;
                        }
                        throw err;
                      }

                      alert('Ihr Account wurde erfolgreich gelöscht.');
                      // Navigate to homepage - user should now be signed out
                      navigate('/');
                    } catch (error: any) {
                      console.error('Fehler beim Löschen des Accounts:', error);
                      alert('Fehler beim Löschen des Accounts: ' + (error?.message || 'Unbekannter Fehler'));
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                >
                  <i className="bi bi-trash me-2"></i>
                  {deleting ? 'Lösche...' : 'Account permanent löschen'}
                </button>
              </div>
              
              <hr />
              <button 
                className="btn btn-danger"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;