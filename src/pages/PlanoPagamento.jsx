import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import RcaSelector from '../components/RcaSelector';
import ClienteSelector from '../components/ClienteSelector';
import Feedback from '../components/Feedback';
import Stepper from '../components/Stepper';
import ConsultaSolicitacoes from '../components/ConsultaSolicitacoes';
import { alterarPlanoPagamento } from '../services/api';
const URL_API = import.meta.env.VITE_URL_API;

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
  const [planosPagamento, setPlanosPagamento] = useState([]);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [planoAtual, setPlanoAtual] = useState([]);
  const [carregandoPlanoAtual, setCarregandoPlanoAtual] = useState(false);
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePlanoChange = (e) => {
    const codPlano = e.target.value;

    const planoInfo = planosPagamento.find(
      (p) => String(p.codplpag) === String(codPlano)
    );

    setForm((prev) => ({
      ...prev,
      planoSolicitado: codPlano,
      prazoSolicitado: planoInfo ? planoInfo.numdias : ''
    }));
  };

  useEffect(() => {
    const buscarPlanos = async () => {
      setCarregandoPlanos(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const url = `${URL_API}/plano/lista`;

        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!resposta.ok) throw new Error('Falha ao carregar planos de pagamento');

        const json = await resposta.json();

        setPlanosPagamento(json.data || []);

      } catch (err) {
        console.error("Erro ao buscar planos:", err);
      } finally {
        setCarregandoPlanos(false);
      }
    };

    buscarPlanos();
  }, []);

  useEffect(() => {
    const buscarPlanoAtual = async () => {
      setCarregandoPlanoAtual(true);
      try {
        const token = localStorage.getItem('token_supervisor');
        const url = `${URL_API}/plano/atual/${clienteSelecionado.codcli}`;

        const resposta = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!resposta.ok) throw new Error('Falha ao carregar plano de pagamento');

        const json = await resposta.json();

        setForm((prev) => ({
          ...prev,
          planoAtual: `${json.codplpag} - ${json.plano}`,
          prazoAtual: json.numdias || 0
        }));

      } catch (err) {
        console.error(err)
        setFeedback({ tipo: 'erro', mensagem: err.message});
      } finally {
        setCarregandoPlanoAtual(false);
      }
    };

    if (etapa === ETAPAS.FORMULARIO && clienteSelecionado?.codcli){
      buscarPlanoAtual();
    }
  }, [etapa, clienteSelecionado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ tipo: '', mensagem: '' });
    try {
      const token = localStorage.getItem('token_supervisor');

      const supervisorStr = localStorage.getItem('usuario_logado');
      const supervisorLogado = supervisorStr ? JSON.parse(supervisorStr) : null;
      const codSupervisorEnvio = supervisorLogado ? (supervisorLogado.codsupervisor || supervisorLogado.id) : 7000;

      const payload = {
        codcli: parseInt(clienteSelecionado.codcli, 10),
        codsupervisor: parseInt(codSupervisorEnvio, 10),
        codusur: parseInt(rcaSelecionado.codusur, 10),
        plano_sol: parseInt(form.planoSolicitado, 10),
        motivo: form.justificativa,
        obs: form.observacao || ""
      };

      console.log("Enviando payload JSON:", payload);

      const url = `${URL_API}/plano/plano-solicitar`;

      const resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) {
        const erroData = await resposta.json();
        throw new Error(erroData.detail || 'Falha ao enviar a solicitação de alteração de plano de pagamento.');
      }

      setFeedback({ 
        tipo: 'sucesso', 
        mensagem: 'Alteração de plano de pagamento enviada com sucesso!' 
      });

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
                      readOnly
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="planoSolicitado">Plano Solicitado</label>
                    <select 
                      name="planoSolicitado" 
                      id="planoSolicitado"
                      className='input'
                      value={form.planoSolicitado}
                      onChange={handlePlanoChange}
                      required
                      disabled={carregandoPlanos}
                    >
                      <option value="">
                        {carregandoPlanos ? 'Carregando planos...' : 'Selecione um plano...'}
                      </option>

                      {planosPagamento.map((plano) => (
                        <option key={plano.codplpag} value={plano.codplpag}>
                          {plano.codplpag} - {plano.descricao}
                        </option>
                      ))}
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
                      readOnly
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
                      readOnly
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
