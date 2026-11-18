import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ListsProvider } from './context/ListsContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Layout/Loading';
import AuthWrapper from './components/Auth/AuthWrapper';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { peekAuthRedirect } from './utils/authRedirect';
import './App.css';

// Seiten werden lazy geladen, damit das initiale Bundle klein bleibt
// und schwere Abhängigkeiten (z. B. Charts, Drag & Drop) erst bei Bedarf laden.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ListDetail = lazy(() => import('./pages/ListDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Statistics = lazy(() => import('./pages/Statistics'));
const AuthAction = lazy(() => import('./pages/AuthAction'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Impressum = lazy(() => import('./pages/Impressum'));
const Invitations = lazy(() => import('./pages/Invitations'));

// Auth-Route Component (für Login/Register)
const AuthRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    // Nach Login/Registrierung zurück zum ursprünglichen Ziel (z. B. Einladung).
    const from = (
      location.state as {
        from?: { pathname?: string; search?: string; hash?: string };
      } | null
    )?.from;
    const stateRedirect = from?.pathname
      ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
      : null;
    const target = stateRedirect ?? peekAuthRedirect() ?? '/';

    return <Navigate to={target} replace />;
  }

  return (
    <Layout>
      <AuthWrapper />
    </Layout>
  );
};

// Main App Component mit Routing
const AppContent = () => {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
      <Routes>
        {/* Auth Action Route - für Email Verification Links */}
        <Route path="/__/auth/action" element={<AuthAction />} />
        
        {/* Auth Route - Login/Register */}
        <Route path="/auth" element={<AuthRoute />} />
        
        {/* Protected Routes - Nur für angemeldete Benutzer */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/list/:id" element={
          <ProtectedRoute>
            <Layout>
              <ListDetail />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/invitations" element={
          <ProtectedRoute>
            <Layout>
              <Invitations />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/statistics" element={
          <ProtectedRoute>
            <Layout>
              <Statistics />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/impressum" element={<Impressum />} />
        
        {/* Catch-all Route - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Router>
  );
};

// App Component mit AuthProvider und ListsProvider
function App() {
  return (
    <AuthProvider>
      <ListsProvider>
        <AppContent />
      </ListsProvider>
    </AuthProvider>
  );
}

export default App;
