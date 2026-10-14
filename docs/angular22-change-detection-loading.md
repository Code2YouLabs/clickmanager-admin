# Regressão de renderização e loadings — Angular 22

Data: 14/10/2026. Base: `develop`, atualizada com `git pull --ff-only origin develop`; checkout inicial limpo. Branch: `fix/admin-change-detection-loading`.

## Causa raiz e comprovação

Desde o Angular 22, componentes sem `changeDetection` usam OnPush. O Admin já carregava `zone.js` e registrava `provideZoneChangeDetection({ eventCoalescing: true })`, mas os componentes legados continuavam atribuindo propriedades comuns em callbacks HTTP. O ciclo global executava, porém as views OnPush não eram verificadas. O overlay global continuava funcionando porque LoadingService altera o DOM diretamente.

Fonte oficial: https://angular.dev/guide/components/advanced-configuration e https://angular.dev/api/core/ChangeDetectionStrategy.

A migration oficial instalada (`@angular/core` 22.1.1, migration `change-detection-eager`, versão 22.0.0) foi executada com:

```sh
node node_modules/@angular/cli/bin/ng.js update @angular/core --migrate-only --name=change-detection-eager --allow-dirty
```

Ela foi executada novamente após os testes incluírem Billing e PricingCard no programa TypeScript. Ao todo, 106 componentes receberam Eager explícito. Os componentes com OnPush explícito não foram alterados. A configuração SmartCalc manteve Signals e a estratégia implícita OnPush, pois o seu fluxo de atualização é reativo; apenas o encerramento do estado de salvamento foi corrigido.

Controle negativo: temporariamente definir OnPush em Empresas, Funil e Clientes fez 10 testes de DOM falharem, com 16 testes de estado passando. As estratégias Eager foram restauradas automaticamente em `finally`. Isso comprova que os testes conseguem detectar a regressão, inclusive com os valores TypeScript corretos.

## Auditoria e correções de loading

- Empresas: cada consulta de lista, detalhe e adoção cancela a anterior antes de iniciar o novo estado; todas as consultas terminam na destruição. Lista vazia cancela detalhe/adoção e limpa a seleção. Adoção continua independente do detalhe. Erros de transformação da lista e resolução da seleção passam pelo canal de erro RxJS via `tap`, com `finalize` encerrando o loading.
- Funil: mantém a proteção por requestId e a deduplicação do mesmo filtro; cancela a consulta substituída, a consulta com período invalidado e as consultas na destruição. Retry, coorte vazia e erros mantêm seus estados existentes.
- Clientes (tela legada): cancela buscas substituídas e consultas na destruição, encerra loading em `finalize`, processa respostas sem corpo como lista vazia. O template real da tabela é usado nos testes de DOM.
- Funcionário: loading encerrado em erro, resposta vazia e retorno antecipado de funcionário desligado; transformação em `tap` permite tratar exceções. O autocomplete inicia loading na assinatura (`defer`) e finaliza em sucesso, erro e cancelamento pelo `switchMap` existente.
- Configuração SmartCalc: `salvando` era encerrado apenas em `complete`, que não executa após erro. Agora usa `finalize`, inclusive na destruição.
- Billing checkout: mesmo problema de `complete`; agora usa `finalize` e cancela na destruição, sem alterar endpoint, tratamento de acesso ou redirecionamento.
- Billing retorno: esgotar o polling sem resposta deixava loading ativo. O fluxo agora finaliza também na conclusão; reiniciar cancela a assinatura anterior antes de iniciar o estado novo.

A varredura dos demais estados `loading`, `isLoading` e `carregando*`, e de `subscribe`/`finalize`, identificou fluxos existentes com encerramento em sucesso/erro ou `finalize`; receberam a correção transversal de renderização onde dependiam da estratégia antiga. Não houve refatoração geral dos componentes. A única operação explícita `runOutsideAngular` encontrada está na criação do mapa amCharts de VisitUSA, sem relação com os loadings HTTP auditados.

LoadingService tinha uma corrida independente: `hide()` agendava `forceHide()` e uma nova `show()` não cancelava o timer. O timer antigo ocultava o overlay e liberava callbacks enquanto a nova consulta ainda estava ativa.

Agora o serviço mantém uma referência cancelável do timer, ignora `hide()` sem requisição ativa e verifica requisições antes de ocultar. O mínimo de um segundo é contado por período contínuo de overlay visível. Requisições iniciadas durante esse período cancelam o timer antigo. Callbacks são retirados da fila antes da execução, pausam se um callback iniciar nova requisição e encaminham exceções ao ErrorHandler. A destruição cancela timer, elimina callbacks e remove o overlay. Classes, markup e duração mínima existentes foram preservados.

