import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg amyaro-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold text-primary" to="/">
            <i className="bi bi-check2-square me-2"></i>
            Amyaro
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              {user && (
                <>
                  <li className="nav-item">
                    <Link className={isActive('/')} to="/">
                      <i className="bi bi-house me-1"></i>
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-person-circle me-1"></i>
                      {user.displayName || user.email}
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="/profile">
                          <i className="bi bi-person me-2"></i>
                          Profil
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button 
                          className="dropdown-item" 
                          type="button"
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Abmelden
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1">
        {children}
      </main>

      {/* Footer */}
              <footer className="text-center text-muted mt-5 py-4 border-top border-light">
          <div className="container">
            © 2025 Amyaro - Deine persönliche Listen App
          </div>
        </footer>
    </div>
  );
};

export default Layout;