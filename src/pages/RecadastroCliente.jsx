import { useState } from 'react';
import Layout from '../components/Layout';
import RcaSelector from '../components/RcaSelector';
import ClienteSelector from '../components/ClienteSelector';
import Feedback from '../components/Feedback';
import Stepper from '../components/Stepper';
import { solicitarRecadastro } from '../services/api';

const ETAPAS = { RCA: 'rca', CLIENTE: 'cliente', FORMULARIO: 'formulario' };

const ESTADO_INICIAL = {
  razaoSocial: '',
  cnpj: '',
  inscricaoEstadual: '',
  email: '',
  telefone: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
  motivoRecadastro: '',
  observacao: '',
};

export default function RecadastroCliente({ onVoltar }) {
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
      await solicitarRecadastro({
        codusur: rcaSelecionado.codusur,
        codcli: clienteSelecionado.codcli,
        ...form,
      });
      setFeedback({ tipo: 'sucesso', mensagem: 'Recadastro enviado com sucesso!' });
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
      titulo="🔄 Recadastro de Cliente"
      subtitulo="Atualização de dados cadastrais no sistema."
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
          onSelecionar={(c) => {
            setClienteSelecionado(c);
            // Pré-preenche com dados existentes do cliente
            setForm((prev) => ({ ...prev, razaoSocial: c.nome, cnpj: c.cnpj }));
            setEtapa(ETAPAS.FORMULARIO);
          }}
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

          <h2 className="section-title">Dados Cadastrais</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group form-group-wide">
                <label htmlFor="razaoSocial">Razão Social</label>
                <input id="razaoSocial" name="razaoSocial" type="text" className="input" value={form.razaoSocial} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="cnpj">CNPJ</label>
                <input id="cnpj" name="cnpj" type="text" className="input" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inscricaoEstadual">Inscrição Estadual</label>
                <input id="inscricaoEstadual" name="inscricaoEstadual" type="text" className="input" value={form.inscricaoEstadual} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input id="telefone" name="telefone" type="tel" className="input" placeholder="(00) 00000-0000" value={form.telefone} onChange={handleChange} required />
              </div>
            </div>

            <h3 className="section-subtitle">Endereço</h3>
            <div className="form-row">
              <div className="form-group form-group-wide">
                <label htmlFor="endereco">Logradouro</label>
                <input id="endereco" name="endereco" type="text" className="input" value={form.endereco} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="numero">Número</label>
                <input id="numero" name="numero" type="text" className="input" value={form.numero} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="complemento">Complemento</label>
                <input id="complemento" name="complemento" type="text" className="input" value={form.complemento} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bairro">Bairro</label>
                <input id="bairro" name="bairro" type="text" className="input" value={form.bairro} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="cidade">Cidade</label>
                <input id="cidade" name="cidade" type="text" className="input" value={form.cidade} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="uf">UF</label>
                <input id="uf" name="uf" type="text" className="input" maxLength={2} placeholder="SP" value={form.uf} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="cep">CEP</label>
                <input id="cep" name="cep" type="text" className="input" placeholder="00000-000" value={form.cep} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="motivoRecadastro">Motivo do Recadastro</label>
              <select id="motivoRecadastro" name="motivoRecadastro" className="input" value={form.motivoRecadastro} onChange={handleChange} required>
                <option value="">Selecione...</option>
                <option value="mudanca_endereco">Mudança de endereço</option>
                <option value="atualizacao_contato">Atualização de contato</option>
                <option value="correcao_dados">Correção de dados</option>
                <option value="mudanca_razao_social">Mudança de razão social</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="observacao">Observações</label>
              <textarea id="observacao" name="observacao" className="input textarea" rows={3} value={form.observacao} onChange={handleChange} />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEtapa(ETAPAS.CLIENTE)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Recadastro'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
