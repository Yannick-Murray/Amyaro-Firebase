import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import PasswordReset from './PasswordReset';

type AuthMode = 'login' | 'register' | 'reset';

const AuthWrapper = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const renderAuthComponent = () => {
    switch (mode) {
      case 'login':
        return (
          <Login
            onSwitchToRegister={() => setMode('register')}
            onSwitchToPasswordReset={() => setMode('reset')}
          />
        );
      case 'register':
        return (
          <Register
            onSwitchToLogin={() => setMode('login')}
          />
        );
      case 'reset':
        return (
          <PasswordReset
            onBack={() => setMode('login')}
          />
        );
      default:
        return <Login onSwitchToRegister={() => setMode('register')} />;
    }
  };

  return (
    <div className="container-fluid py-5">
      {renderAuthComponent()}
    </div>
  );
};

export default AuthWrapper;