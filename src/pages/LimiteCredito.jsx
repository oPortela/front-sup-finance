import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import RcaSelector from '../components/RcaSelector';
import ClienteSelector from '../components/ClienteSelector';
import Feedback from '../components/Feedback';
import Stepper from '../components/Stepper';
import ConsultaSolicitacoes, { formatarMoeda } from '../components/ConsultaSolicitacoes';

const URL_API = import.meta.env.VITE_URL_API;
const TOKEN_SUPERVISOR = import.meta.env.VITE_TOKEN_SUPERVISOR;

const MODOS = { CONSULTA: 'consulta', NOVA: 'nova' , EDICAO: 'edicao'};
const ETAPAS = { RCA: 'rca', CLIENTE: 'cliente', FORMULARIO: 'formulario' };
const ESTADO_INICIAL = { motivo: '', limiteAtual: '', limiteDisponivel: '', limiteSolicitado: '', observacao: '' };

const COLUNAS_LIMITE = [
  { key: 'codcli',       label: 'Cód. Cliente' },
  { key: 'cliente',      label: 'Cliente' },
  { key: 'codusur',      label: 'RCA' },
  { key: 'limcred',      label: 'Limite Atual',      render: (s) => formatarMoeda(s.limcred) },
  { key: 'limite_sol',   label: 'Limite Solicitado', render: (s) => formatarMoeda(s.limite_sol) },
  { key: 'motivo',       label: 'Motivo' },
  { key: 'obs',          label: 'Observação'},
];

