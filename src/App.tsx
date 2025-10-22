import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Loading from './components/Layout/Loading';
import AuthWrapper from './components/Auth/AuthWrapper';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ListDetail from './pages/ListDetail';
import Profile from './pages/Profile';
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
        
        {/* Catch-all Route - Redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// App Component mit AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
