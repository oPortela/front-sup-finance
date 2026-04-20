import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Feedback from '../components/Feedback';
import { listarUsuarios, criarUsuario, atualizarUsuario, toggleAtivoUsuario } from '../services/api';

const URL_API = import.meta.env.VITE_URL_API;

const NIVEL_LABEL = { S: 'Supervisor', A: 'Admin' };
const ATIVO_LABEL = { S: 'Ativo',      N: 'Inativo' };
const POR_PAGINA  = 10;

// ── Badges ───────────────────────────────────────────────────────
function BadgeNivel({ nivel }) {
  const isAdmin = nivel === 'A';
  return (
    <span style={{
      background: isAdmin ? '#f5f3ff' : '#eff6ff',
      color: isAdmin ? '#7c3aed' : '#2563eb',
      border: `1px solid ${isAdmin ? '#ddd6fe' : '#bfdbfe'}`,
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '0.78rem', fontWeight: 700,
    }}>
      {NIVEL_LABEL[nivel] || nivel}
    </span>
  );
}

function BadgeAtivo({ ativo }) {
  const isAtivo = ativo === 'S';
  return (
    <span style={{
      background: isAtivo ? '#dcfce7' : '#f1f5f9',
      color: isAtivo ? '#16a34a' : '#64748b',
      border: `1px solid ${isAtivo ? '#86efac' : '#cbd5e1'}`,
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '0.78rem', fontWeight: 700,
    }}>
      {ATIVO_LABEL[ativo] || ativo}
    </span>
  );
}

