import '../styles/global.css';

export default function Layout({ titulo, subtitulo, onVoltar, children }) {
  return (
    <div>
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-brand-icon">🏢</div>
          Portal do Supervisor
        </div>
        <div className="topnav-right">
          <span className="topnav-user">Matheus Marques</span>
          <div className="topnav-avatar">MM</div>
        </div>
      </nav>

      <div className="page-wrapper">
        <div className="page-header">
          <div className="page-header-inner">
            <div>
              <h1 className="page-title">{titulo}</h1>
              {subtitulo && <p className="page-subtitle">{subtitulo}</p>}
            </div>
            {onVoltar && (
              <button className="btn btn-outline" onClick={onVoltar}>
                ← Voltar aos módulos
              </button>
            )}
          </div>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
