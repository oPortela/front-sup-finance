import '../styles/global.css';

export default function Layout({ titulo, subtitulo, onVoltar, children, usuarioLogado }) {
  const nomeExibicao = usuarioLogado?.nome || '';

  const obterIniciais = (nome) => {
    if (!nome) return '?';
    const partes = nome.trim().split(' ').filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  return (
    <div>
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-brand-icon">🏢</div>
          Portal do Supervisor
        </div>
        <div className="topnav-right">
          {nomeExibicao && <span className="topnav-user">{nomeExibicao}</span>}
          <div className="topnav-avatar">{obterIniciais(nomeExibicao)}</div>
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
