# Portal do Supervisor — Documentação

## O que foi feito

O projeto foi reestruturado e expandido com quatro módulos completos, cada um com fluxo de 3 etapas, responsividade e integração pronta para API.

---

## Estrutura de arquivos

```
src/
├── App.jsx                          # Roteador principal (sem biblioteca externa)
├── index.css                        # Reset mínimo
├── main.jsx                         # Entry point React
│
├── components/
│   ├── Layout.jsx                   # Cabeçalho + wrapper de página
│   ├── RcaSelector.jsx              # Seleção de RCA com busca
│   ├── ClienteSelector.jsx          # Seleção de cliente com busca
│   └── Feedback.jsx                 # Alerta de sucesso/erro
│
├── pages/
│   ├── Home.jsx                     # Tela inicial com os 4 módulos
│   ├── LimiteCredito.jsx            # Módulo: Limite de Crédito
│   ├── PlanoPagamento.jsx           # Módulo: Plano de Pagamento
│   ├── RecadastroCliente.jsx        # Módulo: Recadastro de Cliente
│   └── SolicitacaoNegociacao.jsx    # Módulo: Solicitação de Negociação
│
├── services/
│   └── api.js                       # Camada de integração com a API
│
└── styles/
    └── global.css                   # Todos os estilos da aplicação
```

---

## Fluxo de cada módulo

Todos os módulos seguem o mesmo fluxo de 3 etapas:

```
[1] Selecionar RCA  →  [2] Selecionar Cliente  →  [3] Preencher Formulário  →  Enviar
```

O usuário pode voltar em qualquer etapa sem perder o contexto.

---

## Componentes reutilizáveis

### `Layout.jsx`
Wrapper de página. Recebe `titulo`, `subtitulo` e `onVoltar` (opcional).
Quando `onVoltar` é passado, exibe o botão "← Voltar".

### `RcaSelector.jsx`
Lista de RCAs com campo de busca por código ou nome.
Chama `onSelecionar(rca)` ao clicar em "Selecionar".

> Para usar dados reais: importe `getRcas` de `services/api.js` e carregue via `useEffect`.

### `ClienteSelector.jsx`
Lista de clientes do RCA selecionado, com busca por código, nome ou CNPJ.
Exibe o RCA ativo no topo com opção de troca.

> Para usar dados reais: importe `getClientesByRca` de `services/api.js`.

### `Feedback.jsx`
Alerta de sucesso (verde) ou erro (vermelho) com botão de fechar.
Props: `tipo` (`"sucesso"` | `"erro"`), `mensagem`, `onFechar`.

---

## Integração com a API

Toda a comunicação com o backend está centralizada em `src/services/api.js`.

### Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=https://sua-api.com/api
```

Se a variável não for definida, o valor padrão é `https://sua-api.com/api`.

### Endpoints esperados

| Módulo                  | Método | Endpoint                            |
|-------------------------|--------|-------------------------------------|
| Listar RCAs             | GET    | `/rcas`                             |
| Clientes por RCA        | GET    | `/rcas/:codusur/clientes`           |
| Limite de Crédito       | POST   | `/solicitacoes/limite-credito`      |
| Plano de Pagamento      | POST   | `/solicitacoes/plano-pagamento`     |
| Recadastro de Cliente   | POST   | `/solicitacoes/recadastro`          |
| Solicitação de Negociação | POST | `/solicitacoes/negociacao`          |

### Payload de cada módulo

**Limite de Crédito**
```json
{
  "codusur": "7045",
  "codcli": "1001",
  "limiteAtual": 5000.00,
  "limiteSolicitado": 10000.00,
  "motivo": "historico_pagamento",
  "observacao": "..."
}
```

**Plano de Pagamento**
```json
{
  "codusur": "7045",
  "codcli": "1001",
  "planoAtual": "30/60",
  "planoSolicitado": "30/60/90",
  "prazoAtual": 60,
  "prazoSolicitado": 90,
  "justificativa": "fidelizacao",
  "observacao": "..."
}
```

**Recadastro de Cliente**
```json
{
  "codusur": "7045",
  "codcli": "1001",
  "razaoSocial": "Empresa Alpha Ltda",
  "cnpj": "00.000.000/0001-00",
  "inscricaoEstadual": "...",
  "email": "contato@empresa.com",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Exemplo",
  "numero": "100",
  "complemento": "Sala 1",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "uf": "SP",
  "cep": "01000-000",
  "motivoRecadastro": "mudanca_endereco",
  "observacao": "..."
}
```

**Solicitação de Negociação**
```json
{
  "codusur": "7045",
  "codcli": "1001",
  "tipoNegociacao": "parcelamento",
  "descricaoDebito": "...",
  "valorDebito": 3000.00,
  "valorProposta": 2500.00,
  "quantidadeParcelas": 3,
  "dataVencimento": "2026-04-10",
  "observacao": "..."
}
```

### Autenticação

Para adicionar token JWT, edite `src/services/api.js` na função `request`:

```js
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  ...options.headers,
},
```

---

## Responsividade

A aplicação se adapta a três breakpoints:

| Tela         | Comportamento                                      |
|--------------|----------------------------------------------------|
| > 600px      | Grid de módulos 2–4 colunas, formulários em linha  |
| ≤ 600px      | Grid 2 colunas, formulários empilhados             |
| ≤ 400px      | Grid 1 coluna (mobile pequeno)                     |

---

## Como rodar

```bash
npm install
npm run dev
```

---

## Próximos passos sugeridos

- Substituir os mocks de RCA e clientes pelas chamadas reais em `api.js`
- Adicionar autenticação (login/token)
- Implementar histórico de solicitações por supervisor
- Adicionar loading skeleton nas listas
