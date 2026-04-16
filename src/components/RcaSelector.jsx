import { useEffect, useState } from 'react';
const URL_API = import.meta.env.VITE_URL_API;
const TOKEN_SUPERVISOR = import.meta.env.VITE_TOKEN_SUPERVISOR;

export default function RcaSelector({ onSelecionar }) {
  const [busca, setBusca] = useState('');

  const [rcas, setRcas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarRcasApi = async () => {
      try {
        const token = localStorage.getItem('token_supervisor');//`${TOKEN_SUPERVISOR}`;

        const supervisorStr = localStorage.getItem('usuario_logado');
        const supervisorLogado = supervisorStr ? JSON.parse(supervisorStr) : null;
        const codsupervisorEnvio = supervisorLogado ? (supervisorLogado.codsupervisor || supervisorLogado.id) : 7000;

        if (!token) {
          setErro('Usuário não autenticado. Por favor, faça Login novamente.');
          setCarregando(false);
          return;
        }

        const retorno =await fetch(`${URL_API}/rcas/listar/${codsupervisorEnvio}`, {//fetch('http://127.0.0.1:8000/api/rcas/listar/300', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!retorno.ok) {
          throw new Error('Falha ao carregar a listagem de RCAS do servidor.');
        }

        const json = await retorno.json();

        setRcas(json.data || []);
      } catch (error) {
        console.error("Erro na API de rcas:", error);
        setErro("Não foi possível conectar ao servidor para obter a lista de RCAS. Por favor, tente novamente mais tarde.");
      } finally {
        setCarregando(false);
      }
    };

    buscarRcasApi();
  }, []);

  const filtrados = rcas.filter((r) => {
    const t = busca.toLowerCase();

    return r.nome.toLowerCase().includes(t) || r.codusur.toString().includes(t) || r.qtd_cliente.toString().includes(t);
  })

  return (
    <div className="card">
      <h2 className="section-title">Selecione o RCA</h2>
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="input input-search"
          placeholder="Buscar por código ou nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <div className="list">
        {filtrados.length === 0 ? (
          <p className="empty-msg">Nenhum RCA encontrado.</p>
        ) : (
          filtrados.map((rca) => (
            <div key={rca.codusur} className="list-item">
              <span className="badge">{rca.codusur}</span>
              <span className="list-item-name">{rca.nome}</span>
              <span className="list-item-info">{rca.qtd_cliente} clientes</span>
              <button className="btn btn-success btn-sm" onClick={() => onSelecionar(rca)}>
                Selecionar →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
