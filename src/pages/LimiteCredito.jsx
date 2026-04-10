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
  { key: 'limcred', label: 'Limite Atual',      render: (s) => formatarMoeda(s.limite_atual) },
  { key: 'limite_sol',   label: 'Limite Solicitado', render: (s) => formatarMoeda(s.limite_sol) },
  { key: 'motivo',       label: 'Motivo' },
  { key: 'obs', label: 'Observação'},
];

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

      const supervisorStr = 300;//localStorage.getItem('dados_supervisor');
      if (!supervisorStr) {
        throw new Error('Sessão expirada ou usuário não encontrado. Faça login novamente.');
      }

      const supervisorLogado = JSON.parse(supervisorStr);

      const payload = {
        codcli: parseInt(clienteSelecionado.codcli, 10),
        codsupervisor: 300,//parseInt(supervisorLogado.id, 10),
        codusur: parseInt(rcaSelecionado.codusur, 10),
        limite_sol: parseFloat(form.limiteSolicitado),
        motivo: form.motivo,
        obs: form.observacao || "" 
      };

      console.log("📦 Payload enviado para a API:", payload);

      const url_api = `${URL_API}/limite/solicitar`;

      const resposta = await fetch(url_api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erroData = await resposta.json();
        throw new Error(erroData.detail || 'Falha ao processar a solicitação de limite no servidor.')
      }

      setFeedback({ 
        tipo: 'sucesso',
        mensagem: 'Solicitação enviada e registrada com sucesso'
      })

      setForm(ESTADO_INICIAL);
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