import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPassword } from '../../utils/helpers';
import type { RegisterFormData } from '../../types';

interface RegisterProps {
  onSwitchToLogin?: () => void;
}

const Register = ({ onSwitchToLogin }: RegisterProps) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

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
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.displayName.trim().length < 2) {
      setError('Name muss mindestens 2 Zeichen haben');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName.trim());
      // Nach erfolgreicher Registrierung Bestätigungsmeldung anzeigen
      setShowVerificationMessage(true);
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Registrierung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="amyaro-card p-4">
          <div className="text-center mb-4">
            <i className="bi bi-person-plus display-4 text-primary"></i>
            <h2 className="mt-2">Registrieren</h2>
            <p className="text-muted">Erstelle deinen Amyaro-Account</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {showVerificationMessage && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-envelope-check me-2"></i>
              <strong>Registrierung erfolgreich!</strong><br />
              Wir haben dir eine E-Mail zur Bestätigung deiner E-Mail-Adresse gesendet. 
              Bitte überprüfe dein Postfach und klicke auf den Link in der E-Mail.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="displayName" className="form-label">
                Vollständiger Name
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Dein Name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

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
                  placeholder="Mindestens 6 Zeichen"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Passwort bestätigen
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock-fill"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Passwort wiederholen"
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
                  Wird registriert...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Registrieren
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            {onSwitchToLogin && (
              <span className="text-muted">
                Bereits registriert?{' '}
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={onSwitchToLogin}
                >
                  Hier anmelden
                </button>
              </span>
            )}
          </div>

          <div className="mt-3">
            <small className="text-muted">
              Durch die Registrierung stimmst du unseren{' '}
              <a href="#" className="text-decoration-none">Nutzungsbedingungen</a>{' '}
              und der{' '}
              <a href="#" className="text-decoration-none">Datenschutzerklärung</a>{' '}
              zu.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;