// ── Paginação ────────────────────────────────────────────────────
function Paginacao({ total, porPagina, pagina, onChange }) {
  const totalPaginas = Math.ceil(total / porPagina);
  if (totalPaginas <= 1) return null;

  const paginas = [];
  for (let i = 1; i <= totalPaginas; i++) paginas.push(i);

  return (
    <div className="paginacao">
      <button className="paginacao-btn" disabled={pagina === 1} onClick={() => onChange(pagina - 1)}>‹</button>
      {paginas.map((p) => (
        <button
          key={p}
          className={`paginacao-btn ${p === pagina ? 'active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button className="paginacao-btn" disabled={pagina === totalPaginas} onClick={() => onChange(pagina + 1)}>›</button>
      <span className="paginacao-info">
        {((pagina - 1) * porPagina) + 1}–{Math.min(pagina * porPagina, total)} de {total}
      </span>
    </div>
  );
}

// ── Seção: Usuários ──────────────────────────────────────────────
const ESTADO_INICIAL_USER = {
  nome: '', login: '', senha: '', codsupervisor: '', nivel: 'S', ativo: 'S', email: '',
};

function SecaoUsuarios({ setFeedback }) {
  const [usuarios, setUsuarios]     = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao]   = useState(false);
  const [idEditando, setIdEditando]   = useState(null);
  const [form, setForm]               = useState(ESTADO_INICIAL_USER);
  const [salvando, setSalvando]       = useState(false);
  const [erroForm, setErroForm]       = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [pagina, setPagina]           = useState(1);

  const carregar = async () => {
    setCarregando(true);
    try {
      const json = await listarUsuarios();
      setUsuarios(json.data || json || []);
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // Reset página ao mudar filtros
  useEffect(() => { setPagina(1); }, [filtroNivel, filtroAtivo, filtroBusca]);

  const abrirNovo = () => {
    setForm(ESTADO_INICIAL_USER); setModoEdicao(false);
    setIdEditando(null); setErroForm(''); setModalAberto(true);
  };

  const abrirEdicao = (u) => {
    setForm({
      nome: u.nome || '', login: u.login || '', senha: '',
      codsupervisor: u.codsupervisor ?? '', nivel: u.nivel || 'S',
      ativo: u.ativo || 'S', email: u.email || '',
    });
    setModoEdicao(true); setIdEditando(u.id); setErroForm(''); setModalAberto(true);
  };

  const fecharModal = () => { setModalAberto(false); setErroForm(''); };
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroForm('');
    if (!form.nome || !form.login)          { setErroForm('Nome e login são obrigatórios.'); return; }
    if (!modoEdicao && !form.senha)         { setErroForm('A senha é obrigatória para novos usuários.'); return; }
    if (form.senha && form.senha.length > 72) { setErroForm('A senha deve ter no máximo 72 caracteres.'); return; }

    setSalvando(true);
    try {
      const payload = {
        nome: form.nome, login: form.login, nivel: form.nivel,
        ativo: form.ativo, email: form.email || null,
        codsupervisor: form.codsupervisor !== '' ? parseInt(form.codsupervisor) : null,
      };
      if (form.senha) payload.senha = form.senha;

      if (modoEdicao) {
        await atualizarUsuario(idEditando, payload);
        setFeedback({ tipo: 'sucesso', mensagem: 'Usuário atualizado com sucesso.' });
      } else {
        await criarUsuario(payload);
        setFeedback({ tipo: 'sucesso', mensagem: 'Usuário criado com sucesso.' });
      }
      fecharModal(); carregar();
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (u) => {
    const novoAtivo = u.ativo === 'S' ? 'N' : 'S';
    try {
      await toggleAtivoUsuario(u.id, novoAtivo);
      setFeedback({ tipo: 'sucesso', mensagem: `Usuário ${novoAtivo === 'S' ? 'ativado' : 'desativado'} com sucesso.` });
      carregar();
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
    }
  };

  const filtrados = usuarios.filter((u) => {
    if (filtroNivel && u.nivel !== filtroNivel) return false;
    if (filtroAtivo && u.ativo !== filtroAtivo) return false;
    if (filtroBusca) {
      const t = filtroBusca.toLowerCase();
      if (
        !(u.nome  || '').toLowerCase().includes(t) &&
        !(u.login || '').toLowerCase().includes(t) &&
        !(u.email || '').toLowerCase().includes(t)
      ) return false;
    }
    return true;
  });

  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div>
      {/* Topbar */}
      <div className="consulta-topbar">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Usuários do Sistema</h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            {carregando ? 'Carregando...' : `${filtrados.length} usuário(s)`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}>+ Novo Usuário</button>
      </div>

      {/* Filtros */}
      <div className="card consulta-filtros" style={{ marginBottom: 16 }}>
        <div className="admin-filtros-grid">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" className="input input-search"
              placeholder="Buscar por nome, login ou e-mail..."
              value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} />
          </div>
          <select className="input" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
            <option value="">Todos os níveis</option>
            <option value="S">Supervisor</option>
            <option value="A">Admin</option>
          </select>
          <select className="input" value={filtroAtivo} onChange={(e) => setFiltroAtivo(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="S">Ativo</option>
            <option value="N">Inativo</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="card consulta-card">
        {carregando && <p className="loading-msg">Carregando usuários...</p>}
        {!carregando && filtrados.length === 0 && <p className="empty-msg">Nenhum usuário encontrado.</p>}
        {!carregando && filtrados.length > 0 && (
          <>
            <div className="consulta-table-wrap">
              <table className="consulta-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Login</th>
                    <th>E-mail</th>
                    <th>Cód. Supervisor</th>
                    <th>Nível</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.nome}</td>
                      <td><span className="badge">{u.login}</span></td>
                      <td className="td-data">{u.email || '—'}</td>
                      <td className="td-data">{u.codsupervisor ?? '—'}</td>
                      <td><BadgeNivel nivel={u.nivel} /></td>
                      <td><BadgeAtivo ativo={u.ativo} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => abrirEdicao(u)}>
                            ✏️ Editar
                          </button>
                          <button
                            className={`btn btn-sm ${u.ativo === 'S' ? 'btn-desativar' : 'btn-ativar'}`}
                            onClick={() => handleToggleAtivo(u)}
                          >
                            {u.ativo === 'S' ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacao
              total={filtrados.length}
              porPagina={POR_PAGINA}
              pagina={pagina}
              onChange={setPagina}
            />
          </>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modoEdicao ? '✏️ Editar Usuário' : '➕ Novo Usuário'}</h3>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            {erroForm && <div className="login-erro" style={{ margin: '0 24px 14px' }}>{erroForm}</div>}
            <form className="form" onSubmit={handleSalvar}>
              <div className="form-row">
                <div className="form-group form-group-wide">
                  <label>Nome completo</label>
                  <input name="nome" type="text" className="input" value={form.nome} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Login</label>
                  <input name="login" type="text" className="input" value={form.login} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Senha{' '}
                    {modoEdicao && <span style={{ fontWeight: 400, textTransform: 'none' }}>(em branco = não altera)</span>}
                  </label>
                  <input name="senha" type="password" className="input" maxLength={72}
                    placeholder={modoEdicao ? '••••••••' : 'Máx. 72 caracteres'}
                    value={form.senha} onChange={handleChange}
                    required={!modoEdicao} autoComplete="new-password" />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input name="email" type="email" className="input" placeholder="opcional"
                    value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cód. Supervisor</label>
                  <input name="codsupervisor" type="number" className="input" placeholder="opcional"
                    value={form.codsupervisor} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Nível de acesso</label>
                  <select name="nivel" className="input" value={form.nivel} onChange={handleChange}>
                    <option value="S">Supervisor</option>
                    <option value="A">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="ativo" className="input" value={form.ativo} onChange={handleChange}>
                    <option value="S">Ativo</option>
                    <option value="N">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={fecharModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Seção: Parâmetros de Negociação ──────────────────────────────
const ESTADO_INICIAL_PARAM = {
  desconto_maximo: '',
  prazo_maximo_dias: '',
  valor_minimo_negociacao: '',
  requer_aprovacao_acima: '',
  motivos_permitidos: '',
  obs_obrigatoria: 'N',
};

function SecaoParametros({ setFeedback }) {
  const [params, setParams]         = useState(ESTADO_INICIAL_PARAM);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [erroForm, setErroForm]     = useState('');

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const resp = await fetch(`${URL_API}/negociacao/parametros`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error();
        const json = await resp.json();
        const d = json.data || json;
        setParams({
          desconto_maximo:         d.desconto_maximo         ?? '',
          prazo_maximo_dias:       d.prazo_maximo_dias       ?? '',
          valor_minimo_negociacao: d.valor_minimo_negociacao ?? '',
          requer_aprovacao_acima:  d.requer_aprovacao_acima  ?? '',
          motivos_permitidos: Array.isArray(d.motivos_permitidos)
            ? d.motivos_permitidos.join(', ')
            : (d.motivos_permitidos ?? ''),
          obs_obrigatoria: d.obs_obrigatoria ?? 'N',
        });
      } catch {
        // sem parâmetros ainda — mantém estado inicial
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const handleChange = (e) => setParams((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroForm('');
    setSalvando(true);
    try {
      const token = localStorage.getItem('token_supervisor');
      const payload = {
        desconto_maximo:         params.desconto_maximo         !== '' ? parseFloat(params.desconto_maximo)         : null,
        prazo_maximo_dias:       params.prazo_maximo_dias       !== '' ? parseInt(params.prazo_maximo_dias)         : null,
        valor_minimo_negociacao: params.valor_minimo_negociacao !== '' ? parseFloat(params.valor_minimo_negociacao) : null,
        requer_aprovacao_acima:  params.requer_aprovacao_acima  !== '' ? parseFloat(params.requer_aprovacao_acima)  : null,
        motivos_permitidos: params.motivos_permitidos
          ? params.motivos_permitidos.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        obs_obrigatoria: params.obs_obrigatoria,
      };
      const resp = await fetch(`${URL_API}/negociacao/parametros`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao salvar parâmetros.');
      }
      setFeedback({ tipo: 'sucesso', mensagem: 'Parâmetros salvos com sucesso.' });
    } catch (err) {
      setErroForm(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <p className="loading-msg">Carregando parâmetros...</p>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Parâmetros de Negociação</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Configure os limites e regras para o módulo de negociação.
        </p>
      </div>

      {erroForm && <div className="login-erro" style={{ marginBottom: 16 }}>⚠ {erroForm}</div>}

      <form className="form" onSubmit={handleSalvar}>
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-subtitle" style={{ marginTop: 0 }}>Limites Financeiros</p>
          <div className="form-row">
            <div className="form-group">
              <label>Desconto máximo (%)</label>
              <input name="desconto_maximo" type="number" min="0" max="100" step="0.01"
                className="input" placeholder="Ex: 15.00"
                value={params.desconto_maximo} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Valor mínimo para negociação (R$)</label>
              <input name="valor_minimo_negociacao" type="number" min="0" step="0.01"
                className="input" placeholder="Ex: 500.00"
                value={params.valor_minimo_negociacao} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Requer aprovação acima de (R$)</label>
              <input name="requer_aprovacao_acima" type="number" min="0" step="0.01"
                className="input" placeholder="Ex: 10000.00"
                value={params.requer_aprovacao_acima} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-subtitle" style={{ marginTop: 0 }}>Prazo e Regras</p>
          <div className="form-row">
            <div className="form-group">
              <label>Prazo máximo (dias)</label>
              <input name="prazo_maximo_dias" type="number" min="0"
                className="input" placeholder="Ex: 90"
                value={params.prazo_maximo_dias} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Observação obrigatória</label>
              <select name="obs_obrigatoria" className="input" value={params.obs_obrigatoria} onChange={handleChange}>
                <option value="N">Não</option>
                <option value="S">Sim</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <p className="section-subtitle" style={{ marginTop: 0 }}>Motivos Permitidos</p>
          <div className="form-group">
            <label>Motivos (separados por vírgula)</label>
            <textarea name="motivos_permitidos" className="input textarea" rows={3}
              placeholder="Ex: inadimplencia, dificuldade_financeira, fidelizacao"
              value={params.motivos_permitidos} onChange={handleChange} />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
              Esses valores serão usados como opções no formulário de negociação.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : '💾 Salvar Parâmetros'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────────
const MENU_ITEMS = [
  { id: 'usuarios',   icon: '👥', label: 'Usuários' },
  { id: 'parametros', icon: '⚙️', label: 'Parâmetros de Negociação' },
];

export default function Admin({ onVoltar, usuarioLogado }) {
  const [secao, setSecao]       = useState('usuarios');
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  return (
    <Layout
      titulo="⚙️ Painel Administrativo"
      subtitulo="Configurações e gerenciamento do sistema."
      onVoltar={onVoltar}
      usuarioLogado={usuarioLogado}
    >
      <Feedback
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onFechar={() => setFeedback({ tipo: '', mensagem: '' })}
      />

      <div className="admin-layout">
        {/* ── Sidebar ── */}
        <aside className="admin-sidebar">
          <p className="admin-sidebar-label">Menu</p>
          <nav>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`admin-sidebar-item${secao === item.id ? ' active' : ''}`}
                onClick={() => setSecao(item.id)}
              >
                <span className="admin-sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Conteúdo ── */}
        <main className="admin-content">
          {secao === 'usuarios'   && <SecaoUsuarios   setFeedback={setFeedback} />}
          {secao === 'parametros' && <SecaoParametros setFeedback={setFeedback} />}
        </main>
      </div>
    </Layout>
  );
}
