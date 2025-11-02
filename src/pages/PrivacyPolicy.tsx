const PrivacyPolicy = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="h2 mb-4">Datenschutzerklärung</h1>
          
          <p className="text-muted mb-4">
            Stand: November 2025
          </p>

          <section className="mb-5">
            <h2 className="h4 mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher für die Datenverarbeitung auf dieser Website ist:<br/>
              [Ihr Name/Unternehmen]<br/>
              [Adresse]<br/>
              E-Mail: [E-Mail-Adresse]
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">2. Erhebung und Speicherung personenbezogener Daten</h2>
            <p>
              Wir erheben und verwenden Ihre personenbezogenen Daten nur, soweit dies zur 
              Bereitstellung unserer Dienste erforderlich ist:
            </p>
            <ul>
              <li><strong>E-Mail-Adresse:</strong> Für die Kontoerstellung und -verwaltung</li>
              <li><strong>Anzeigename:</strong> Zur Personalisierung Ihres Profils</li>
              <li><strong>Listen und Todo-Items:</strong> Für die Funktionalität der App</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">3. Rechtsgrundlage der Verarbeitung</h2>
            <p>
              Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) 
              und zur Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">4. Firebase und Google</h2>
            <p>
              Diese App nutzt Firebase von Google für:
            </p>
            <ul>
              <li>Authentifizierung</li>
              <li>Datenspeicherung (Firestore)</li>
            </ul>
            <p>
              Weitere Informationen finden Sie in der{' '}
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none"
              >
                Google Datenschutzerklärung
              </a>.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">5. Ihre Rechte</h2>
            <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
            <ul>
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Löschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">6. Kontakt</h2>
            <p>
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter: [E-Mail-Adresse]
            </p>
          </section>

          <div className="mt-5 pt-4 border-top">
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-secondary"
            >
              ← Zurück
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;