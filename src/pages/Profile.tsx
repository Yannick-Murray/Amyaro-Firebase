import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

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