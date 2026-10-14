# Padronização de ícones do Admin

Data: 14/10/2026. Branch: `refactor/admin-padronizar-icones`.

## Referência do ClickManager App

A integração consolidada de navegação e dos elementos `<i-tabler>` é Tabler:

- Pacote declarado: `angular-tabler-icons` `^2.7.0`.
- Versão efetivamente instalada e registrada no lockfile: **2.47.0**.
- Angular declarado no App: `^19.0.4`.
- Bootstrap: `TablerIconsModule.pick(TablerIcons)` em `app.config.ts`.
- Componentes standalone importam `TablerIconsModule`; templates usam `name="mail"`, `[name]` ou interpolação.
- Os SVGs usam grade 24×24, traço 2, `currentColor`, classes existentes `icon-N`, `routeIcon` e estados herdados do componente.
- Ícones preenchidos também estão presentes, por exemplo `circle-filled`.
- Os nomes estáticos mais frequentes no App são `trash`, `edit`, `star`, `user`, `message-2`, `search`, `x`, `phone` e `clock`.

O App também usa Material Icons em formulários/controles e registra Feather. A varredura encontrou 340 elementos i-tabler, 832 mat-icon e nenhum i-feather nos templates e templates inline de produção, excluindo specs e snippets de documentação. Não existe uma única biblioteca para todos os ícones do App. Mantivemos essa coexistência no Admin, com Tabler como referência para os mesmos elementos i-tabler. Não encontramos ícones SVG personalizados nesse mecanismo que precisassem ser copiados.

O repositório App foi usado somente como referência e não recebeu alterações.

## Problema do Admin e abrangência

`DesignSystemIconComponent` imitava o seletor i-tabler, mas consultava `@code2youlabs/icons` com apenas 28 aliases. Muitos não representavam o símbolo solicitado, e qualquer nome desconhecido recebia silenciosamente `infoCircle`.

Exemplos confirmados:

| Nome solicitado | Símbolo anterior | Símbolo atual |
| --- | --- | --- |
| mail | x | envelope Tabler |
| credit-card | eye | cartão Tabler |
| receipt-2 | eyeOff | recibo Tabler |
| building | infoCircle | prédio Tabler |
| chart-funnel | search | funil Tabler |
| calculator | loader | calculadora Tabler |
| layout-dashboard | circleCheck | dashboard Tabler |
| trash | infoCircle (fallback) | lixeira Tabler |
| edit | infoCircle (fallback) | edição Tabler |

A auditoria dos templates encontrou **353 elementos i-tabler**, sendo **336 referências estáticas** e **17 bindings dinâmicos**. Entre as referências estáticas, **291 símbolos estavam comprovadamente incorretos**: 267 recebiam o fallback e 24 utilizavam aliases com significado diferente. As demais 45 referências estáticas tinham correspondência semântica no adaptador anterior. Todos os 353 elementos agora usam a implementação Tabler.

Incluindo valores em menus, categorias, mapas locais e retornos de métodos, o verificador valida **402 referências de código**, que usam **141 nomes distintos**. Esses números não representam 402 ícones simultaneamente visíveis. Nenhum nome estático inválido foi encontrado no conjunto atual. Ícones preenchidos, de marcas e compostos com linhas/círculos/retângulos passam a ser renderizados pela biblioteca, sem redução a paths nem símbolos substitutos.

## Compatibilidade com Angular 22

`angular-tabler-icons` 2.47.0 declara peers Angular 14–17. A versão pública mais recente consultada, 3.26.0, declara Angular 17–19. Não há versão desse adaptador antigo com suporte declarado ao Angular 22. Não forçamos esses peers.

Usamos a mesma biblioteca visual **Tabler**, através da distribuição Angular oficial **`@tabler/icons-angular` 3.49.0** e do peer obrigatório **`@tabler/icons` 3.49.0**. Ela declara suporte Angular `>=21.0.0`, incluindo 22, e oferece componente standalone, definições tipadas, outline/filled e imports seletivos. O catálogo visual é o mesmo; o pacote de integração Angular difere do usado no App devido à compatibilidade.

Referências primárias:

