import '../styles/global.css';
import teste from '../assets/hero.png';

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
  },
  {
    id: 'negociacao',
    icone: '🤝',
    titulo: 'Solicitação de Negociação',
    descricao: 'Abrir negociação em itens e descontos.',
  },
  {
    id: 'sigweb',
    icone: teste,//'📊',
    tipoIcone: 'imagem',
    titulo: 'SigWeb',
    descricao: 'Acessar o sistema SigWeb.',
    url: "http://177.69.36.17:3001/users/sign_in"
  }
];

export default function Home({ onNavegar }) {
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
          <span className="topnav-user">Matheus Marques</span>
          <div className="topnav-avatar">MM</div>
        </div>
      </nav>

      <div className="page-wrapper">
        <div className="home-hero">
          <h1 className="home-hero-title">Bem-vindo ao Portal 👋</h1>
          <p className="home-hero-sub">Selecione um módulo abaixo para iniciar uma solicitação.</p>
        </div>

        <p className="home-section-label">Módulos disponíveis</p>

        <div className="modules-grid">
          {modulos.map((m) => (
            <button
              key={m.id}
              className="module-card"
              data-mod={m.id}
              onClick={() => handleCliquemodulo(m)}
            >
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
              <span className="module-card-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
