import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const EmailVerificationRequired = () => {
  const { user, resendEmailVerification, checkEmailVerification, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await resendEmailVerification();
      setMessage('E-Mail wurde erneut gesendet! Bitte überprüfe dein Postfach (auch den Spam-Ordner).');
    } catch (error: any) {
      setMessage(error.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setMessage('');
    
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setMessage('E-Mail erfolgreich verifiziert! Die Seite wird neu geladen...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage('E-Mail ist noch nicht verifiziert. Bitte klicke auf den Link in der E-Mail.');
      }
    } catch (error: any) {
      setMessage(error.message || 'Fehler beim Überprüfen der Verifizierung');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container px-3">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="amyaro-card p-4 p-md-5 text-center">
              {/* App Logo */}
              <div className="mb-4">
                <h1 className="h4 text-primary fw-bold mb-0">
                  <i className="bi bi-check2-square me-2"></i>
                  Amyaro
                </h1>
              </div>

              {/* Titel */}
              <h2 className="h5 fw-bold mb-3">
                Fast geschafft! 🎉
              </h2>

              {/* Beschreibung */}
              <p className="text-muted mb-4">
                Wir haben eine Bestätigung an<br />
                <strong className="text-primary">{user?.email}</strong><br />
                gesendet. Klicke einfach auf den Link!
              </p>

              {/* Nachricht */}
              {message && (
                <div className={`alert ${message.includes('Fehler') ? 'alert-danger' : 'alert-success'} text-start`} role="alert">
                  <small>
                    <i className={`bi ${message.includes('Fehler') ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
                    {message}
                  </small>
                </div>
              )}

              {/* Spam-Hinweis */}
              <div className="alert alert-info text-start" role="alert">
                <small>
                  <i className="bi bi-lightbulb me-2"></i>
                  <strong>Tipp:</strong> Schau auch in deinem Spam-Ordner nach!
                </small>
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-3 mb-4">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleResendEmail}
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
                      E-Mail erneut senden
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleCheckVerification}
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Überprüfe...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Ich habe den Link geklickt
                    </>
                  )}
                </button>
              </div>

              {/* Logout Link */}
              <div className="border-top pt-3">
                <button
                  type="button"
                  className="btn btn-link text-muted text-decoration-none p-0"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  <small>Mit anderem Account anmelden</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;