const Loading = () => {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border spinner-border-custom mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Lädt...</span>
        </div>
        <h5 className="text-muted">Amyaro wird geladen...</h5>
      </div>
    </div>
  );
};

export default Loading;