function ModalNegociacaoLimite({ solicitacao, onFechar, onSucesso }) {
  const [mensagens, setmensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const carregarMensagens = async () => {
    try {
      const token = localStorage.getItem('token_supervisor');
      const resp = await fetch(`${URL_API}/limite/solicitacao/${solicitacao.id_solicitacao}/mensagens`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resp.ok) {
        const json = await resp.json();
        setmensagens(json.data || []);
      }

    } catch (err) {
      console.error("Erro ao carregar chat:", err);
    }
  };

  useEffect(() => {
    carregarMensagens();
  }, []);

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token_supervisor');
      const supervisorStr = localStorage.getItem('usuario_logado');
      const supervisor = supervisorStr ? JSON.parse(supervisorStr) : { nome: 'Supervisor' };

      const resp = await fetch(`${URL_API}/limite/solicitacao/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_solicitacao: solicitacao.id_solicitacao,
          autor: supervisor.nome,
          mensagem: novaMensagem,
          tipo_mensagem: 'M'
        })
      });

      if (!resp.ok) throw new Error("Erro ao enviar a mensagem");

      setNovaMensagem('');
      carregarMensagens();
      onSucesso();

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='modal-overlay' onClick={onFechar}>
      <div 
        className='modal-box' 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 600,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/*DIV do Cabeçalho */}
        <div className='modal-header'>
          <span className='modal-title'>💬 Negociação de Limite: {solicitacao.cliente}</span>
          <button className='modal-close' onClick={onFechar}>X</button>
        </div>

        {/* DIV de Dados Originais */}
        <div
          style={{
            padding: '15px 20px',
            background: '#F8FAFC',
            borderBottom: '1px solid #e2e8f0',
            fontSize: '0.9rem'
          }}
        >
          <p><strong>Limite Atual:</strong> {formatarMoeda(solicitacao.limite_atual)}</p>
          <p><strong>Limite Solicitado:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}> {formatarMoeda(solicitacao.limite_sol)}</span></p>
          <p><strong>Motivo Original:</strong> {solicitacao.motivo}</p>
        </div>

        {/*Area do CHAT (TIMELINE)*/}
        <div
          style={{
            padding: '20px',
            flex: 1,
            overflowY: 'auto',
            background: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {mensagens.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.9rem'
              }}
            >Nenhuma mensagem ainda. Inicie a conversa abaixo.</p>
          ) : (
            mensagens.map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: '#fff',
                  padding: '10px 15px',
                  borderRadius: '80px',
                  borderLeft: msg.tipo_mensagem === 'C' ? '4px solid #d97706' : '4px solid #3b82f6',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '5px' }}>
                  <strong>{msg.autor}</strong>
                  <span>{new Date(msg.data).toLocaleString('pt-BR')}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{msg.mensagem}</p>
                {msg.valor_proposto && (
                  <div style={{ marginTop: '8px', background: '#fef3c7', padding: '5px 10px', borderRadius: '4px', fontSize: '0.85rem', color: '#92400e' }}>
                    <strong>Contraproposta:</strong> {formatarMoeda(msg.valor_proposto)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* CAMPO de DIGITAÇÃO */}
        <form 
          onSubmit={handleEnviarMensagem} 
          style={{ 
            padding: '15px 20px',  
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '10px'
          }}
        >
          <input 
            type="text" 
            className='input'
            placeholder='Digite sua mensagem'
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type='submit' className='btn btn-primary' disabled={loading || !novaMensagem.trim()}>
            {loading ? '...' : 'Enviar'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function LimiteCredito({ onVoltar, usuarioLogado }) {
  const [modo, setModo] = useState(MODOS.CONSULTA);
  const [etapa, setEtapa] = useState(ETAPAS.RCA);
  const [rcaSelecionado, setRcaSelecionado] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [buscandoLimite, setBuscandoLimite] = useState(false); 
  const [idEditando, setIdEditando] = useState(null);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });
  const [arquivos, setArquivos] = useState([]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const ajustarLimiteRapido = (valorAjuste) => {
    setForm((prev) => {
      const valorAtual = parseFloat(prev.limiteSolicitado) || 0;

      let novoValor = valorAtual + valorAjuste;

      if (novoValor < 0) {
        novoValor = 0
      }

      return {
        ...prev,
        limiteSolicitado: novoValor.toFixed(2)
      };
    });
  };

  // Efeito que busca o limite na API assim que a etapa muda para FORMULARIO
  useEffect(() => {
    const buscarLimiteCliente = async () => {
      setBuscandoLimite(true);
      try {
        const token = TOKEN_SUPERVISOR; 
        
        // Ajuste esta rota caso o endereço no seu FastAPI seja diferente
        const url_api = `${URL_API}/limite/consultar/${clienteSelecionado.codcli}`;
        
        const resposta = await fetch(url_api, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!resposta.ok) {
          throw new Error('Falha ao buscar o limite atual do cliente no ERP.');
        }

        const json = await resposta.json();
        
        // Alimenta o formulário com os dados do banco
        if (json.data) {
          setForm((prev) => ({
            ...prev,
            limiteAtual: json.data.limite,
            limiteDisponivel: json.data.limite_disponivel
          }));
        }
      } catch (err) {
        console.error(err);
        setFeedback({ tipo: 'erro', mensagem: err.message });
      } finally {
        setBuscandoLimite(false);
      }
    };

    // Só dispara a busca se estiver na etapa do formulário e tiver um cliente
    if (etapa === ETAPAS.FORMULARIO && clienteSelecionado?.codcli) {
      buscarLimiteCliente();
    }
  }, [etapa, clienteSelecionado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ tipo: '', mensagem: '' });
    try {
      const token = TOKEN_SUPERVISOR;

      const supervisorStr = localStorage.getItem('usuario_logado');
      const supervisorLogado = supervisorStr ? JSON.parse(supervisorStr) : null;
      const codsupervisorEnvio = supervisorLogado ? (supervisorLogado.codsupervisor || supervisorLogado.id) : 7000;

      const formData = new FormData();
      formData.append('codcli', clienteSelecionado.codcli);
      formData.append('codsupervisor', codsupervisorEnvio);
      formData.append('codusur', rcaSelecionado.codusur);
      formData.append('limite_sol', form.limiteSolicitado);
      formData.append('motivo', form.motivo);
      formData.append('obs', form.observacao || "");

      arquivos.forEach((arq) => {
        formData.append('arquivos', arq);
      });

      console.log("📦 Enviando FormData com", arquivos.length, "arquivo(s).");

      const url_api = `${URL_API}/limite/solicitar`;

      const resposta = await fetch(url_api, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!resposta.ok) {
        const erroData = await resposta.json();
        throw new Error(erroData.detail || 'Falha ao processar a solicitação de limite de crédito')
      }

      setFeedback({
        tipo: 'sucesso',
        mensagem: 'Solicitação enviada e registrada com sucesso!'
      });

      setForm(ESTADO_INICIAL);
      setArquivos([]);
      setEtapa(ETAPAS.RCA);
      setRcaSelecionado(null);
      setClienteSelecionado(null);
      setModo(MODOS.CONSULTA);

    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      titulo="💳 Limite de Crédito"
      subtitulo={modo === MODOS.CONSULTA ? 'Consulta e gestão de solicitações.' : 'Nova solicitação de limite.'}
      onVoltar={onVoltar}
      usuarioLogado={usuarioLogado}
    >
      <Feedback
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onFechar={() => setFeedback({ tipo: '', mensagem: '' })}
      />

      {/* ── MODO CONSULTA ── */}
      {modo === MODOS.CONSULTA && (
        <ConsultaSolicitacoes
          titulo="Limite de Crédito"
          endpointBase="/limite/solicitacoes"
          colunas={COLUNAS_LIMITE}
          onNovaSolicitacao={() => { setModo(MODOS.NOVA); setEtapa(ETAPAS.RCA); }}
          ModalMensagem={ModalNegociacaoLimite}
        />
      )}

      {/* ── MODO NOVA SOLICITAÇÃO ── */}
      {modo === MODOS.NOVA && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setModo(MODOS.CONSULTA)}>
              ← Voltar à consulta
            </button>
          </div>

          <Stepper etapaAtual={etapa === ETAPAS.RCA ? 0 : etapa === ETAPAS.CLIENTE ? 1 : 2} />

          {etapa === ETAPAS.RCA && (
            <RcaSelector onSelecionar={(rca) => { setRcaSelecionado(rca); setEtapa(ETAPAS.CLIENTE); }} />
          )}

          {etapa === ETAPAS.CLIENTE && (
            <ClienteSelector
              rca={rcaSelecionado}
              onSelecionar={(c) => { setClienteSelecionado(c); setEtapa(ETAPAS.FORMULARIO); }}
              onVoltar={() => setEtapa(ETAPAS.RCA)}
            />
          )}

          {etapa === ETAPAS.FORMULARIO && (
            <div className="card">
              <div className="rca-info-bar">
                <span className="badge">{rcaSelecionado.codusur}</span>
                <strong>{rcaSelecionado.nome}</strong>
                <span>→</span>
                <span className="badge">{clienteSelecionado.codcli}</span>
                <strong>{clienteSelecionado.cliente || clienteSelecionado.nome}</strong>
                <button className="btn btn-outline btn-sm" onClick={() => setEtapa(ETAPAS.CLIENTE)}>
                  Trocar cliente
                </button>
              </div>

              <h2 className="section-title">Dados da Solicitação</h2>

              {buscandoLimite ? (
                <p className="loading-msg">Buscando informações financeiras no ERP...</p>
              ) : (
                <form className="form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="limiteAtual">Limite Atual (R$)</label>
                      <input
                        id="limiteAtual"
                        name="limiteAtual"
                        type="number"
                        className="input"
                        value={form.limiteAtual}
                        readOnly
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="limiteDisponivel">Limite Disponível (R$)</label>
                      <input
                        id="limiteDisponivel"
                        name="limiteDisponivel"
                        type="number"
                        className="input"
                        value={form.limiteDisponivel}
                        readOnly
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="limiteSolicitado">Limite Solicitado (R$)</label>
                      <input
                        id="limiteSolicitado"
                        name="limiteSolicitado"
                        type="number"
                        min="0"
                        step="0.01"
                        className="input"
                        placeholder="0,00"
                        value={form.limiteSolicitado}
                        onChange={handleChange}
                        required
                      />
                      <div className='botoes-ajuste-rapido' style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => ajustarLimiteRapido(-100)}>-100</button>
                        <button type='button' className='btn btn-sm btn-outline-danger' onClick={() => ajustarLimiteRapido(-50)}>-50</button>
                        <button type='button' className='btn btn-sm btn-outline-success' onClick={() => ajustarLimiteRapido(50)}>+50</button>
                        <button type='button' className='btn btn-sm btn-outline-success' onClick={() => ajustarLimiteRapido(100)}>+100</button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="motivo">Motivo da Solicitação</label>
                    <select id="motivo" name="motivo" className="input" value={form.motivo} onChange={handleChange} required>
                      <option value="">Selecione...</option>
                      <option value="historico_pagamento">Bom histórico de pagamento</option>
                      <option value="aumento_demanda">Aumento de demanda</option>
                      <option value="novo_contrato">Novo contrato firmado</option>
                      <option value="pedido_grande">Valor de pedido maior que o limite</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="observacao">Observações</label>
                    <textarea
                      id="observacao"
                      name="observacao"
                      className="input textarea"
                      placeholder="Informações adicionais..."
                      value={form.observacao}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor="arquivos">Anexos (PDF, Imagens, etc)</label>
                    <input  
                      id='arquivos'
                      type="file"
                      multiple
                      className='input'
                      onChange={(e) => setArquivos(Array.from(e.target.files))}
                    />
                    {arquivos.length > 0 && (
                      <small style={{ color: '#666', marginTop: '4px', display: 'block'}}>
                        {arquivos.length} arquivos(s) selecionado(s)
                      </small>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setEtapa(ETAPAS.CLIENTE)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}