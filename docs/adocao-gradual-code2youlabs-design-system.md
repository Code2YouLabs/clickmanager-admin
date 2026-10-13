# Adoção gradual do Code2YouLabs Design System

## Objetivo

Adotar os pacotes do `Code2YouLabs/design-system` no ClickManager de forma
incremental, mantendo este repositório fora da organização e sem uma troca
abrupta do Angular Material. A migração só avança quando a etapa anterior
estiver validada, publicada e utilizável pelo consumidor.

## Premissas

- O `clickmanager-admin` permanece no repositório e organização atuais.
- O consumo de pacotes privados é feito pelo GitHub Packages, com um token de
  leitura de pacotes configurado no ambiente de desenvolvimento e CI.
- Angular Material continua coexistindo durante a migração; não haverá
  substituição global de componentes.
- Cada etapa segue o ciclo planejador → implementador → revisor. Achados do
  revisor retornam para correção até aprovação ou bloqueio documentado.
- O estado operacional, as evidências e as transições ficam em
  `.agents/design-system-adoption/`; este arquivo é o plano de produto para a
  adoção gradual.

## Situação atual

As capacidades necessárias no Design System já foram entregues e integradas à
`main` do repositório fornecedor:

| Etapa | Resultado | Situação |
| --- | --- | --- |
| DS-1 | Consumo seguro de pacotes privados | Concluída |
| DS-2 | Preflight de compatibilidade Angular/Node | Concluída |
| DS-3 | Tailwind, PostCSS e estilos globais | Concluída |
| DS-4 | Componentes compatíveis com Angular Forms | Concluída |
| DS-5 | Upgrade e diff assistidos de templates | Concluída |
| DS-6 | Exemplo Angular 22 com migração incremental e Material coexistente | Concluída |
| DS-7 | Release estável do Design System | Concluída |

Os PRs que fecharam as últimas entregas foram
[#18](https://github.com/Code2YouLabs/design-system/pull/18) e
[#20](https://github.com/Code2YouLabs/design-system/pull/20).

## Plano de execução

### 1. Publicar uma release estável do Design System (DS-7)

Responsável: Design System.

1. Confirmar que os workspaces, a documentação de consumo privado e o exemplo
   Angular passam no CI da `main`.
2. Definir a versão estável e consolidar o changelog, incluindo requisitos de
   Angular, Node, Tailwind e autenticação de pacotes.
3. Publicar `@code2youlabs/tokens`, `styles`, `icons`, `react` e `angular` no
   GitHub Packages na ordem compatível com suas dependências.
4. Validar a instalação em um consumidor limpo e registrar as versões
   publicadas.

Critério de saída: existe uma versão estável, instalável com Yarn ou npm, com
documentação e exemplo compatíveis.

### 2. Preparar o ClickManager para consumo privado (APP-1)

1. Configurar o registry `@code2youlabs` e o token somente no ambiente/CI.
2. Confirmar que o token não entra no Git, imagem Docker ou bundles.
3. Registrar o procedimento de desenvolvimento e de pipeline.

Critério de saída: `yarn install --immutable` funciona no computador de
desenvolvimento e no CI sem expor credenciais.

### 3. Atualizar Angular em incrementos suportados (APP-2 a APP-4)

1. Atualizar para Angular 20, corrigir breaking changes e estabilizar testes.
2. Repetir o processo para Angular 21.
3. Atualizar para Angular 22, alinhando Angular CLI, TypeScript e Node à faixa
   exigida pelo Design System.

Critério de saída em cada versão: build, testes e fluxo crítico da aplicação
passam; não há migração de componentes do Design System nesta fase.

### 4. Instalar as fundações do Design System (APP-5)

1. Executar o `init` do CLI Angular em uma branch isolada.
2. Adicionar PostCSS, Tailwind e `company.css` preservando a ordem dos estilos
   globais já existentes.
3. Usar `doctor` e o preflight para confirmar compatibilidade antes de `add`.

Critério de saída: tokens e estilos estão disponíveis sem alterar a aparência
das telas existentes de forma não intencional.

### 5. Migrar uma tela piloto (APP-6)

1. Escolher uma tela de baixo risco, com poucos fluxos e cobertura de teste.
2. Migrar apenas os componentes necessários, mantendo Material onde o Design
   System ainda não for adotado.
3. Validar acessibilidade, responsividade, tema e fluxo de usuário.

Critério de saída: a tela piloto está em produção sem regressões e fornece um
padrão de migração reproduzível.

### 6. Expandir por famílias de componentes (APP-7 e APP-8)

1. Migrar inputs, botões e cards compartilhados.
2. Migrar controles de formulário e diálogos, usando Reactive Forms e CVA.
3. Manter adaptadores locais apenas enquanto houver necessidade de convivência
   com componentes Material não migrados.

Critério de saída: cada família é migrada com testes de interação, acessibilidade
e um plano explícito de reversão.

### 7. Consolidar e remover legados com segurança (APP-9)

1. Remover dependências Material somente quando não houver consumidores.
2. Limpar estilos duplicados, adaptadores temporários e documentação obsoleta.
3. Publicar guia interno de contribuição e de atualização do Design System.

Critério de saída: o ClickManager usa o Design System como padrão e as exceções
restantes são justificadas e registradas.

## Governança e limites

- Uma etapa não inicia sem os critérios de saída das dependências.
- Um revisor pode barrar apenas riscos reais: quebra de compatibilidade,
  regressão funcional, falha de acessibilidade, segurança de credenciais ou
  ausência de evidência de validação.
- Mudanças visuais em telas de negócio exigem validação humana antes de chegar
  à produção.
- Publicação de pacote e promoção para produção continuam sendo intervenções
  humanas explícitas.