O interceptor usa `defer` para contar assinaturas efetivas e `finalize` para sucesso, erro, cancelamento e falhas síncronas do próximo handler. Os timeouts de 30 s do interceptor e 15 s do Funil já existiam e não foram ampliados nem usados como correção de renderização.

## Bootstrap e configuração

`app.config.ts` já continha exatamente um `provideHttpClient(withInterceptorsFromDi())` e um `provideAnimationsAsync()`. Não havia duplicação na develop atualizada, portanto não foi necessário editar o arquivo. Ordem preservada: Auth → Loading → ErrorMessage. Os polyfills de aplicação continuam com `zone.js`, e os testes com `zone.js`/`zone.js/testing`. ApiService já limitava as respostas HTTP com `take(1)`; foi preservado. Autenticação, rotas, contratos backend, versões Angular e Design System foram preservados.

## Verificações

| Verificação | Resultado |
| --- | --- |
| Baseline, ChromeHeadless, execução padrão | 56 testes aprovados |
| Baseline, build de produção | Aprovado; 96 warnings |
| Controle negativo, AOT, três telas com OnPush | 10 falhas de DOM / 16 testes aprovados |
| Suíte final, ChromeHeadless, AOT | 96 testes aprovados |
| Suíte final, ChromeHeadless, execução padrão | 96 testes aprovados |
| Build final de produção | Aprovado; 96 warnings preexistentes |
| `git diff --check` | Aprovado |

Os testes usam HttpTestingController, serviços reais e templates reais de Empresas, Funil e Clientes. As respostas chegam dentro de NgZone; depois do HTTP não se chama `fixture.detectChanges()`. O ciclo global de ApplicationRef e a autodetecção verificam o DOM sem marcar artificialmente o componente como dirty. A execução AOT evita diferenças de compilação JIT que poderiam mascarar a estratégia implícita.

Cobertura global: requisição rápida/única, simultâneas, nova consulta durante o mínimo, erro, cancelamento, contador, callbacks reentrantes, erro de callback e destruição. Cobertura das telas: carregamento inicial, lista/indicadores/detalhe após 200, adoção independente e retry, resposta vazia, erro, filtros, concorrência, transformação e destruição. Há ainda regressões específicas de Funcionários, SmartCalc e Billing.

## Problemas preexistentes e limites

- Build: 59 warnings NG8107, 20 NG8113, 7 NG8102, 6 avisos de depreciação Sass e 4 de interpolação de cores Sass. A quantidade e os tipos permaneceram iguais ao baseline.
- O builder Karma/Webpack está depreciado. A troca de infraestrutura não fez parte desta tarefa.
- O sandbox impediu a abertura da porta Karma e abortou o primeiro build. Ambos foram executados com sucesso com permissão de execução local.
- Não existe configuração E2E Playwright/Cypress no projeto. As verificações de navegador ocorreram no ChromeHeadless com templates reais e HTTP simulado. Não foi realizada navegação autenticada contra um backend real; essa validação operacional continua recomendada em homologação.
- Eager restabelece o custo de detecção anterior à atualização; otimizações para OnPush/Signals devem ocorrer em tarefa própria.

## Arquivos alterados

106 componentes receberam a estratégia Eager. Além da migration, foram alterados os fluxos descritos acima, LoadingService e LoadingInterceptor, adicionados sete arquivos de testes e ampliados dois specs existentes. A lista completa abaixo permite conferir a abrangência sem resumir a correção apenas às telas de adoção.

