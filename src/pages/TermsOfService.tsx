const TermsOfService = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="h2 mb-4">Nutzungsbedingungen</h1>
          
          <p className="text-muted mb-4">
            Stand: November 2025
          </p>

          <section className="mb-5">
            <h2 className="h4 mb-3">1. Geltungsbereich</h2>
            <p>
              Diese Nutzungsbedingungen regeln die Nutzung der Amyaro Todo-List App.
              Mit der Registrierung stimmen Sie diesen Bedingungen zu.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">2. Registrierung und Konto</h2>
            <ul>
              <li>Sie müssen mindestens 13 Jahre alt sein</li>
              <li>Pro Person ist nur ein Konto erlaubt</li>
              <li>Geben Sie wahrheitsgemäße Informationen an</li>
              <li>Halten Sie Ihre Zugangsdaten geheim</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">3. Nutzung der App</h2>
            <p>Die App dient zur Organisation von Aufgaben und Listen. Untersagt ist:</p>
            <ul>
              <li>Illegale oder schädliche Inhalte</li>
              <li>Spam oder unerwünschte Einladungen</li>
              <li>Missbrauch der Sharing-Funktion</li>
              <li>Versuche, die Sicherheit zu umgehen</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">4. Datenschutz</h2>
            <p>
              Der Schutz Ihrer Daten ist uns wichtig. Details finden Sie in unserer{' '}
              <button 
                onClick={() => window.location.href = '/privacy'} 
                className="btn btn-link p-0 text-decoration-none"
              >
                Datenschutzerklärung
              </button>.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">5. Haftung</h2>
            <p>
              Die Nutzung erfolgt auf eigene Verantwortung. Wir übernehmen keine 
              Haftung für Datenverlust oder Schäden durch die Nutzung der App.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">6. Kündigung</h2>
            <p>
              Sie können Ihr Konto jederzeit in den Profileinstellungen löschen.
              Wir behalten uns vor, Konten bei Missbrauch zu sperren.
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

export default TermsOfService;