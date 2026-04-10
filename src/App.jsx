import { useState } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import LimiteCredito from './pages/LimiteCredito';
import PlanoPagamento from './pages/PlanoPagamento';
import RecadastroCliente from './pages/RecadastroCliente';
import SolicitacaoNegociacao from './pages/SolicitacaoNegociacao';

export default function App() {
  const [tela, setTela] = useState('login');
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  const handleLoginSucesso = (usuario) => {
    setUsuarioLogado(usuario);
  };

  const handleLogout = () => {
    localStorage.removeItem('token_supervisor');
    localStorage.removeItem('usuario_logado');
    setUsuarioLogado(null);
    setTela('login');
  };

  const navegar = (destino) => setTela(destino);

  if (tela === 'login') {
    return <Login onNavegar={navegar} onLoginSucesso={handleLoginSucesso} />;
  }

  if (tela === 'admin') {
    return (
      <Admin
        usuarioLogado={usuarioLogado}
        onVoltar={handleLogout}
      />
    );
  }

  const props = {
    onNavegar: navegar,
    onVoltar: () => navegar('home'),
    usuarioLogado,
    onLogout: handleLogout,
  };

  const telas = {
    home: <Home {...props} />,
    limite: <LimiteCredito {...props} />,
    plano: <PlanoPagamento {...props} />,
    recadastro: <RecadastroCliente {...props} />,
    negociacao: <SolicitacaoNegociacao {...props} />,
  };

  return telas[tela] || <Home {...props} />;
}
