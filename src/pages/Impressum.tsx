const Impressum = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="h2 mb-4">Impressum</h1>

          <section className="mb-4">
            <h2 className="h5 mb-3">Angaben gemäß § 5 TMG</h2>
            <p>
              <strong>Amyaro Listen App</strong><br />
              Privates Hobby-Projekt<br />
              Verantwortlich: Yannick Murray<br />
              Fordamm 12, 12107, Berlin<br />
              Deutschland
            </p>
          </section>

            <section className="mb-4">
            <h2 className="h5 mb-3">Kontakt</h2>
            <p>
              E-Mail: yannick.Murray89 [at] gmail [dot] com
            </p>
          </section>          <section className="mb-4">
            <h2 className="h5 mb-3">Hinweis</h2>
            <p className="text-muted">
              Diese App ist ein privates, nicht-kommerzielles Hobby-Projekt. 
              Es werden keine Gewinne erzielt oder Daten zu kommerziellen Zwecken erhoben.
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

export default Impressum;