/**
 * Camada de serviço para integração com a API.
 */

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_URL_API || 'https://sua-api.com/api';
const URL_API = import.meta.env.VITE_URL_API

function getToken() {
  return localStorage.getItem('token_supervisor') || import.meta.env.VITE_TOKEN_SUPERVISOR || '';
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token_supervisor');
  if (!token) {
    throw new Error('Usuário não autenticado. Por favor, faça login.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.detail || error.message || `Erro ${response.status}`);
  }

  return response.json();
}

// --- Auth ---
export const fazerLogin = async (usuario, senha) => {
  //request('/auth/login', { method: 'POST', body: JSON.stringify({ login, senha }) });
  const response = await fetch(`${URL_API}/usuarios/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ usuario, senha }),
  });

  if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erro ao realizar login.');
    }

    return response.json();
}
  

// --- Usuários (Admin) ---
export const listarUsuarios = async () => {
    const response = await fetch(`${URL_API}/usuarios/lista`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         throw new Error(errData.detail || 'Falha ao carregar usuários.');
    }

    return response.json();
};


//export const criarUsuario = (dados) =>
  //request('/usuarios', { method: 'POST', body: JSON.stringify(dados) });

export const criarUsuario = async (dadosUsuario) => {
  const token = localStorage.getItem('token_supervisor')

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const response = await fetch(`${URL_API}/usuarios/cadastro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dadosUsuario),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao criar usuário.');
  }

  return response.json();
}

export const atualizarUsuario = (id, dados) =>
  request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
export const toggleAtivoUsuario = (id, ativo) =>
  request(`/usuarios/${id}/ativo`, { method: 'PATCH', body: JSON.stringify({ ativo }) });

// --- RCA ---
export const getRcas = () => request('/rcas');

// --- Clientes ---
export const getClientesByRca = (codusur) => request(`/rcas/${codusur}/clientes`);

// --- Limite de Crédito ---
export const solicitarLimiteCredito = (dados) =>
  request('/solicitacoes/limite-credito', { method: 'POST', body: JSON.stringify(dados) });

// --- Plano de Pagamento ---
export const alterarPlanoPagamento = (dados) =>
  request('/solicitacoes/plano-pagamento', { method: 'POST', body: JSON.stringify(dados) });

// --- Recadastro ---
export const solicitarRecadastro = (dados) =>
  request('/solicitacoes/recadastro', { method: 'POST', body: JSON.stringify(dados) });

// --- Negociação ---
export const solicitarNegociacao = (dados) =>
  request('/solicitacoes/negociacao', { method: 'POST', body: JSON.stringify(dados) });
