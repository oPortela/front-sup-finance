import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import RcaSelector from '../components/RcaSelector';
import ClienteSelector from '../components/ClienteSelector';
import Feedback from '../components/Feedback';
import Stepper from '../components/Stepper';
import ConsultaSolicitacoes, { formatarMoeda } from '../components/ConsultaSolicitacoes';

const URL_API = import.meta.env.VITE_URL_API;

// ─── Task 7.1 — COLUNAS_NEGOCIACAO ───────────────────────────────
const COLUNAS_NEGOCIACAO = [
  { key: 'codcli',   label: 'Cód. Cliente' },
  { key: 'cliente',  label: 'Cliente' },
  { key: 'codusur',  label: 'RCA' },
  { key: 'codplpag', label: 'Plano' },
  { key: 'obs',      label: 'Observação' },
];

// ─── Pure helpers ─────────────────────────────────────────────────
const calcularPrecoFinal = (preco, qtd, desconto) =>
  preco * qtd * (1 - desconto / 100);

function validarEnvio(cabecalho, itens) {
  if (!cabecalho.codplpag) return 'Selecione um plano de pagamento.';
  if (itens.length === 0) return 'Adicione pelo menos 1 item à negociação.';
  return null;
}

function montarPayload(rca, cliente, cabecalho, itens) {
  const sup = JSON.parse(localStorage.getItem('usuario_logado') || '{}');
  return {
    codcli: parseInt(cliente.codcli, 10),
    codusur: parseInt(rca.codusur, 10),
    codsupervisor: parseInt(sup.codsupervisor || sup.id, 10),
    codplpag: parseInt(cabecalho.codplpag, 10),
    obs: cabecalho.obs || '',
    itens: itens.map(({ codprod, qtd, preco_unit, desconto, preco_final }) => ({
      codprod, qtd, preco_unit, desconto, preco_final,
    })),
  };
}