- [Integração oficial Angular](https://github.com/tabler/tabler-icons/tree/main/packages/icons-angular)
- [Pacote oficial 3.49.0](https://www.npmjs.com/package/@tabler/icons-angular/v/3.49.0)
- [Adaptador utilizado no App](https://github.com/pierreavn/angular-tabler-icons)

## Arquitetura implementada

O módulo `DesignSystemIconsModule` foi mantido como ponte de compatibilidade. O nome histórico evita alterar dezenas de imports standalone. Sua responsabilidade agora é resolver nomes validados de Tabler e delegar o SVG ao `TablerIconComponent` oficial. Não fornece ícones próprios do Design System.

`admin-tabler-icons.ts` contém imports nomeados dos 141 símbolos usados e um Map construído a partir dos nomes publicados pela biblioteca. Não existe tabela manual de aliases. Os ícones são passados como objetos ao componente oficial; não registramos o catálogo completo em providers globais. Ícones não selecionados continuam sujeitos a tree-shaking.

O adaptador preserva o seletor `<i-tabler name="…">`, a estratégia Eager já corrigida e os imports existentes. Nenhum template de tela precisou ser modificado. Nomes desconhecidos não lançam exceções nem exibem um ícone falso: não renderizam SVG e geram aviso apenas em desenvolvimento. Os avisos são produzidos na mudança de input, não em cada ciclo de detecção.

A única regra global adicionada é limitada a `i-tabler > tabler-icon > svg`, para que o SVG ocupe as dimensões existentes do host. Ela não altera SVGs arbitrários. O tamanho padrão permanece 24, o traço outline permanece 2 e a cor é currentColor. Tamanhos icon-N, alinhamento, estados disabled e cores claras/escuras foram verificados no navegador. Layouts, espaçamentos de tela, tipografia e tokens não foram alterados.

## Manutenção e validação automática

```sh
npm run check:icons
npm run icons:sync
```

`check:icons` usa o parser HTML/Angular para os elementos de ícone e o AST TypeScript para fontes dinâmicas. Ele inspeciona templates externos, inline, blocos de controle, strings condicionais, propriedades icon/iconName, categorias, menu lateral e mapas locais retornados por métodos de ícones. Nomes desconhecidos ou válidos que não estão no registro fazem a verificação falhar. Erros de bindings não relacionados a ícones em páginas legadas de demonstração não impedem a inspeção dos próprios elementos de ícone.

`icons:sync` regenera o arquivo de imports seletivos após validar os nomes. Ao adicionar fontes dinâmicas externas novas, inclua-as em `dynamicSources` no script; os componentes associados a bindings dinâmicos são inspecionados automaticamente. Valores arbitrários vindos de APIs não podem ser enumerados estaticamente; continuam protegidos pelo aviso de desenvolvimento e pela ausência de fallback.

A verificação e seus cinco testes executam automaticamente antes de `npm test` e `npm run build:prod`. Os componentes standalone funcionam sem provider global de ícones.

## Dependências e arquivos

Adicionados com versão exata:

- `@tabler/icons-angular`: 3.49.0.
- `@tabler/icons`: 3.49.0, peer exigido pelo adaptador oficial.

Removido isoladamente: `@code2youlabs/icons` 0.3.0. Antes da remoção, a pesquisa em src/scripts mostrou que seu único consumidor havia sido o adaptador substituído, e `npm explain` confirmou que só era dependência direta do projeto.

Mantidos: `@code2youlabs/styles` 0.3.0, `@code2youlabs/tokens` 0.3.0, Spartan, Tailwind, Material, Feather, componentes locais do Design System e suas configurações. Não foram alteradas versões Angular ou regras de negócio.

Arquivos alterados:

- `package.json`
- `package-lock.json`
- `src/app/shared/design-system-icons.module.ts`
- `src/app/shared/admin-tabler-icons.ts`
- `src/app/shared/design-system-icons.module.spec.ts`
- `src/assets/scss/helpers/_icon-size.scss`
- `scripts/check-icons.mjs`
- `scripts/check-icons.test.mjs`
- `docs/admin-tabler-icons.md`

## Testes e build

| Verificação | Resultado |
| --- | --- |
| Baseline, ChromeHeadless com AOT | 96 testes aprovados |
| Baseline, build de produção | Aprovado, 96 warnings |
| Verificador de nomes | 402 referências / 141 nomes / 17 bindings validados |
| Testes do verificador | 5 aprovados |
| Suíte final, ChromeHeadless com AOT | 101 testes aprovados |
| Suíte final, execução padrão ChromeHeadless | 101 testes aprovados |
| Build final de produção | Aprovado, mesmos 96 warnings |
| git diff --check | Aprovado |

Os testes verificam o SVG e os nós reais de mail, todos os nomes registrados, o componente real do menu lateral, navegação e ações, ausência de fallback para nome inválido, filled, tamanho de 18 px, currentColor, traço e integração com botão disabled do Design System. As regressões de DOM após HTTP para Empresas, Funil e Clientes continuam passando, assim como os demais testes de loading.

Nenhum arquivo de serviço de tela, LoadingService, LoadingInterceptor, configuração HTTP ou estratégia de componente existente foi alterado. A busca final não encontrou consumidor nem referência de dependência ao pacote removido.

O bundle inicial passou de 465,51 kB para 503,83 kB; estimativa de transferência de 86,71 kB para 93,15 kB. O aumento de 38,32 kB brutos / 6,44 kB de transferência corresponde ao catálogo seletivo real, substituindo o antigo conjunto pequeno de aliases. Um símbolo não selecionado (`air-balloon-filled`) não está no JavaScript de produção.

## Base e pendências

A referência remota develop foi atualizada por fetch. Ela ainda não contém os commits locais de loading `e75b812` e `1b9cb01`. A branch de ícones foi criada a partir de `1b9cb01`, preservando integralmente as correções e o desenvolvimento local anterior, sem mover a develop nem executar merge. Para integração posterior, essa dependência precisa ser respeitada.

Os 96 warnings de build são exatamente os mesmos do baseline: 59 NG8107, 20 NG8113, 7 NG8102, 6 de depreciação Sass e 4 de interpolação Sass. O builder Karma/Webpack também já estava depreciado.

Não há infraestrutura E2E Playwright/Cypress no projeto. A validação de navegador usou ChromeHeadless e templates reais, incluindo menu e telas de regressão com HTTP simulado. A conferência visual autenticada de todas as telas em homologação não foi executada. Não foi criado push, PR ou merge.
