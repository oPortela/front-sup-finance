import { useState, useEffect, useCallback } from 'react';

const URL_API = import.meta.env.VITE_URL_API;

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  cor: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  aprovado:  { label: 'Aprovado',  cor: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  reprovado: { label: 'Reprovado', cor: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  cancelado: { label: 'Cancelado', cor: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
};

const STATUS_KEY_MAP = { P: 'pendente', A: 'aprovado', R: 'reprovado', C: 'cancelado' };

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[STATUS_KEY_MAP[status]] || STATUS_CONFIG.pendente;
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

function formatarDataParaOracle(dataIso) {
  if (!dataIso) return '';
  const meses = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}-${meses[parseInt(mes, 10) - 1]}-${ano}`;
}

function formatarData(dataStr) {
  if (!dataStr) return '—';
  const d = new Date(dataStr.replace(' ', 'T'));
  return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
  if (valor === undefined || valor === null || valor === '') return '—';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Modal de Edição padrão (Limite de Crédito) ───────────────────
export function ModalEdicaoLimite({ solicitacao, onFechar, onSucesso }) {
  const [form, setForm] = useState({
    limite_sol: solicitacao.limite_sol ?? '',
    motivo: solicitacao.motivo ?? '',
    obs: solicitacao.obs ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('token_supervisor');
      const resp = await fetch(`${URL_API}/limite/atualizar/${solicitacao.id_solicitacao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          limite_sol: parseFloat(form.limite_sol),
          motivo: form.motivo,
          obs: form.obs,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao atualizar solicitação.');
      }
      onSucesso();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">✏️ Editar Solicitação de Limite</span>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Valor Solicitado (R$)</label>
            <input name="limite_sol" type="number" min="0" step="0.01" className="input"
              value={form.limite_sol} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Motivo</label>
            <select name="motivo" className="input" value={form.motivo} onChange={handleChange} required>
              <option value="">Selecione...</option>
              <option value="historico_pagamento">Bom histórico de pagamento</option>
              <option value="aumento_demanda">Aumento de demanda</option>
              <option value="novo_contrato">Novo contrato firmado</option>
              <option value="pedido_grande">Valor de pedido maior que o limite</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div className="form-group">
            <label>Observação</label>
            <textarea name="obs" className="input textarea" rows={3} value={form.obs} onChange={handleChange} />
          </div>
          {erro && <p className="error-msg">⚠ {erro}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de Exclusão padrão (Limite de Crédito) ─────────────────
export function ModalExclusaoLimite({ solicitacao, onFechar, onSucesso }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleExcluir = async () => {
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('token_supervisor');
      const resp = await fetch(`${URL_API}/limite/cancelar/${solicitacao.id_solicitacao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'C' }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao excluir solicitação.');
      }
      onSucesso();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">🗑️ Excluir Solicitação</span>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ margin: '0 0 8px' }}>
            Tem certeza que deseja excluir a solicitação do cliente <strong>{solicitacao.cliente}</strong>?
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
            O status será alterado para Cancelado. Esta ação não pode ser desfeita.
          </p>
          {erro && <p className="error-msg">⚠ {erro}</p>}
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onFechar}>Voltar</button>
            <button className="btn" style={{ background: '#dc2626', color: '#fff', border: 'none' }}
              onClick={handleExcluir} disabled={loading}>
              {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────────
// Props:
//   titulo, endpointBase, colunas, onNovaSolicitacao  — obrigatórias
//   ModalEdicao    — componente customizado de edição   (padrão: ModalEdicaoLimite)
//   ModalExclusao  — componente customizado de exclusão (padrão: ModalExclusaoLimite)
export default function ConsultaSolicitacoes({
  titulo,
  endpointBase,
  colunas,
  onNovaSolicitacao,
  ModalEdicao: ModalEdicaoCustom,
  ModalExclusao: ModalExclusaoCustom,
}) {
  const ModalEdicaoFinal   = ModalEdicaoCustom   || ModalEdicaoLimite;
  const ModalExclusaoFinal = ModalExclusaoCustom || ModalExclusaoLimite;

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const [rcasDisponiveis, setRcasDisponiveis] = useState([]);

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes   = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroRca, setFiltroRca]       = useState('');
  const [filtroDataDe, setFiltroDataDe] = useState(primeiroDiaMes.toISOString().split('T')[0]);
  const [filtroDataAte, setFiltroDataAte] = useState(ultimoDiaMes.toISOString().split('T')[0]);
  const [filtroBusca, setFiltroBusca]   = useState('');

  const [modalEdicao, setModalEdicao]           = useState(null);
  const [modalExclusao, setModalExclusao]       = useState(null);

  const buscarDadosAPI = useCallback(async () => {
    if (!filtroDataDe || !filtroDataAte) return;
    setCarregando(true);
    setErro(null);
    try {
      const token = localStorage.getItem('token_supervisor');
      const supervisorStr = localStorage.getItem('usuario_logado');
      const supObj = JSON.parse(supervisorStr);
      const codSupervisor = supObj.codsupervisor;

      const queryParams = new URLSearchParams({
        codsupervisor: codSupervisor,
        dtinicio: formatarDataParaOracle(filtroDataDe),
        dtfim: formatarDataParaOracle(filtroDataAte),
      });

      const resp = await fetch(`${URL_API}${endpointBase}?${queryParams}`, {
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
      });

      if (!resp.ok) throw new Error('Falha ao carregar solicitações.');
      const json = await resp.json();
      setSolicitacoes(json.data || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [endpointBase, filtroDataDe, filtroDataAte]);

  useEffect(() => { buscarDadosAPI(); }, [buscarDadosAPI]);

  const filtradas = solicitacoes.filter((s) => {
    if (filtroStatus && s.status !== filtroStatus) return false;
    if (filtroRca && String(s.codusur) !== filtroRca) return false;
    if (filtroBusca) {
      const t = filtroBusca.toLowerCase();
      if (!(s.cliente || '').toLowerCase().includes(t) && !String(s.codcli || '').includes(t)) return false;
    }
    return true;
  });

  useEffect(() => {
    const buscarRcasDisponiveis = async () => {
      try {
        const token = localStorage.getItem('token_supervisor');
        const supervisorStr = localStorage.getItem('usuario_logado');
        const supObj = JSON.parse(supervisorStr);
        const codSupervisor = supObj.codsupervisor || supObj.id;

        const url = `${URL_API}/rcas/listar/${codSupervisor}`;

        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!resp.ok) throw new Error('Falha ao listar RCAs.');

        const json = await resp.json();

        setRcasDisponiveis(json.data || []);

      } catch (err) {
        console.error("Erro ao carregar RCAs para o filtro:". err.message);
      }
    };

    buscarRcasDisponiveis();
  }, []);

  const limparFiltros = () => { setFiltroStatus(''); setFiltroRca(''); setFiltroBusca(''); };
  const temFiltroAtivo = filtroStatus || filtroRca || filtroBusca;

  const handleSucesso = () => {
    setModalEdicao(null);
    setModalExclusao(null);
    buscarDadosAPI();
  };

  const podeEditar = (s) => s.status === 'P';

  return (
    <div>
      {/* Modais */}
      {modalEdicao && (
        <ModalEdicaoFinal
          solicitacao={modalEdicao}
          onFechar={() => setModalEdicao(null)}
          onSucesso={handleSucesso}
        />
      )}
      {modalExclusao && (
        <ModalExclusaoFinal
          solicitacao={modalExclusao}
          onFechar={() => setModalExclusao(null)}
          onSucesso={handleSucesso}
        />
      )}

      <div className="consulta-topbar">
        <div className="consulta-topbar-info">
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{titulo}</h2>
          <span style={{ marginLeft: 10, fontSize: '0.9rem', color: '#666' }}>
            {carregando ? 'Buscando...' : `${filtradas.length} encontrada(s)`}
          </span>
        </div>
        <button className="btn btn-primary" onClick={onNovaSolicitacao}>+ Nova Solicitação</button>
      </div>

      <div className="consulta-filtros card">
        <div className="consulta-filtros-grid">
          <div className="filtro-datas">
            <input type="date" className="input" value={filtroDataDe} onChange={(e) => setFiltroDataDe(e.target.value)} />
            <span className="filtro-datas-sep">até</span>
            <input type="date" className="input" value={filtroDataAte} onChange={(e) => setFiltroDataAte(e.target.value)} />
            <button className="btn btn-outline btn-sm" onClick={buscarDadosAPI}>Atualizar</button>
          </div>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" className="input input-search" placeholder="Buscar cliente..."
              value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} />
          </div>

          <select className="input" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="P">Pendente</option>
            <option value="A">Aprovado</option>
            <option value="R">Reprovado</option>
            <option value="C">Cancelado</option>
          </select>

          <select className="input" value={filtroRca} onChange={(e) => setFiltroRca(e.target.value)}>
            <option value="">Todos os RCAs</option>
            {rcasDisponiveis.map((r) => (
              <option key={r.codusur} value={r.codusur}>{r.codusur} — {r.nome}</option>
            ))}
          </select>

          {temFiltroAtivo && (
            <button className="btn btn-outline btn-sm" onClick={limparFiltros}>✕ Limpar</button>
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
                  {colunas.map((col) => <th key={col.key}>{col.label}</th>)}
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((s, i) => (
                  <tr key={s.id_solicitacao || i}>
                    {colunas.map((col) => (
                      <td key={col.key}>{col.render ? col.render(s) : (s[col.key] ?? '—')}</td>
                    ))}
                    <td><StatusBadge status={s.status} /></td>
                    <td className="td-data">{formatarData(s.data)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Editar solicitação"
                          disabled={!podeEditar(s)}
                          style={!podeEditar(s) ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                          onClick={() => podeEditar(s) && setModalEdicao(s)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-sm"
                          title="Excluir solicitação"
                          disabled={!podeEditar(s)}
                          style={
                            podeEditar(s)
                              ? { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }
                              : { background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', cursor: 'not-allowed', opacity: 0.5 }
                          }
                          onClick={() => podeEditar(s) && setModalExclusao(s)}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
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
