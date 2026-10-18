# Análise de Test Smells — `test/userService.smelly.test.js`

Observações feitas manualmente, teste a teste, sobre o arquivo `test/userService.smelly.test.js`
(que testa `src/userService.js`).

## Resumo

| # | Teste | Test Smell(s) identificado(s) | Linhas |
|---|-------|-------------------------------|--------|
| 1 | `deve criar e buscar um usuário corretamente` | Eager Test (teste ansioso) / múltiplos Acts, Assertion Roulette | 18–31 |
| 2 | `deve desativar usuários se eles não forem administradores` | Lógica Condicional no Teste, Eager Test, Assertion Roulette | 33–52 |
| 3 | `deve gerar um relatório de usuários formatado` | Teste Frágil (Fragile Test), Convidado Misterioso (parcial) | 54–64 |
| 4 | `deve falhar ao criar usuário menor de idade` | Falso Positivo / Try-Catch (Expected Exception Smell) | 66–75 |
| 5 | `deve retornar uma lista vazia quando não há usuários` | Teste Ignorado (Ignored Test) / Empty Test | 77–79 |
| — | Suíte como um todo | Acoplamento ao estado global (Test Run War / Dependência de `_clearDB`), cobertura incompleta | 9–16 |

---

## 1. Eager Test / Assertion Roulette — teste 1 (linhas 18–31)

```js
// Act 1: Criar ... expect(...)
// Act 2: Buscar ... expect(...) expect(...)
```

- **Problema:** o teste verifica duas operações (`createUser` e `getUserById`) e faz três
  asserts sem mensagem descritiva. O próprio comentário revela dois "Acts".
- **Impacto:** se falhar, não fica claro se o defeito está na criação ou na busca;
  viola o princípio de "um comportamento por teste".
- **Correção:** separar em testes distintos (ex.: "createUser retorna usuário com id" e
  "getUserById retorna o usuário criado com status ativo").

## 2. Lógica Condicional no Teste (Conditional Test Logic) — teste 2 (linhas 33–52)

```js
for (const user of todosOsUsuarios) {
  ...
  if (!user.isAdmin) { expect(...) } else { expect(...) }
}
```

- **Problema:** o teste contém `for` e `if/else`. Os caminhos executados dependem de dados,
  então o teste fica mais difícil de ler e pode esconder falhas (um `expect` pode nunca
  rodar sem que ninguém perceba). Também é um Eager Test: cobre duas regras de negócio
  (desativar comum / proteger admin) em um só caso.
- **Impacto:** testes devem ser lineares e determinísticos; o teste em si pode ter bugs.
- **Correção:** dividir em dois testes — "desativa usuário comum" e "não desativa
  administrador" — sem laços nem condicionais.

## 3. Teste Frágil (Fragile Test) — teste 3 (linhas 54–64)

```js
const linhaEsperada = `ID: ${usuario1.id}, Nome: Alice, Status: ativo\n`;
expect(relatorio).toContain(linhaEsperada);
expect(relatorio.startsWith('--- Relatório de Usuários ---')).toBe(true);
```

- **Problema:** o teste está acoplado ao formato exato da string (espaços, vírgulas, `\n`,
  título do cabeçalho). O código-fonte já avisa: "O formato do relatório pode mudar no futuro".
- **Impacto:** qualquer mudança cosmética no relatório quebra o teste sem que haja bug
  funcional (falha por acoplamento à implementação, não ao comportamento).
- **Obs.:** `usuario1` (Alice) é verificada, mas o usuário Bob criado na linha 56 nunca é
  usado nas verificações — dado criado sem propósito claro no resultado esperado
  (leve **Convidado Misterioso**: o leitor não vê no teste por que Bob existe).
- **Correção:** verificar apenas informações essenciais (ex.: nome e status presentes via
  `toContain('Alice')`), ou usar regex/parser tolerante ao formato.

## 4. Falso Positivo com Try/Catch (Expected Exception Smell) — teste 4 (linhas 66–75)

```js
try {
  userService.createUser('Menor', 'menor@email.com', 17);
} catch (e) {
  expect(e.message).toBe('O usuário deve ser maior de idade.');
}
```

- **Problema:** se `createUser` **não** lançar exceção, o `catch` nunca executa, nenhum
  `expect` roda e o teste **passa**. Ou seja, ele passa mesmo com o bug que deveria detectar.
  O próprio comentário no código descreve isso.
- **Impacto:** falsa sensação de segurança — teste sem poder de detecção.
- **Correção:** usar `expect(() => userService.createUser(...)).toThrow('O usuário deve ser maior de idade.')`
  ou `expect.assertions(1)`.

## 5. Teste Ignorado / Vazio (Ignored Test, Empty Test) — teste 5 (linhas 77–79)

```js
test.skip('deve retornar uma lista vazia quando não há usuários', () => {
  // TODO: Implementar este teste depois.
});
```

- **Problema:** teste pulado e sem corpo; fica como dívida técnica ("TODO") e dá a
  impressão de que o cenário está coberto.
- **Impacto:** o ramo `users.length === 0` de `generateUserReport`
  (`Nenhum usuário cadastrado.`) permanece sem cobertura.
- **Correção:** implementar o teste (relatório sem usuários) ou removê-lo.

## 6. Problemas transversais da suíte

- **Dependência de estado global / compartilhado:** `db` em `src/userService.js` é um
  objeto de módulo (global). O `beforeEach` precisa chamar `_clearDB()` — um método
  existente só para testes — para evitar que um teste contamine o outro. Se esquecido,
  os testes passam a depender da ordem de execução (*Test Run War / Interacting Tests*).
- **Dados repetidos/mágicos:** `dadosUsuarioPadrao` é usado só no teste 1; os demais
  testes usam literais inline (`'Comum'`, `30`, `'Alice'`...), sem padrão (*Magic Numbers /
  Mystery Guest leve* quanto à origem dos dados).
- **Cobertura incompleta:** não há testes para validação de campos obrigatórios
  (`Nome, email e idade são obrigatórios.`), nem para `getUserById` com id inexistente
  ou `deactivateUser` com id inexistente.

## Conclusão

Foram identificados pelo menos **cinco tipos** de smell: Eager Test / Assertion Roulette,
Lógica Condicional, Teste Frágil, Falso Positivo com try/catch e Teste Ignorado/Vazio,
além de problemas de estado compartilhado e cobertura.
