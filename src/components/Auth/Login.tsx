import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPassword } from '../../utils/helpers';
import type { LoginFormData } from '../../types';

interface LoginProps {
  onSwitchToRegister?: () => void;
  onSwitchToPasswordReset?: () => void;
}

const Login = ({ onSwitchToRegister, onSwitchToPasswordReset }: LoginProps) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Reset error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validierung
    if (!formData.email || !formData.password) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben');
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError('Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Weiterleitung erfolgt automatisch durch AuthContext
    } catch (err: any) {
      setError(err.message || 'Fehler beim Anmelden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="amyaro-card p-4">
          <div className="text-center mb-4">
            <i className="bi bi-person-circle display-4 text-primary"></i>
            <h2 className="mt-2">Anmelden</h2>
            <p className="text-muted">Bei deinem Amyaro-Account</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-Mail-Adresse
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="deine@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Passwort
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Dein Passwort"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Wird angemeldet...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Anmelden
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            {onSwitchToPasswordReset && (
              <button
                type="button"
                className="btn btn-link p-0 mb-2"
                onClick={onSwitchToPasswordReset}
              >
                Passwort vergessen?
              </button>
            )}
            <br />
            {onSwitchToRegister && (
              <span className="text-muted">
                Noch kein Account?{' '}
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={onSwitchToRegister}
                >
                  Hier registrieren
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;