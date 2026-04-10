import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Feedback from '../components/Feedback';
import { listarUsuarios, criarUsuario, atualizarUsuario, toggleAtivoUsuario } from '../services/api';

const ESTADO_INICIAL = {
  nome: '',
  login: '',
  senha: '',
  codsupervisor: '',
  nivel: 'S',
  ativo: 'S',
  email: '',
};

const NIVEL_LABEL = { S: 'Supervisor', A: 'Admin' };
const ATIVO_LABEL = { S: 'Ativo', N: 'Inativo' };

function BadgeNivel({ nivel }) {
  const isAdmin = nivel === 'A';
  return (
    <span style={{
      background: isAdmin ? '#f5f3ff' : '#eff6ff',
      color: isAdmin ? '#7c3aed' : '#2563eb',
      border: `1px solid ${isAdmin ? '#ddd6fe' : '#bfdbfe'}`,
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '0.78rem',
      fontWeight: 700,
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
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '0.78rem',
      fontWeight: 700,
    }}>
      {ATIVO_LABEL[ativo] || ativo}
    </span>
  );
}

export default function Admin({ onVoltar, usuarioLogado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  // Controle do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  // Filtros da listagem
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  const carregarUsuarios = async () => {
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

  useEffect(() => { carregarUsuarios(); }, []);

  const abrirNovo = () => {
    setForm(ESTADO_INICIAL);
    setModoEdicao(false);
    setIdEditando(null);
    setErroForm('');
    setModalAberto(true);
  };

  const abrirEdicao = (u) => {
    setForm({
      nome: u.nome || '',
      login: u.login || '',
      senha: '',
      codsupervisor: u.codsupervisor ?? '',
      nivel: u.nivel || 'S',
      ativo: u.ativo || 'S',
      email: u.email || '',
    });
    setModoEdicao(true);
    setIdEditando(u.id);
    setErroForm('');
    setModalAberto(true);
  };

  const fecharModal = () => { setModalAberto(false); setErroForm(''); };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroForm('');

    if (!form.nome || !form.login) {
      setErroForm('Nome e login são obrigatórios.');
      return;
    }
    if (!modoEdicao && !form.senha) {
      setErroForm('A senha é obrigatória para novos usuários.');
      return;
    }
    if (form.senha && form.senha.length > 72) {
      setErroForm('A senha deve ter no máximo 72 caracteres.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        login: form.login,
        nivel: form.nivel,
        ativo: form.ativo,
        email: form.email || null,
        codsupervisor: form.codsupervisor !== '' ? parseInt(form.codsupervisor) : null,
      };
      // Só envia senha se preenchida (edição pode deixar em branco para não alterar)
      if (form.senha) payload.senha = form.senha;

      if (modoEdicao) {
        await atualizarUsuario(idEditando, payload);
        setFeedback({ tipo: 'sucesso', mensagem: 'Usuário atualizado com sucesso.' });
      } else {
        await criarUsuario(payload);
        setFeedback({ tipo: 'sucesso', mensagem: 'Usuário criado com sucesso.' });
      }

      fecharModal();
      carregarUsuarios();
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
      setFeedback({
        tipo: 'sucesso',
        mensagem: `Usuário ${novoAtivo === 'S' ? 'ativado' : 'desativado'} com sucesso.`,
      });
      carregarUsuarios();
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
        !(u.nome || '').toLowerCase().includes(t) &&
        !(u.login || '').toLowerCase().includes(t) &&
        !(u.email || '').toLowerCase().includes(t)
      ) return false;
    }
    return true;
  });

  return (
    <Layout titulo="⚙️ Painel Administrativo" subtitulo="Gerenciamento de usuários do sistema." onVoltar={onVoltar}>
      <Feedback
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onFechar={() => setFeedback({ tipo: '', mensagem: '' })}
      />

      {/* Topbar */}
      <div className="consulta-topbar">
        <span className="consulta-total">
          {carregando ? '...' : `${filtrados.length} usuário${filtrados.length !== 1 ? 's' : ''}`}
        </span>
        <button className="btn btn-primary" onClick={abrirNovo}>+ Novo Usuário</button>
      </div>

      {/* Filtros */}
      <div className="card consulta-filtros" style={{ marginBottom: 16 }}>
        <div className="admin-filtros-grid">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="input input-search"
              placeholder="Buscar por nome, login ou e-mail..."
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
            />
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

        {!carregando && filtrados.length === 0 && (
          <p className="empty-msg">Nenhum usuário encontrado.</p>
        )}

        {!carregando && filtrados.length > 0 && (
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
                {filtrados.map((u) => (
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
                          Editar
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
        )}
      </div>

      {/* Modal de cadastro/edição */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modoEdicao ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="modal-close" onClick={fecharModal} aria-label="Fechar">×</button>
            </div>

            {erroForm && <div className="login-erro" style={{ marginBottom: 14 }}>{erroForm}</div>}

            <form className="form" onSubmit={handleSalvar}>
              <div className="form-row">
                <div className="form-group form-group-wide">
                  <label htmlFor="u-nome">Nome completo</label>
                  <input id="u-nome" name="nome" type="text" className="input" value={form.nome} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="u-login">Login</label>
                  <input id="u-login" name="login" type="text" className="input" value={form.login} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="u-senha">
                    Senha {modoEdicao && <span style={{ fontWeight: 400, textTransform: 'none' }}>(deixe em branco para não alterar)</span>}
                  </label>
                  <input
                    id="u-senha"
                    name="senha"
                    type="password"
                    className="input"
                    maxLength={72}
                    placeholder={modoEdicao ? '••••••••' : 'Máx. 72 caracteres'}
                    value={form.senha}
                    onChange={handleChange}
                    required={!modoEdicao}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="u-email">E-mail</label>
                  <input id="u-email" name="email" type="email" className="input" placeholder="opcional" value={form.email} onChange={handleChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="u-codsupervisor">Cód. Supervisor</label>
                  <input
                    id="u-codsupervisor"
                    name="codsupervisor"
                    type="number"
                    className="input"
                    placeholder="opcional"
                    value={form.codsupervisor}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="u-nivel">Nível de acesso</label>
                  <select id="u-nivel" name="nivel" className="input" value={form.nivel} onChange={handleChange}>
                    <option value="S">Supervisor</option>
                    <option value="A">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="u-ativo">Status</label>
                  <select id="u-ativo" name="ativo" className="input" value={form.ativo} onChange={handleChange}>
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
    </Layout>
  );
}
