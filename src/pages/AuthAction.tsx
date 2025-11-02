import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthAction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasExecuted = useRef(false);

  useEffect(() => {
    const handleEmailVerification = async () => {
      if (hasExecuted.current) {
        console.log('AuthAction: Already executed, skipping...');
        return;
      }
      hasExecuted.current = true;

      try {
        const mode = searchParams.get('mode');
        const actionCode = searchParams.get('oobCode');

        if (!actionCode || mode !== 'verifyEmail') {
          setStatus('error');
          setMessage('Ungültiger Verifikationslink.');
          return;
        }

        console.log('AuthAction: Applying action code...');
        await applyActionCode(auth, actionCode);
        console.log('AuthAction: Success');

        if (auth.currentUser) {
          await auth.currentUser.reload();
          
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            emailVerified: true,
            updatedAt: serverTimestamp(),
          });

          console.log('AuthAction: Firestore updated, logging out user...');
          
          // Benutzer ausloggen um kompletten Auth-Refresh zu erzwingen
          await signOut(auth);

          window.dispatchEvent(new CustomEvent('userDataUpdated'));
        }

        setStatus('success');
        setMessage('E-Mail erfolgreich verifiziert! Du wirst zur Anmeldung weitergeleitet...');

        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);      } catch (error: any) {
        console.error('AuthAction error:', error);
        
        if (error.code === 'auth/invalid-action-code' && auth.currentUser?.emailVerified) {
          setStatus('success');
          setMessage('E-Mail bereits verifiziert! Du wirst zur Anmeldung weitergeleitet...');
          
          // Auch hier ausloggen für konsistentes Verhalten
          await signOut(auth);
          
          setTimeout(() => navigate('/auth', { replace: true }), 3000);
          return;
        }
        
        setStatus('error');
        setMessage('Fehler bei der E-Mail-Verifizierung.');
      }
    };

    handleEmailVerification();
  }, [searchParams, navigate]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <h1>Amyaro</h1>
        <div className={`alert ${status === 'success' ? 'alert-success' : status === 'error' ? 'alert-danger' : 'alert-info'}`}>
          {status === 'loading' && 'Verifiziere E-Mail...'}
          {status !== 'loading' && message}
        </div>
        {status === 'error' && (
          <button onClick={() => navigate('/auth')} className="btn btn-primary">
            Zurück zur Anmeldung
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthAction;
