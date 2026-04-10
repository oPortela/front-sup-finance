import { useState, useEffect, useCallback } from 'react';

const URL_API = import.meta.env.VITE_URL_API;

// ... (STATUS_CONFIG, StatusBadge, formatarData, formatarMoeda remain exactly the same) ...

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  cor: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  aprovado:  { label: 'Aprovado',  cor: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  reprovado: { label: 'Reprovado', cor: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  cancelado: { label: 'Cancelado', cor: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
};

function StatusBadge({ status }) {
  // Map backend status codes (P, A, R) to your config keys
  const statusKeyMap = { 'P': 'pendente', 'A': 'aprovado', 'R': 'reprovado', 'C': 'cancelado' };
  const mappedStatus = statusKeyMap[status] || status; 
  const cfg = STATUS_CONFIG[mappedStatus] || STATUS_CONFIG.pendente;

  return (
    <span style={{
      background: cfg.bg, color: cfg.cor, border: `1px solid ${cfg.border}`,
      borderRadius: '20px', padding: '3px 10px', fontSize: '0.78rem',
      fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// Função que converte "2026-04-09" para "09-apr-2026"
function formatarDataParaOracle(dataIso) {
  if (!dataIso) return '';
  const meses = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const [ano, mes, dia] = dataIso.split('-');
  // Pega o número do mês (ex: '04' -> 4), subtrai 1 para o índice do array, e monta a string
  return `${dia}-${meses[parseInt(mes, 10) - 1]}-${ano}`;
}

function formatarData(dataStr) {
  if (!dataStr) return '—';
  // Handle 'YYYY-MM-DD HH:MM:SS' format from backend properly
  const d = new Date(dataStr.replace(' ', 'T')); 
  return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  if (valor === undefined || valor === null || valor === '') return '—';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ConsultaSolicitacoes({ titulo, endpointBase, colunas, onNovaSolicitacao }) {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  
  // MOCK RCAS for the filter dropdown
  const [rcasDisponiveis, setRcasDisponiveis] = useState([
     { codusur: '7045', nome: 'Matheus' },
     { codusur: '7046', nome: 'Marcos' }
  ]);

  // Data defaults: Last 30 days
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroRca, setFiltroRca] = useState('');
  const [filtroDataDe, setFiltroDataDe] = useState(trintaDiasAtras.toISOString().split('T')[0]);
  const [filtroDataAte, setFiltroDataAte] = useState(hoje.toISOString().split('T')[0]);
  const [filtroBusca, setFiltroBusca] = useState('');

  // Use useCallback so we can call this from useEffect and the 'Buscar' button
  const buscarDadosAPI = useCallback(async () => {
    if (!filtroDataDe || !filtroDataAte) return;

    setCarregando(true);
    setErro(null);
    
    try {
      const token = localStorage.getItem('token_supervisor');
      const supervisorStr = localStorage.getItem('dados_supervisor');
      const supervisorLogado = supervisorStr ? JSON.parse(supervisorStr) : { id: 300 };

      // Build the dynamic URL with query parameters expected by your FastAPI router
      const queryParams = new URLSearchParams({
        codsupervisor: supervisorLogado.id,
        dtinicio: formatarDataParaOracle(filtroDataDe),  
        dtfim: formatarDataParaOracle(filtroDataAte)
      });

      const urlFinal = `${URL_API}${endpointBase}?${queryParams.toString()}`;

      const resposta = await fetch(urlFinal, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!resposta.ok) throw new Error('Falha ao carregar solicitações.');
      const json = await resposta.json();
      
      setSolicitacoes(json.data || []);
      
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [endpointBase, filtroDataDe, filtroDataAte]);

  // Fetch data on initial mount and when dates change
  useEffect(() => {
    buscarDadosAPI();
  }, [buscarDadosAPI]);

  // Frontend filtering for text, RCA, and Status (since the API returns all statuses for the period)
  const filtradas = solicitacoes.filter((s) => {
    if (filtroStatus && s.status !== filtroStatus) return false;
    if (filtroRca && String(s.codusur) !== filtroRca) return false;

    if (filtroBusca) {
      const t = filtroBusca.toLowerCase();
      const nomeCliente = (s.cliente || '').toLowerCase();
      const codcli = String(s.codcli || '');
      if (!nomeCliente.includes(t) && !codcli.includes(t)) return false;
    }
    return true;
  });

  const limparFiltros = () => {
    setFiltroStatus('');
    setFiltroRca('');
    setFiltroBusca('');
    // We intentionally don't clear dates, otherwise the API query breaks
  };

  const temFiltroAtivo = filtroStatus || filtroRca || filtroBusca;

  return (
    <div>
      <div className="consulta-topbar">
        <div className="consulta-topbar-info">
           <h2 style={{margin: 0, fontSize: '1.2rem'}}>{titulo}</h2>
           <span className="consulta-total" style={{marginLeft: '10px', fontSize: '0.9rem', color: '#666'}}>
             {carregando ? 'Buscando...' : `${filtradas.length} encontrada(s)`}
           </span>
        </div>
        <button className="btn btn-primary" onClick={onNovaSolicitacao}>
          + Nova Solicitação
        </button>
      </div>

      <div className="consulta-filtros card">
        <div className="consulta-filtros-grid">
          
          <div className="filtro-datas">
            <input type="date" className="input" title="Data de" value={filtroDataDe} onChange={(e) => setFiltroDataDe(e.target.value)} />
            <span className="filtro-datas-sep">até</span>
            <input type="date" className="input" title="Data até" value={filtroDataAte} onChange={(e) => setFiltroDataAte(e.target.value)} />
            {/* Botão para recarregar da API com as novas datas */}
            <button className='btn btn-outline btn-sm' onClick={buscarDadosAPI}>Atualizar Banco</button>
          </div>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" className="input input-search" placeholder="Buscar cliente..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} />
          </div>

          <select className="input" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="P">Pendente</option>
            <option value="A">Aprovado</option>
            <option value="R">Reprovado</option>
          </select>

          <select className="input" value={filtroRca} onChange={(e) => setFiltroRca(e.target.value)}>
            <option value="">Todos os RCAs</option>
            {rcasDisponiveis.map((r) => (
              <option key={r.codusur} value={r.codusur}>{r.codusur} — {r.nome}</option>
            ))}
          </select>

          {temFiltroAtivo && (
            <button className="btn btn-outline btn-sm" onClick={limparFiltros}>✕ Limpar textos</button>
          )}
        </div>
      </div>

      <div className="card consulta-card">
        {carregando && <p className="loading-msg">Carregando solicitações do ERP...</p>}
        {erro && <p className="error-msg">⚠ {erro}</p>}

        {!carregando && !erro && filtradas.length === 0 && (
          <p className="empty-msg">Nenhuma solicitação encontrada.</p>
        )}

        {!carregando && !erro && filtradas.length > 0 && (
          <div className="consulta-table-wrap">
            <table className="consulta-table">
              <thead>
                <tr>
                  {colunas.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((s, i) => (
                  <tr key={s.id_solicitacao || i}>
                    {colunas.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(s) : (s[col.key] ?? '—')}
                      </td>
                    ))}
                    {/* Assuming your backend sends "P", "A", "R" for status */}
                    <td><StatusBadge status={s.status} /></td> 
                    {/* Use the specific data field from your backend dict */}
                    <td className="td-data">{formatarData(s.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export { formatarMoeda, StatusBadge, formatarData };