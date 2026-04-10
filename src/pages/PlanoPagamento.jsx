import { useState } from 'react';
import Layout from '../components/Layout';
import RcaSelector from '../components/RcaSelector';
import ClienteSelector from '../components/ClienteSelector';
import Feedback from '../components/Feedback';
import Stepper from '../components/Stepper';
import ConsultaSolicitacoes from '../components/ConsultaSolicitacoes';
import { alterarPlanoPagamento } from '../services/api';

const MODOS = { CONSULTA: 'consulta', NOVA: 'nova' };
const ETAPAS = { RCA: 'rca', CLIENTE: 'cliente', FORMULARIO: 'formulario' };

const ESTADO_INICIAL = {
  planoAtual: '',
  planoSolicitado: '',
  prazoAtual: '',
  prazoSolicitado: '',
  justificativa: '',
  observacao: '',
};

const COLUNAS_PLANO = [
  { key: 'codcli',         label: 'Cód. Cliente' },
  { key: 'nome_cliente',   label: 'Cliente' },
  { key: 'codusur',        label: 'RCA' },
  { key: 'plano_atual',    label: 'Plano Atual' },
  { key: 'plano_sol',      label: 'Plano Solicitado' },
  { key: 'justificativa',  label: 'Justificativa' },
];

export default function PlanoPagamento({ onVoltar }) {
  const [modo, setModo] = useState(MODOS.CONSULTA);
  const [etapa, setEtapa] = useState(ETAPAS.RCA);
  const [rcaSelecionado, setRcaSelecionado] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ tipo: '', mensagem: '' });
    try {
      await alterarPlanoPagamento({
        codusur: rcaSelecionado.codusur,
        codcli: clienteSelecionado.codcli,
        ...form,
      });
      setFeedback({ tipo: 'sucesso', mensagem: 'Alteração de plano enviada com sucesso!' });
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
      titulo="🗓️ Plano de Pagamento"
      subtitulo={modo === MODOS.CONSULTA ? 'Consulta e gestão de solicitações.' : 'Nova alteração de plano.'}
      onVoltar={onVoltar}
    >
      <Feedback
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onFechar={() => setFeedback({ tipo: '', mensagem: '' })}
      />

      {/* ── MODO CONSULTA ── */}
      {modo === MODOS.CONSULTA && (
        <ConsultaSolicitacoes
          titulo="Plano de Pagamento"
          endpoint="/plano/solicitacoes"
          colunas={COLUNAS_PLANO}
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

              <h2 className="section-title">Dados da Alteração</h2>
              <form className="form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="planoAtual">Plano Atual</label>
                    <input
                      id="planoAtual"
                      name="planoAtual"
                      type="text"
                      className="input"
                      placeholder="Ex: 30/60/90"
                      value={form.planoAtual}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="planoSolicitado">Plano Solicitado</label>
                    <select name="planoSolicitado" id="planoSolicitado" className="input" value={form.planoSolicitado} onChange={handleChange} required>
                      <option value="">Selecione...</option>
                      <option value="7">7 dias</option>
                      <option value="30">30 dias</option>
                      <option value="60">60 dias</option>
                      <option value="90">90 dias</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prazoAtual">Prazo Atual (dias)</label>
                    <input
                      id="prazoAtual"
                      name="prazoAtual"
                      type="number"
                      min="0"
                      className="input"
                      placeholder="Ex: 30"
                      value={form.prazoAtual}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prazoSolicitado">Prazo Solicitado (dias)</label>
                    <input
                      id="prazoSolicitado"
                      name="prazoSolicitado"
                      type="number"
                      min="0"
                      className="input"
                      placeholder="Ex: 45"
                      value={form.prazoSolicitado}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="justificativa">Justificativa</label>
                  <select id="justificativa" name="justificativa" className="input" value={form.justificativa} onChange={handleChange} required>
                    <option value="">Selecione...</option>
                    <option value="fidelizacao">Fidelização do cliente</option>
                    <option value="concorrencia">Concorrência de mercado</option>
                    <option value="dificuldade_financeira">Dificuldade financeira temporária</option>
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
                    {loading ? 'Enviando...' : 'Enviar Alteração'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
