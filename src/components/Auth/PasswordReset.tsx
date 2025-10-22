import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/helpers';

interface PasswordResetProps {
  onBack?: () => void;
}

const PasswordReset = ({ onBack }: PasswordResetProps) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Bitte E-Mail-Adresse eingeben');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="amyaro-card p-4 text-center">
            <i className="bi bi-check-circle display-4 text-success mb-3"></i>
            <h3 className="text-success">E-Mail gesendet!</h3>
            <p className="text-muted mb-4">
              Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts an{' '}
              <strong>{email}</strong> gesendet.
            </p>
            <p className="text-muted small mb-4">
              Prüfe auch deinen Spam-Ordner, falls die E-Mail nicht in deinem Posteingang ankommt.
            </p>
            {onBack && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={onBack}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Zurück zur Anmeldung
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="amyaro-card p-4">
          <div className="text-center mb-4">
            <i className="bi bi-key display-4 text-primary"></i>
            <h2 className="mt-2">Passwort zurücksetzen</h2>
            <p className="text-muted">
              Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
            </p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
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
                  Wird gesendet...
                </>
              ) : (
                <>
                  <i className="bi bi-envelope me-2"></i>
                  E-Mail senden
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            {onBack && (
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={onBack}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Zurück zur Anmeldung
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;