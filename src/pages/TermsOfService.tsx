const TermsOfService = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="h2 mb-4">Nutzungsbedingungen</h1>
          
          <p className="text-muted mb-4">
            Stand: November 2025
          </p>

          <div className="mb-4 p-3 bg-light rounded">
            <p className="mb-2"><strong>Betreiber:</strong> Yannick Murray</p>
            <p className="mb-2"><strong>Adresse:</strong> Fordamm 12, 12107 Berlin, Deutschland</p>
            <p className="mb-0"><strong>E-Mail:</strong> yannick.Murray89 [at] gmail [dot] com</p>
          </div>

          <section className="mb-5">
            <h2 className="h4 mb-3">1. Geltungsbereich</h2>
            <p>
              Diese Nutzungsbedingungen regeln die Nutzung meiner Amyaro List App.
              Diese App ist mein privates Hobby-Projekt und dient keinem kommerziellen Nutzen.
              Mit der Registrierung stimmst du diesen Bedingungen zu.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">2. Registrierung und Konto</h2>
            <p>Für die Nutzung meiner App gelten folgende Regeln:</p>
            <ul>
              <li>Pro Person ist nur ein Konto erlaubt</li>
              <li>Es darf kein Konto zur Ausführung schädlicher Handlungen angelegt werden</li>
              <li>Deine Zugangsdaten solltest du geheim halten</li>
              <li>Du bist für alle Aktivitäten in deinem Konto verantwortlich</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">3. Nutzung der App</h2>
            <p>Meine App dient zur kollaborativen Organisation von Aufgaben und Listen. Folgendes ist untersagt:</p>
            <ul>
              <li>Illegale oder schädliche Inhalte</li>
              <li>Spam oder unerwünschte Einladungen</li>
             <li>Missbrauch der Sharing-Funktion</li>
              <li>Versuche, die Sicherheit zu umgehen</li>
              <li>Jegliche Form von Rassismus oder anderen menschenverachtenden Inhalten</li>
              <li>Belästigung anderer Nutzer</li>
            </ul>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">4. Datenschutz</h2>
            <p>
              Da dies ein privates, nicht-kommerzielles Hobby-Projekt ist, erhebe ich bewusst so wenig Daten wie möglich:
            </p>
            <ul>
              <li>Deine E-Mail-Adresse für die Anmeldung (über Firebase Auth)</li>
              <li>Deine Listen und Aufgaben (damit die App funktioniert)</li>
              <li>Technische Daten für den Betrieb (Server-Logs, etc.)</li>
            </ul>
            <p>
              Ich verkaufe oder analysiere keine Daten zu kommerziellen Zwecken. 
              Deine Daten werden sicher bei Google Firebase gespeichert und nur für die App-Funktionen verwendet.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">5. Haftung</h2>
            <p>
              Die Nutzung meiner App erfolgt auf deine eigene Verantwortung. Als privater Betreiber 
              eines Hobby-Projekts kann und werde ich keinerlei Haftung für Schäden, Datenverluste 
              oder Ausfälle übernehmen. Ich bemühe mich aber nach besten Kräften um einen stabilen Betrieb.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">6. Kündigung</h2>
            <p>
              Du kannst dein Konto jederzeit in den Profileinstellungen rückstandslos löschen.
              Ich behalte mir vor, Konten bei Missbrauch oder Verstößen gegen diese Bedingungen zu sperren.
              Da dies ein kostenloses Hobby-Projekt ist, gibt es keine Ansprüche auf Wiederherstellung.
            </p>
          </section>

          <section className="mb-5">
            <h2 className="h4 mb-3">7. Änderungen</h2>
            <p>
              Ich kann diese Nutzungsbedingungen jederzeit ändern. Wesentliche Änderungen werde ich 
              in der App ankündigen. Bei weiterer Nutzung nach einer Änderung stimmst du den neuen 
              Bedingungen zu.
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