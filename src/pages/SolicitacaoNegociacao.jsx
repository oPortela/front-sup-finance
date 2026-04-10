import { useState } from 'react';
import Layout from '../components/Layout';
import RcaSelector from '../components/RcaSelector';
import ClienteSelector from '../components/ClienteSelector';
import Feedback from '../components/Feedback';
import Stepper from '../components/Stepper';
import { solicitarNegociacao } from '../services/api';

const ETAPAS = { RCA: 'rca', CLIENTE: 'cliente', FORMULARIO: 'formulario' };

const ESTADO_INICIAL = {
  tipoNegociacao: '',
  valorDebito: '',
  valorProposta: '',
  quantidadeParcelas: '',
  dataVencimento: '',
  descricaoDebito: '',
  observacao: '',
};

export default function SolicitacaoNegociacao({ onVoltar }) {
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
      await solicitarNegociacao({
        codusur: rcaSelecionado.codusur,
        codcli: clienteSelecionado.codcli,
        ...form,
      });
      setFeedback({ tipo: 'sucesso', mensagem: 'Solicitação de negociação enviada com sucesso!' });
      setForm(ESTADO_INICIAL);
      setEtapa(ETAPAS.RCA);
      setRcaSelecionado(null);
      setClienteSelecionado(null);
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      titulo="🤝 Solicitação de Negociação"
      subtitulo="Negociação de débitos ou condições especiais."
      onVoltar={onVoltar}
    >
      <Feedback
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onFechar={() => setFeedback({ tipo: '', mensagem: '' })}
      />

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
            <strong>{clienteSelecionado.nome}</strong>
            <button className="btn btn-outline btn-sm" onClick={() => setEtapa(ETAPAS.CLIENTE)}>
              Trocar cliente
            </button>
          </div>

          <h2 className="section-title">Dados da Negociação</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tipoNegociacao">Tipo de Negociação</label>
              <select id="tipoNegociacao" name="tipoNegociacao" className="input" value={form.tipoNegociacao} onChange={handleChange} required>
                <option value="">Selecione...</option>
                <option value="desconto_debito">Desconto em débito</option>
                <option value="parcelamento">Parcelamento de débito</option>
                <option value="prazo_especial">Prazo especial</option>
                <option value="bonificacao">Bonificação</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="descricaoDebito">Descrição do Débito / Situação</label>
              <textarea
                id="descricaoDebito"
                name="descricaoDebito"
                className="input textarea"
                placeholder="Descreva o débito ou a situação que motivou a negociação..."
                rows={3}
                value={form.descricaoDebito}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="valorDebito">Valor do Débito (R$)</label>
                <input
                  id="valorDebito"
                  name="valorDebito"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0,00"
                  value={form.valorDebito}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="valorProposta">Valor da Proposta (R$)</label>
                <input
                  id="valorProposta"
                  name="valorProposta"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0,00"
                  value={form.valorProposta}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantidadeParcelas">Qtd. de Parcelas</label>
                <input
                  id="quantidadeParcelas"
                  name="quantidadeParcelas"
                  type="number"
                  min="1"
                  className="input"
                  placeholder="Ex: 3"
                  value={form.quantidadeParcelas}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="dataVencimento">Data do 1º Vencimento</label>
                <input
                  id="dataVencimento"
                  name="dataVencimento"
                  type="date"
                  className="input"
                  value={form.dataVencimento}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observacao">Observações</label>
              <textarea
                id="observacao"
                name="observacao"
                className="input textarea"
                placeholder="Informações adicionais..."
                rows={3}
                value={form.observacao}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEtapa(ETAPAS.CLIENTE)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Negociação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
