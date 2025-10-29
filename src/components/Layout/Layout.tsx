import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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

  return (
    <div className="min-vh-100 d-flex flex-column">
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
                className="btn btn-link text-decoration-none border-0 bg-transparent text-secondary p-2"
                type="button"
                onClick={toggleUserDropdown}
                aria-expanded={isUserDropdownOpen}
                style={{ fontSize: '1.25rem' }}
              >
                <i className="bi bi-person-circle"></i>
              </button>
              
              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="dropdown-menu show position-absolute end-0" style={{ zIndex: 1050, minWidth: '200px' }}>
                  <div className="dropdown-header">
                    <small className="text-muted">{user.displayName || user.email}</small>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item" to="/profile" onClick={closeDropdown}>
                    <i className="bi bi-person me-2"></i>
                    Profil
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