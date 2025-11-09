import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ListsProvider } from './context/ListsContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Layout/Loading';
import AuthWrapper from './components/Auth/AuthWrapper';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ListDetail from './pages/ListDetail';
import Profile from './pages/Profile';
import AuthAction from './pages/AuthAction';
import TermsOfService from './pages/TermsOfService';
import Impressum from './pages/Impressum';
import './App.css';

// Auth-Route Component (für Login/Register)
const AuthRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
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
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/impressum" element={<Impressum />} />
        
        {/* Catch-all Route - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
