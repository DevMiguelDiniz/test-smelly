# Etapa 4: ESLint × análise manual

Comando: `npx eslint .` (ESLint 8 + `eslint-plugin-jest`, config em `.eslintrc.json`).
Resultado: 4 erros e 2 avisos, todos em `test/userService.smelly.test.js`.

| Linha | Regra | Smell correspondente na análise manual |
|-------|-------|----------------------------------------|
| 44, 46, 49 | `jest/no-conditional-expect` (erro) | Lógica condicional (`for` + `if/else`, teste 2) |
| 73 | `jest/no-conditional-expect` (erro) | Falso positivo com try/catch (teste 4) |
| 77 | `jest/no-disabled-tests` (aviso) | Teste ignorado (teste 5) |
| 77 | `jest/expect-expect` (aviso) | Teste vazio, sem asserts (teste 5) |

## O que o ESLint pegou
- Lógica condicional e try/catch com `expect` dentro (os dois são o mesmo padrão para a regra).
- Teste ignorado e teste sem assertions.

## O que o ESLint não pegou (só a análise manual)
- **Teste frágil** (teste 3): acoplamento ao formato exato da string do relatório.
- **Eager Test / Assertion Roulette** (teste 1): vários Acts e asserts em um teste só.
- **Estado global compartilhado** (`db` do módulo, `_clearDB`) e **cobertura incompleta**.

Conclusão: a ferramenta detecta smells sintáticos (estrutura do código), mas smells
semânticos, que dependem do significado do teste, exigem revisão humana.

# Etapa 5: Refatoração (`__tests__/userService.clean.test.js`)

O arquivo original foi mantido. No novo arquivo:
- **AAA** em todos os testes, com comentários Arrange/Act/Assert.
- **Eager Test dividido:** o teste 1 virou testes separados de `createUser` e `getUserById`;
  o teste 2 virou testes separados para usuário comum e administrador.
- **Sem `if`/`for`/`try-catch`:** exceções verificadas com `expect(fn).toThrow(msg)`.
- **Menos frágil:** o relatório é verificado por conteúdo (nome, id, status), não pela linha exata.
- **Nomes descritivos** e agrupamento por método com `describe`.
- **Testes novos** para os ramos antes sem cobertura: relatório vazio, id inexistente,
  campos obrigatórios.
- `npx eslint .` não reporta nada no arquivo novo e os 21 testes passam.
