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
              Mit der Registrierung stimmst du diesen Bedingungen zu.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">2. Registrierung und Konto</h2>
            <ul>
              <li>Pro Person ist nur ein Konto erlaubt</li>
              <li>Es darf kein Konto zur Ausführung schhädlicher Handlungen angelegt werden</li>
              <li>Zugangsdaten sollten geheim gehalten werden</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">3. Nutzung der App</h2>
            <p>Die App dient zur kollaborativen Organisation von Aufgaben und Listen. Untersagt ist:</p>
            <ul>
              <li>Illegale oder schädliche Inhalte</li>
              <li>Spam oder unerwünschte Einladungen</li>
              <li>Missbrauch der Sharing-Funktion</li>
              <li>Versuche, die Sicherheit zu umgehen</li>
              <li>jegliche Form von Rassismus oder anderen menschenverachtenden Inhalten</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">4. Datenschutz</h2>
            <p>
              Ich werde keine Daten erheben, verkaufen und/oder auswerten. Alle erhobenen Daten sind technischer Natur und dienen der Lauffähigkeit dieser Web Applikation. 
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">5. Haftung</h2>
            <p>
              Die Nutzung erfolgt auf eigene Verantwortung. Ich kann und werde keinerlei Haftung übernehmen.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">6. Kündigung</h2>
            <p>
              Du kannst dein Konto jederzeit in den Profileinstellungen löschen.
              Ich behalte mir vor, Konten bei Missbrauch zu sperren.
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