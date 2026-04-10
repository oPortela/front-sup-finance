import { useState, useEffect } from 'react';
const URL_API = import.meta.env.VITE_URL_API;
const TOKEN_SUPERVISOR = import.meta.env.VITE_TOKEN_SUPERVISOR;

export default function ClienteSelector({ rca, onSelecionar, onVoltar }) {
  const [busca, setBusca] = useState('');

  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarClientesAPI = async () => {
      setCarregando(true);
      setErro(null);

      try {
        const token = TOKEN_SUPERVISOR;//localStorage.getItem('token_supervisor');

        if (!token) {
          setErro('Usuário não autenticado. Por favor, faça Login novamente.');
          setCarregando(false);
          return;
        }

        const url_api = `${URL_API}/clientes/listar/${rca.codusur}`;

        console.log("URL: ", url_api);

        const retorno = await fetch(url_api, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!retorno.ok) {
          throw new Error('Falha ao carregar a listagem de clientes do servisor.');
        }

        const json = await retorno.json();

        setClientes(json.data || []);
      } catch (error) {
        console.error("Erro na API de clientes:", error);
        setErro("Não foi possível buscar os clientes deste RCA. Por favor, tente novamente mais tarde.");
      } finally {
        setCarregando(false);
      }
    };

    if (rca && rca.codusur) {
      buscarClientesAPI();
    }
  }, [rca]);

  const filtrados = clientes.filter((c) => {
    const t = busca.toLowerCase()

    const nomeStr = c.cliente ? c.cliente.toLowerCase() : '';
    const codStr = c.codcli ? c.codcli.toString() : '';
    const cnpjStr = c.cgcent ? c.cgcent.toString() : '';

    return nomeStr.includes(t) || codStr.includes(t) || cnpjStr.includes(t);
  });

  return (
    <div className="card">
      <div className="rca-info-bar">
        <span>RCA selecionado:</span>
        <span className="badge">{rca.codusur}</span>
        <strong>{rca.nome}</strong>
        <button className="btn btn-outline btn-sm" onClick={onVoltar}>
          Trocar RCA
        </button>
      </div>

      <h2 className="section-title">Selecione o Cliente</h2>
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="input input-search"
          placeholder="Buscar por código, nome ou CNPJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <div className="list">
        {carregando && <p className='loading-msg'>Buscanco clientes...</p>}
        {erro && <p className='error-msg' style={{color: 'red'}}>{erro}</p>}

        {!carregando && !erro && filtrados.length === 0 ? (
          <p className="empty-msg">Nenhum cliente encontrado para este RCA.</p>
        ) : (
          !carregando && !erro && filtrados.map((c) => (
            <div key={c.codcli} className='list-item'>
              <span className='badge'>{c.codcli}</span>
              <div className='list-item-details'>
                <span className='list-item-name'>{c.cliente}</span>
                <span className='list-item-info'>{c.cgcent}</span>
              </div>

              <button className='btn btn-success btn-sm' onClick={() => onSelecionar(c)}>
                Selecionar →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/*

{filtrados.length === 0 ? (
          <p className="empty-msg">Nenhum cliente encontrado.</p>
        ) : (
          filtrados.map((c) => (
            <div key={c.codcli} className="list-item">
              <span className="badge">{c.codcli}</span>
              <div className="list-item-details">
                <span className="list-item-name">{c.nome}</span>
                <span className="list-item-info">{c.cnpj}</span>
              </div>
              <button className="btn btn-success btn-sm" onClick={() => onSelecionar(c)}>
                Selecionar →
              </button>
            </div>
          ))
        )}
*/