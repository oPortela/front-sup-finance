import { useState } from "react";
import '../styles/global.css';
import { fazerLogin } from '../services/api';

export default function Login({ onNavegar, onLoginSucesso }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (evento) => {
        evento.preventDefault();
        if (!usuario || !senha) {
            setErro('Preencha o usuário e a senha.');
            return;
        }

        setLoading(true);
        setErro('');

        try {
            const json = await fazerLogin(usuario, senha);

            // Salva token e dados do usuário no localStorage
            localStorage.setItem('token_supervisor', json.access_token);
            localStorage.setItem('usuario_logado', JSON.stringify(json.usuario));

            // Redireciona conforme o nível
            if (json.usuario.nivel === 'A') {
                onLoginSucesso(json.usuario);
                onNavegar('admin');
            } else {
                onLoginSucesso(json.usuario);
                onNavegar('home');
            }
        } catch (err) {
            setErro(err.message || 'Usuário ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tela-login-fundo">
            <div className="cartao-login">
                <div className="login-logo">🏢</div>
                <h2>Portal do Supervisor</h2>
                <p className="subtitulo-login">Acesso ao Sistema Financeiro</p>

                <form onSubmit={handleSubmit} className="form-login">
                    {erro && (
                        <div className="login-erro" role="alert">{erro}</div>
                    )}

                    <div className="grupo-input">
                        <label htmlFor="login-usuario">Usuário</label>
                        <input
                            id="login-usuario"
                            type="text"
                            placeholder="Digite seu usuário"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    <div className="grupo-input">
                        <label htmlFor="login-senha">Senha</label>
                        <input
                            id="login-senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="botao-entrar" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