// ─── Task 5 — ModalDetalhesProduto ───────────────────────────────
function ModalDetalhesProduto({ produto, onConfirmar, onFechar }) {
  const [qtd, setQtd] = useState(1);
  const [desconto, setDesconto] = useState(0);
  const [erroQtd, setErroQtd] = useState('');
  const [erroDesc, setErroDesc] = useState('');

  const precoFinal = calcularPrecoFinal(produto.preco, qtd, desconto);

  const handleQtd = (v) => {
    const n = parseInt(v, 10);
    setQtd(isNaN(n) ? '' : n);
    setErroQtd(isNaN(n) || n < 1 ? 'Quantidade mínima é 1.' : '');
  };

  const handleDesconto = (v) => {
    const n = parseFloat(v);
    setDesconto(isNaN(n) ? '' : n);
    setErroDesc(isNaN(n) || n < 0 || n > 100 ? 'Desconto deve ser entre 0 e 100.' : '');
  };

  const podeConfirmar = qtd >= 1 && desconto >= 0 && desconto <= 100 && !erroQtd && !erroDesc;

  const handleConfirmar = () => {
    if (!podeConfirmar) return;
    onConfirmar({
      codprod: produto.codprod,
      descricao: produto.descricao,
      foto: produto.diretorio,
      qtd: parseInt(qtd, 10),
      preco_unit: produto.preco,
      desconto: parseFloat(desconto),
      preco_final: calcularPrecoFinal(produto.preco, qtd, desconto),
    });
  };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <span className="modal-title">📦 Detalhes do Produto</span>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
            <img
              src={produto.diretorio}
              alt={produto.descricao}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', flexShrink: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>Cód. {produto.codprod}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{produto.descricao}</div>
              <div style={{ fontSize: '0.9rem', color: '#2563eb', fontWeight: 600 }}>
                Preço unit.: {formatarMoeda(produto.preco)}
              </div>
            </div>
          </div>

          <div className="form" style={{ gap: 14 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Quantidade</label>
                <input
                  type="number" min="1" className="input"
                  value={qtd} onChange={(e) => handleQtd(e.target.value)}
                />
                {erroQtd && <span style={{ color: '#dc2626', fontSize: '0.78rem' }}>{erroQtd}</span>}
              </div>
              <div className="form-group">
                <label>Desconto (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01" className="input"
                  value={desconto} onChange={(e) => handleDesconto(e.target.value)}
                />
                {erroDesc && <span style={{ color: '#dc2626', fontSize: '0.78rem' }}>{erroDesc}</span>}
              </div>
            </div>

            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
              padding: '12px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>Preço Final</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1d4ed8' }}>
                {formatarMoeda(precoFinal)}
              </div>
            </div>

            <div className="form-actions" style={{ paddingTop: 12 }}>
              <button className="btn btn-outline" onClick={onFechar}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleConfirmar} disabled={!podeConfirmar}>
                Confirmar Inclusão
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task 4 — ModalBuscaProdutos ─────────────────────────────────
function ModalBuscaProdutos({ onSelecionar, onFechar, codfilial }) {
  const [filial, setFilial] = useState('')
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [produtos, setProdutos] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const debounceRef = useRef(null);

  // Task 4.3 — reset page when search term changes
  const handleBuscaChange = (v) => {
    setBusca(v);
    setPagina(1);
  };

  // Task 4.2 — debounce 400ms
  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (codfilial) {
        buscarProdutos(codfilial, busca, pagina);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, pagina, codfilial]);

  const buscarProdutos = async (codfilial, termo, pag) => {
    setCarregando(true);
    setErro('');
    try {
      const token = localStorage.getItem('token_supervisor');
      const params = new URLSearchParams({ 
        codfilial: codfilial, 
        termo, 
        page: pag, 
        per_page: 10 
      });
      const resp = await fetch(`${URL_API}/negociacao/listar/produtos?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
      });
      if (!resp.ok) throw new Error('Falha ao buscar produtos.');
      const json = await resp.json();
      setProdutos(json.data || []);
      // Task 4.5 — current page never exceeds totalPaginas
      const tp = json.paginas || 1;
      setTotalPaginas(tp);
      if (pag > tp) setPagina(tp);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // Task 4.7 — on select, call onSelecionar; parent closes modal
  const handleSelecionar = (produto) => {
    setProdutoSelecionado(produto);
  };

  const handleConfirmarItem = (item) => {
    onSelecionar(item);
    // parent (FormularioNegociacao) will close this modal
  };

  return (
    <>
      <div className="modal-overlay" onClick={onFechar}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
          <div className="modal-header">
            <span className="modal-title">🔍 Buscar Produto</span>
            <button className="modal-close" onClick={onFechar}>✕</button>
          </div>

          <div style={{ padding: '16px 24px 0' }}>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="input input-search"
                placeholder="Buscar por código ou descrição..."
                value={busca}
                onChange={(e) => handleBuscaChange(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Task 4.6 — inline error */}
          {erro && <p className="error-msg" style={{ padding: '12px 24px 0' }}>⚠ {erro}</p>}

          {carregando && <p className="loading-msg">Buscando produtos...</p>}

          {!carregando && !erro && produtos.length === 0 && (
            <p className="empty-msg">Nenhum produto encontrado.</p>
          )}

          {/* Task 4.4 — product list */}
          {!carregando && produtos.length > 0 && (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="consulta-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Foto</th>
                    <th>Cód.</th>
                    <th>Descrição</th>
                    <th>Estoque</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.codprod}>
                      <td>
                        <img
                          src={p.IMAGEM}
                          alt={p.DESCRICAO}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>{p.CODPROD}</td>
                      <td>{p.DESCRICAO}</td>
                      <td style={{ whiteSpace: 'nowrap', color: '#2563eb', fontWeight: 600 }}>
                        {(p.ESTOQUE)}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSelecionar(p)}
                        >
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Task 4.5 — pagination */}
          {totalPaginas > 1 && (
            <div className="paginacao">
              <button
                className="paginacao-btn"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`paginacao-btn${pagina === n ? ' active' : ''}`}
                  onClick={() => setPagina(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="paginacao-btn"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              >
                ›
              </button>
              <span className="paginacao-info">Página {pagina} de {totalPaginas}</span>
            </div>
          )}

          <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onFechar}>Fechar</button>
          </div>
        </div>
      </div>

      {/* Task 5 — ModalDetalhesProduto opens on top */}
      {produtoSelecionado && (
        <ModalDetalhesProduto
          produto={produtoSelecionado}
          onFechar={() => setProdutoSelecionado(null)}
          onConfirmar={(item) => {
            setProdutoSelecionado(null);
            handleConfirmarItem(item);
          }}
        />
      )}
    </>
  );
}

// ─── Task 3 — FormularioNegociacao ───────────────────────────────
function FormularioNegociacao({
  rca, cliente, cabecalho, itens, planos, carregandoPlanos, filiais, carregandoFiliais,
  onCabecalhoChange, onAdicionarItem, onRemoverItem, onEnviar, onVoltar, loading,
}) {
  // Task 3.6 — tab state
  const [aba, setAba] = useState('dados');
  const [modalBusca, setModalBusca] = useState(false);

  const handlePlanoChange = (e) => {
    const cod = e.target.value;
    const plano = planos.find((p) => String(p.codplpag) === String(cod));
    onCabecalhoChange('codplpag', cod);
    onCabecalhoChange('descPlano', plano ? plano.descricao : '');
  };

  const handleFilialChange = (e) => {
    const codfilial = e.target.value;
    const filial = filiais.find((p) => String(p.CODFILIAL) === String(codfilial));
    onCabecalhoChange('codfilial', codfilial);
    onCabecalhoChange('razaosocial', filial ? filial.RAZAOSOCIAL : '');
  };

  const handleAdicionarItem = (item) => {
    onAdicionarItem(item);
    setModalBusca(false);
  };

  return (
    <div className="card">
      {/* rca-info-bar com RCA e cliente */}
      <div className="rca-info-bar" style={{ marginBottom: 20 }}>
        <span className="badge">{rca.codusur}</span>
        <strong>{rca.nome}</strong>
        <span>→</span>
        <span className="badge">{cliente.codcli}</span>
        <strong>{cliente.cliente || cliente.nome}</strong>
        <button className="btn btn-outline btn-sm" onClick={onVoltar}>Trocar cliente</button>
      </div>

      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Cadastro de Negociação</h2>
      </div>

      {/* Task 3.6 — tab navigation */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 20 }}>
        <button
          onClick={() => setAba('dados')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.9rem',
            color: aba === 'dados' ? '#2563eb' : '#64748b',
            borderBottom: aba === 'dados' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -2,
          }}
        >
          📋 Dados Gerais
        </button>
        <button
          onClick={() => setAba('itens')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.9rem',
            color: aba === 'itens' ? '#2563eb' : '#64748b',
            borderBottom: aba === 'itens' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -2,
          }}
        >
          📦 Itens ({itens.length})
        </button>
      </div>

      {/* Aba Dados Gerais — cabeçalho estilo formulário */}
      {aba === 'dados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Linha 0 — FILIAL */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'end' }}>
            <div className="form-group">
              <label>Filial</label>
              <select
                className="input"
                value={cabecalho.codfilial}
                onChange={handleFilialChange}
                disabled={carregandoFiliais}
                style={{ fontWeight: 700 }}
              >
                <option value="">
                  {carregandoFiliais ? '...' : 'Cód.'}
                </option>
                {filiais.map((p) => (
                  <option key={p.CODFILIAL} value={p.CODFILIAL}>{p.CODFILIAL} — {p.RAZAOSOCIAL}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Razão Social</label>
              <input
                className="input"
                value={cabecalho.razaosocial}
                readOnly
                placeholder={carregandoFiliais ? 'Carregando filiais...' : 'Selecione uma filial ao lado'}
                style={{ background: '#f8fafc', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Linha 1 — Cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'end' }}>
            <div className="form-group">
              <label>Cód. Cliente</label>
              <input
                className="input"
                value={cliente.codcli}
                readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label>Cliente</label>
              <input
                className="input"
                value={cliente.cliente || cliente.nome || ''}
                readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Linha 2 — RCA */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'end' }}>
            <div className="form-group">
              <label>Cód. RCA</label>
              <input
                className="input"
                value={rca.codusur}
                readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed', fontWeight: 700 }}
              />
            </div>
            <div className="form-group">
              <label>RCA</label>
              <input
                className="input"
                value={rca.nome}
                readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Linha 3 — Plano de Pagamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'end' }}>
            <div className="form-group">
              <label>Plano</label>
              <select
                className="input"
                value={cabecalho.codplpag}
                onChange={handlePlanoChange}
                disabled={carregandoPlanos}
                style={{ fontWeight: 700 }}
              >
                <option value="">
                  {carregandoPlanos ? '...' : 'Cód.'}
                </option>
                {planos.map((p) => (
                  <option key={p.codplpag} value={p.codplpag}>{p.codplpag} — {p.descricao}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Descrição do Plano</label>
              <input
                className="input"
                value={cabecalho.descPlano}
                readOnly
                placeholder={carregandoPlanos ? 'Carregando planos...' : 'Selecione um plano ao lado'}
                style={{ background: '#f8fafc', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => setAba('itens')}>
              Próximo → Itens
            </button>
          </div>
        </div>
      )}

      {/* Task 3.3 / 3.4 — Itens tab */}
      {aba === 'itens' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 className="section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
              Itens da Negociação
            </h3>
            {/* Task 3.4 — add item button */}
            <button className="btn btn-primary btn-sm" onClick={() => setModalBusca(true)}>
              + Adicionar Item
            </button>
          </div>

          {itens.length === 0 ? (
            <p className="empty-msg" style={{ fontWeight: 'bold' }}>Nenhum item adicionado. Clique em "Adicionar Item".</p>
          ) : (
            <div className="consulta-table-wrap">
              <table className="consulta-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>Foto</th>
                    <th>Descrição</th>
                    <th>Qtd</th>
                    <th>Preço Unit.</th>
                    <th>Desc. %</th>
                    <th>Preço Final</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <img
                          src={item.foto}
                          alt={item.descricao}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </td>
                      <td>{item.descricao}</td>
                      <td>{item.qtd}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatarMoeda(item.preco_unit)}</td>
                      <td>{item.desconto}%</td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: '#2563eb' }}>
                        {formatarMoeda(item.preco_final)}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                          onClick={() => onRemoverItem(idx)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setAba('dados')}>
              ← Dados Gerais
            </button>
            {/* Task 6.5 — disable while loading */}
            <button
              className="btn btn-primary"
              onClick={onEnviar}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </div>
      )}

      {/* Task 4 — ModalBuscaProdutos */}
      {modalBusca && (
        <ModalBuscaProdutos
          codfilial={cabecalho.codfilial}
          onSelecionar={handleAdicionarItem}
          onFechar={() => setModalBusca(false)}
        />
      )}
    </div>
  );
}

// ─── Task 7.2 — ModalEdicaoNegociacao ────────────────────────────
function ModalEdicaoNegociacao({ solicitacao, onFechar, onSucesso }) {
  const [form, setForm] = useState({
    codplpag: solicitacao.codplpag || '',
    obs: solicitacao.obs || '',
  });
  const [planos, setPlanos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [carregandoFiliais, setCarregandoFiliais] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Load planos internally — same pattern as ModalEdicaoPlano
  useEffect(() => {
    const buscarPlanos = async () => {
      setCarregandoPlanos(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const resp = await fetch(`${URL_API}/plano/lista`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!resp.ok) throw new Error('Falha ao carregar planos.');
        const json = await resp.json();
        setPlanos(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregandoPlanos(false);
      }
    };
    buscarPlanos();
  }, []);

  //LOAD Filiais 
  useEffect(() => {
    const buscarFiliais = async () => {
      setCarregandoFiliais(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const resp = await fetch(`${URL_API}/filial/listar`, {
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          },
        });
        if (!resp.ok) throw new Error('Falha ao carregar filiais.');
        const json = await resp.json();
        setFiliais(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setCarregandoFiliais(false);
      }
    };
    buscarFiliais();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('token_supervisor');
      const resp = await fetch(`${URL_API}/negociacao/atualizar/${solicitacao.id_solicitacao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          codplpag: parseInt(form.codplpag, 10),
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
          <span className="modal-title">✏️ Editar Solicitação de Negociação</span>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plano de Pagamento</label>
            <select
              name="codplpag" className="input"
              value={form.codplpag} onChange={handleChange}
              required disabled={carregandoPlanos}
            >
              <option value="">
                {carregandoPlanos ? 'Carregando planos...' : 'Selecione um plano...'}
              </option>
              {planos.map((p) => (
                <option key={p.codplpag} value={p.codplpag}>
                  {p.codplpag} - {p.descricao}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Observação</label>
            <textarea
              name="obs" className="input textarea" rows={3}
              value={form.obs} onChange={handleChange}
            />
          </div>
          {erro && <p className="error-msg">⚠ {erro}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task 7.3 — ModalExclusaoNegociacao ──────────────────────────
function ModalExclusaoNegociacao({ solicitacao, onFechar, onSucesso }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleCancelar = async () => {
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('token_supervisor');
      const resp = await fetch(`${URL_API}/negociacao/cancelar/${solicitacao.id_solicitacao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao cancelar solicitação.');
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
          <span className="modal-title">🗑️ Cancelar Solicitação de Negociação</span>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ margin: '0 0 8px' }}>
            Tem certeza que deseja cancelar a solicitação do cliente{' '}
            <strong>{solicitacao.cliente}</strong>?
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
            O status será alterado para Cancelado. Esta ação não pode ser desfeita.
          </p>
          {erro && <p className="error-msg">⚠ {erro}</p>}
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onFechar}>Voltar</button>
            <button
              className="btn"
              style={{ background: '#dc2626', color: '#fff', border: 'none' }}
              onClick={handleCancelar}
              disabled={loading}
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────
const ETAPAS = { RCA: 'rca', CLIENTE: 'cliente', FORMULARIO: 'formulario' };

export default function SolicitacaoNegociacao({ onVoltar }) {
  // Task 1.1 — modo state
  const [modo, setModo] = useState('consulta');
  // Task 2.1 — state structure
  const [etapa, setEtapa] = useState(ETAPAS.RCA);
  const [rcaSelecionado, setRcaSelecionado] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [cabecalho, setCabecalho] = useState({ codplpag: '', descPlano: '', obs: '' });
  const [itens, setItens] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [carregandoFiliais, setCarregandoFiliais] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  // Task 2.2 — load planos when entering formulario step
  useEffect(() => {
    if (etapa !== ETAPAS.FORMULARIO) return;
    const buscarPlanos = async () => {
      setCarregandoPlanos(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const resp = await fetch(`${URL_API}/plano/lista`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!resp.ok) throw new Error('Falha ao carregar planos de pagamento.');
        const json = await resp.json();
        setPlanos(json.data || []);
      } catch (err) {
        console.error('Erro ao buscar planos:', err);
      } finally {
        setCarregandoPlanos(false);
      }
    };
    buscarPlanos();
  }, [etapa]);

  useEffect(() => {
    const buscarFiliais = async () => {
      setCarregandoFiliais(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const resp = await fetch(`${URL_API}/filial/listar`, {
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          },
        });
        if (!resp.ok) throw new Error('Falha ao carregar filiais.');
        const json = await resp.json();
        const listaFiliais = json.data || [];
        
        // 1. Salvamos a lista completa para o <select>
        setFiliais(listaFiliais);

        // 2. Procuramos a Matriz (código '1') na lista que acabou de chegar
        const matriz = listaFiliais.find((f) => String(f.CODFILIAL) === '1');

        // 3. Se a Matriz existir na lista, já deixamos ela selecionada
        if (matriz) {
          setCabecalho((prev) => ({
            ...prev,
            codfilial: matriz.CODFILIAL,
            razaosocial: matriz.RAZAOSOCIAL
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCarregandoFiliais(false);
      }
    };
    buscarFiliais();
  }, []);

  const resetarEstado = () => {
    setEtapa(ETAPAS.RCA);
    setRcaSelecionado(null);
    setClienteSelecionado(null);
    setCabecalho({ codplpag: '', descPlano: '', obs: '' });
    setItens([]);
  };

  const handleCabecalhoChange = (campo, valor) =>
    setCabecalho((prev) => ({ ...prev, [campo]: valor }));

  const handleAdicionarItem = (item) => setItens((prev) => [...prev, item]);

  const handleRemoverItem = (idx) =>
    setItens((prev) => prev.filter((_, i) => i !== idx));

  // Task 6.1 — handleEnviar
  const handleEnviar = async () => {
    const erro = validarEnvio(cabecalho, itens);
    if (erro) {
      setFeedback({ tipo: 'erro', mensagem: erro });
      return;
    }

    setLoading(true);
    setFeedback({ tipo: '', mensagem: '' });

    try {
      const token = localStorage.getItem('token_supervisor');
      const payload = montarPayload(rcaSelecionado, clienteSelecionado, cabecalho, itens);

      // Task 6.2 — JWT in Authorization header
      const resp = await fetch(`${URL_API}/negociacao/solicitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao enviar a solicitação de negociação.');
      }

      // Task 6.3 — success: reset and go to consulta
      setFeedback({ tipo: 'sucesso', mensagem: 'Solicitação de negociação enviada com sucesso!' });
      resetarEstado();
      setModo('consulta');
    } catch (err) {
      // Task 6.4 — failure: show error, preserve state
      setFeedback({ tipo: 'erro', mensagem: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      titulo="🤝 Solicitação de Negociação"
      subtitulo={modo === 'consulta' ? 'Consulta e gestão de solicitações.' : 'Nova solicitação de negociação.'}
      onVoltar={onVoltar}
    >
      <Feedback
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onFechar={() => setFeedback({ tipo: '', mensagem: '' })}
      />

      {/* Task 1.2 — consulta mode */}
      {modo === 'consulta' && (
        <ConsultaSolicitacoes
          titulo="Negociação"
          endpointBase="/negociacao/solicitacoes"
          colunas={COLUNAS_NEGOCIACAO}
          // Task 1.4 — connect "+ Nova Solicitação" button
          onNovaSolicitacao={() => { setModo('nova'); setEtapa(ETAPAS.RCA); }}
          // Task 7.4 — pass custom modals
          ModalEdicao={ModalEdicaoNegociacao}
          ModalExclusao={ModalExclusaoNegociacao}
        />
      )}

      {/* Task 1.3 — nova mode with back button */}
      {modo === 'nova' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { resetarEstado(); setModo('consulta'); }}
            >
              ← Voltar à consulta
            </button>
          </div>

          <Stepper
            etapaAtual={etapa === ETAPAS.RCA ? 0 : etapa === ETAPAS.CLIENTE ? 1 : 2}
          />

          {etapa === ETAPAS.RCA && (
            <RcaSelector
              onSelecionar={(rca) => { setRcaSelecionado(rca); setEtapa(ETAPAS.CLIENTE); }}
            />
          )}

          {etapa === ETAPAS.CLIENTE && (
            <ClienteSelector
              rca={rcaSelecionado}
              onSelecionar={(c) => { setClienteSelecionado(c); setEtapa(ETAPAS.FORMULARIO); }}
              onVoltar={() => setEtapa(ETAPAS.RCA)}
            />
          )}

          {etapa === ETAPAS.FORMULARIO && (
            <FormularioNegociacao
              rca={rcaSelecionado}
              cliente={clienteSelecionado}
              cabecalho={cabecalho}
              itens={itens}
              planos={planos}
              carregandoPlanos={carregandoPlanos}
              filiais={filiais}
              carregandoFiliais={carregandoFiliais}
              onCabecalhoChange={handleCabecalhoChange}
              onAdicionarItem={handleAdicionarItem}
              onRemoverItem={handleRemoverItem}
              onEnviar={handleEnviar}
              onVoltar={() => setEtapa(ETAPAS.CLIENTE)}
              loading={loading}
            />
          )}
        </>
      )}
    </Layout>
  );
}
