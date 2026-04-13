# Rotas para ajustar em ConsultaSolicitacoes.jsx

## 1. Editar solicitação

**Arquivo:** `src/components/ConsultaSolicitacoes.jsx`  
**Função:** `ModalEdicao` → `handleSubmit`  
**Linha aprox:** busque por `endpointBase}/${solicitacao.id_solicitacao}`

```js
const resp = await fetch(`${URL_API}${endpointBase}/${solicitacao.id_solicitacao}`, {
  method: 'PUT',
  ...
  body: JSON.stringify({
    limite_sol: parseFloat(form.limite_sol),
    motivo: form.motivo,
    obs: form.obs,
  }),
});
```

Ajuste o trecho `${endpointBase}/${solicitacao.id_solicitacao}` para o path correto da sua rota PUT de edição.  
Ajuste também os campos do body se os nomes dos parâmetros forem diferentes no seu backend.

---

## 2. Cancelar solicitação (exclusão lógica)

**Arquivo:** `src/components/ConsultaSolicitacoes.jsx`  
**Função:** `ModalCancelamento` → `handleCancelar`  
**Linha aprox:** busque por `endpointBase}/${solicitacao.id_solicitacao}/cancelar`

```js
const resp = await fetch(`${URL_API}${endpointBase}/${solicitacao.id_solicitacao}/cancelar`, {
  method: 'PUT',
  ...
  body: JSON.stringify({ status: 'C' }),
});
```

Ajuste o path `/cancelar` para o sufixo correto da sua rota PUT de cancelamento.  
Se o campo no body não for `status`, ajuste o nome também.

---

## 3. Campo id da solicitação

Em ambas as rotas acima, o id usado é `solicitacao.id_solicitacao`.  
Se o campo de id no retorno da sua API tiver outro nome, busque por `id_solicitacao` no arquivo e substitua.

---

## 4. Regra de quem pode editar/cancelar

Por padrão, os botões só aparecem para solicitações com status `P` (Pendente).  
Isso está na função `podeEditar`:

```js
const podeEditar = (s) => s.status === 'P';
```

Ajuste a condição se quiser liberar para outros status.
