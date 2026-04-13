import '../styles/global.css';
import sigweb from '../assets/logo-1.png';

const modulos = [
  {
    id: 'limite',
    icone: '💳',
    titulo: 'Limite de Crédito',
    descricao: 'Solicitar aumento ou revisão de limite para o cliente.',
  },
  {
    id: 'plano',
    icone: '🗓️',
    titulo: 'Plano de Pagamento',
    descricao: 'Alterar prazos e condições financeiras do cliente.',
  },
  {
    id: 'recadastro',
    icone: '🔄',
    titulo: 'Recadastro de Cliente',
    descricao: 'Atualizar dados cadastrais do cliente no sistema.',
    emDesenvolvimento: true,
  },
  {
    id: 'negociacao',
    icone: '🤝',
    titulo: 'Solicitação de Negociação',
    descricao: 'Abrir negociação em itens e descontos.',
    emDesenvolvimento: true,
  },
  {
    id: 'sigweb',
    icone: sigweb,
    tipoIcone: 'imagem',
    titulo: 'SigWeb',
    descricao: 'Acessar o sistema SigWeb.',
    url: "http://177.69.36.17:3001/users/sign_in"
  }
];

export default function Home({ onNavegar, usuarioLogado }) {
  const nomeExibicao = usuarioLogado?.nome || 'Usuário';
  const codSupervisor = usuarioLogado.codsupervisor || 0;

  const obterIniciaris = (nome) => {
    if (!nome) return 'US';

    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length -1][0]).toUpperCase();
  };

  const handleCliquemodulo = (modulo) => {
    if (modulo.url) {
      window.open(modulo.url, '_blank', 'noopener, noreferrer');
    }else {
      onNavegar(modulo.id);
    }
  };

  return (
    <div>
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="topnav-brand-icon">🏢</div>
          Portal do Supervisor
        </div>
        <div className="topnav-right">
          <span className="topnav-user">{nomeExibicao}</span>
          <span className="topnav-user">{codSupervisor}</span>
          <div className="topnav-avatar">{obterIniciaris(nomeExibicao)}</div>
        </div>
      </nav>

      <div className="page-wrapper">
        <div className="home-hero">
          <h1 className="home-hero-title">Bem-vindo ao SigFácil</h1>
          <p className="home-hero-sub">Selecione um módulo abaixo para iniciar uma solicitação.</p>
        </div>

        <p className="home-section-label">Módulos disponíveis</p>

        <div className="modules-grid">
          {modulos.map((m) => (
            <button
              key={m.id}
              // Se estiver em desenvolvimento, adiciona uma classe extra para ficar "apagadinho"
              className={`module-card ${m.emDesenvolvimento ? 'module-disabled' : ''}`}
              data-mod={m.id}
              onClick={() => {
                // Trava o clique e avisa o usuário
                if (m.emDesenvolvimento) {
                  alert('🚧 Este módulo estará disponível em breve!');
                  return;
                }
                handleCliquemodulo(m);
              }}
            >
              {/* === NOVA ETIQUETA AQUI === */}
              {m.emDesenvolvimento && (
                <div className="badge-em-breve">Em breve</div>
              )}
              {/* ========================== */}

              <div className="module-card-icon-wrap">
                {m.tipoIcone === 'imagem' ? (
                  <img 
                    src={m.icone} 
                    alt={`Logo ${m.titulo}`} 
                    className="module-card-img-icon"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain'}}
                  />
                ) : (
                  m.icone
                )}
              </div>
              <h2 className="module-card-title">{m.titulo}</h2>
              <p className="module-card-desc">{m.descricao}</p>
              
              {/* Se não estiver em desenvolvimento, mostra a setinha, senão mostra um cadeado */}
              <span className="module-card-arrow">
                {m.emDesenvolvimento ? '🔒' : '→'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