- `src/app/app.component.ts`
- `src/app/components/card-header/card-header.component.ts`
- `src/app/components/cliente-selector-card/cliente-selector-card.component.ts`
- `src/app/components/dialog/confirm-dialog/confirm-dialog.component.ts`
- `src/app/components/endereco-form/endereco-form.component.ts`
- `src/app/components/filtro-pesquisa-card/filtro-pesquisa-card.component.ts`
- `src/app/components/inputs/input-data/input-data.component.ts`
- `src/app/components/inputs/input-options/input-options.component.ts`
- `src/app/components/inputs/input-textarea/input-textarea.component.ts`
- `src/app/components/itens-pedido-section/itens-pedido-section.component.ts`
- `src/app/components/manual-link/manual-link.component.ts`
- `src/app/components/observacoes-card/observacoes-card.component.ts`
- `src/app/components/pagamentos-section/pagamentos-section.component.ts`
- `src/app/components/page-card/page-card.component.ts`
- `src/app/components/pedido-fluxo-controles/pedido-fluxo-controles.component.ts`
- `src/app/components/pedido-fluxo-controles/pedido-trocar-status-dialog.component.ts`
- `src/app/components/pedido-info-card/pedido-info-card.component.ts`
- `src/app/components/pedido-tabela/pedido-tabela.component.ts`
- `src/app/components/preco/preco-selector.component.ts`
- `src/app/components/pricing-card/pricing-card.component.ts`
- `src/app/components/resumo-financeiro-card/resumo-financeiro-card.component.ts`
- `src/app/components/section-card/section-card.component.ts`
- `src/app/components/status-badge/status-badge.component.ts`
- `src/app/components/tabs-section-card/tabs-section-card.component.ts`
- `src/app/interceptors/loading.interceptor.spec.ts`
- `src/app/interceptors/loading.interceptor.ts`
- `src/app/layouts/blank/blank.component.ts`
- `src/app/layouts/full/full.component.ts`
- `src/app/layouts/full/shared/breadcrumb/breadcrumb.component.ts`
- `src/app/layouts/full/vertical/header/header.component.ts`
- `src/app/layouts/full/vertical/sidebar/branding.component.ts`
- `src/app/layouts/full/vertical/sidebar/nav-item/nav-item.component.ts`
- `src/app/layouts/full/vertical/sidebar/sidebar.component.ts`
- `src/app/pages/adocao/adocao-funil.component.spec.ts`
- `src/app/pages/adocao/adocao-funil.component.ts`
- `src/app/pages/ajuda/ajuda.component.ts`
- `src/app/pages/analytics/demo-funnel/demo-funnel.component.ts`
- `src/app/pages/apps/task/task.component.ts`
- `src/app/pages/atividades/atividades-admin.component.ts`
- `src/app/pages/authentication/boxed-login/boxed-login.component.ts`
- `src/app/pages/authentication/error/error.component.ts`
- `src/app/pages/billing/billing-pagamento/billing-pagamento.component.ts`
- `src/app/pages/billing/billing-pagamento/billing-pagamento.loading.spec.ts`
- `src/app/pages/billing/billing-return/billing-return.component.ts`
- `src/app/pages/billing/billing-return/billing-return.loading.spec.ts`
- `src/app/pages/cadastro-tecnico/acabamentos/form-acabamento/form-acabamento.component.ts`
- `src/app/pages/cadastro-tecnico/acabamentos/listar-acabamento/listar-acabamento.component.ts`
- `src/app/pages/cadastro-tecnico/acabamentos/variacoes-acabamento/variacoes-acabamento.component.ts`
- `src/app/pages/cadastro-tecnico/cores/form-cores/form-cores.component.ts`
- `src/app/pages/cadastro-tecnico/cores/listar-cores/listar-cores.component.ts`
- `src/app/pages/cadastro-tecnico/formatos/form-formato/form-formato.component.ts`
- `src/app/pages/cadastro-tecnico/formatos/listar-formato/listar-formato.component.ts`
- `src/app/pages/cadastro-tecnico/materiais/form-material/form-material.component.ts`
- `src/app/pages/cadastro-tecnico/materiais/listar-material/listar-material.component.ts`
- `src/app/pages/cadastro-tecnico/produtos/form-produto/politica-revenda/politica-revenda.component.ts`
- `src/app/pages/cadastro-tecnico/produtos/form-produto/variacoes-produto/variacoes-produto.component.ts`
- `src/app/pages/cadastro-tecnico/produtos/listar-produtos/listar-produtos.component.ts`
- `src/app/pages/cadastro-tecnico/servicos/form-servico/form-servico.component.ts`
- `src/app/pages/cadastro-tecnico/servicos/listar-servicos/listar-servicos.component.ts`
- `src/app/pages/cliente/form-cliente/form-cliente.component.ts`
- `src/app/pages/cliente/listar-cliente/listar-cliente.component.spec.ts`
- `src/app/pages/cliente/listar-cliente/listar-cliente.component.ts`
- `src/app/pages/cobranca-beneficios/cobranca-beneficios-admin.component.ts`
- `src/app/pages/config/email-servidor/email-servidor-teste-dialog.component.ts`
- `src/app/pages/config/email-servidor/email-servidor.component.ts`
- `src/app/pages/config/folha-config/folha-config.component.ts`
- `src/app/pages/dashboards/dashboard1/dashboard1.component.ts`
- `src/app/pages/empresa/empresa-form.component.ts`
- `src/app/pages/empresas/empresas-admin.component.spec.ts`
- `src/app/pages/empresas/empresas-admin.component.ts`
- `src/app/pages/funcionarios/components/dialog-motivo-status/dialog-motivo-status.component.ts`
- `src/app/pages/funcionarios/detalhe-funcionario/detalhe-funcionario.component.ts`
- `src/app/pages/funcionarios/form-funcionario/form-funcionario.component.ts`
- `src/app/pages/funcionarios/form-funcionario/form-funcionario.loading.spec.ts`
- `src/app/pages/funcionarios/listar-funcionarios/listar-funcionarios.component.ts`
- `src/app/pages/landing-acessos/landing-acessos-admin.component.ts`
- `src/app/pages/leads/leads-admin.component.ts`
- `src/app/pages/notificacoes-admin/notificacoes-admin.component.ts`
- `src/app/pages/onboarding/catalogo-admin/onboarding-catalogo-admin.component.ts`
- `src/app/pages/onboarding/catalogo-admin/onboarding-catalogo-item-form.component.ts`
- `src/app/pages/onboarding/catalogo-admin/onboarding-catalogo-produto-form.component.ts`
- `src/app/pages/pagamentos/pagamentos-admin.component.ts`
- `src/app/pages/pedido/detalhes-pedido/detalhes-pedido.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/dialog-adicionar-produto.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/preco-demanda-component/preco-demanda-config.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/preco-fixo-component/preco-fixo-config.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/preco-metro-component/preco-metro-config.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/preco-quantidade-component/preco-quantidade-config.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/steps/configurar-preco-step/configurar-preco-step.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/steps/escolher-variacao-step/escolher-variacao-step.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/steps/revisao-step/revisao-step.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/steps/selecionar-produto-step/selecionar-produto-step.component.ts`
- `src/app/pages/pedido/dialog-adicionar-produto/steps/servicos-step/servicos-step.component.ts`
- `src/app/pages/pedido/dialog-descrever-item/dialog-descrever-item.component.ts`
- `src/app/pages/pedido/form-pedido/form-pedido.component.ts`
- `src/app/pages/pedido/listar-pedido/listar-pedido.component.ts`
- `src/app/pages/perfil/gerenciar-perfil/gerenciar-perfil.component.ts`
- `src/app/pages/perfil/modal-perfil/perfil-dialog.component.ts`
- `src/app/pages/perfil/modal-trocar-perfil/trocar-perfil-dialog.component.ts`
- `src/app/pages/pessoas/folha/components/dialog-criar-acordo/dialog-criar-acordo.component.ts`
- `src/app/pages/pessoas/folha/components/dialog-criar-competencia/dialog-criar-competencia.component.ts`
- `src/app/pages/pessoas/folha/components/dialog-folha-whatsapp/dialog-folha-whatsapp.component.ts`
- `src/app/pages/pessoas/folha/components/dialog-renegociar-acordos/dialog-renegociar-acordos.component.ts`
- `src/app/pages/pessoas/folha/components/dialog-valor-acao/dialog-valor-acao.component.ts`
- `src/app/pages/pessoas/folha/detalhe-folha/detalhe-folha-pagamento.component.ts`
- `src/app/pages/pessoas/folha/listar-folha/listar-folha-pagamento.component.ts`
- `src/app/pages/planos/planos-admin.component.ts`
- `src/app/pages/site/home-sections/form-home-section/form-home-section.component.ts`
- `src/app/pages/site/home-sections/listar-home-sections/listar-home-sections.component.ts`
- `src/app/pages/smart-calc-config/smart-calc-config/smart-calc-config.component.ts`
- `src/app/pages/smart-calc-config/smart-calc-config/smart-calc-config.loading.spec.ts`
- `src/app/pages/starter/starter.component.ts`
- `src/app/pages/suporte/suporte.component.ts`
- `src/app/pages/usuarios/form-usuario/form-usuario.component.ts`
- `src/app/pages/usuarios/listar-usuarios/listar-usuarios.component.ts`
- `src/app/services/loading.service.spec.ts`
- `src/app/services/loading.service.ts`
- `src/app/shared/design-system-icons.module.ts`
- `docs/angular22-change-detection-loading.md`
