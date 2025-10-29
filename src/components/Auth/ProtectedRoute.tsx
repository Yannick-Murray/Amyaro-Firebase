import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Layout/Loading';
import EmailVerificationRequired from './EmailVerificationRequired';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    // Redirect zur Login-Seite mit der aktuellen Location als State
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Prüfen ob E-Mail verifiziert ist
  if (!user.emailVerified) {
    return <EmailVerificationRequired />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;