import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const EmailVerificationBanner = () => {
  const { user, resendEmailVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Nur anzeigen wenn User eingeloggt ist aber E-Mail nicht verifiziert
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await resendEmailVerification();
      setMessage('E-Mail wurde erneut gesendet!');
    } catch (error: any) {
      setMessage(error.message || 'Fehler beim Senden der E-Mail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3" role="alert">
      <div className="d-flex align-items-center">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <div>
          <strong>E-Mail-Adresse nicht bestätigt</strong><br />
          <small>
            Bitte bestätige deine E-Mail-Adresse, um alle Funktionen zu nutzen.
          </small>
        </div>
      </div>
      
      <div className="d-flex flex-column align-items-end">
        <button
          type="button"
          className="btn btn-outline-warning btn-sm"
          onClick={handleResendEmail}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
              Wird gesendet...
            </>
          ) : (
            <>
              <i className="bi bi-envelope me-1"></i>
              E-Mail erneut senden
            </>
          )}
        </button>
        
        {message && (
          <small className={`mt-1 ${message.includes('Fehler') ? 'text-danger' : 'text-success'}`}>
            {message}
          </small>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;